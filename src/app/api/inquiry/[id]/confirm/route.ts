import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateStaffSummary } from "@/lib/openai";
import { inquiryContactSchema } from "@/lib/inquirySchemas";
import { enforceRateLimit } from "@/lib/rateLimit";
import { inquiryAccessWhere, inquiryNotFound } from "@/lib/security/inquiryAccess";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";

type Params = { params: Promise<{ id: string }> };

/** POST /api/inquiry/[id]/confirm — 保存联系方式并为完整酒店需求排队供应商询价。 */
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const originError = requireTrustedOrigin(req);
    if (originError) return originError;
    const limited = enforceRateLimit(req, "inquiry:confirm", { limit: 10, windowMs: 10 * 60_000 });
    if (limited) return limited;
    const json = await readLimitedJson(req, 8 * 1024);
    if (!json.ok) return json.response;
    const parsed = inquiryContactSchema.safeParse(json.data);
    if (!parsed.success) return validationError();
    const { contactName, contactPhone } = parsed.data;

    const existing = await prisma.inquiryOrder.findFirst({ where: inquiryAccessWhere(req, id) });
    if (!existing) return NextResponse.json(inquiryNotFound, { status: 404 });

    const updated = await prisma.inquiryOrder.update({
      where: { id },
      data: {
        contactName,
        contactPhone,
      },
    });

    // 不记录姓名和手机号；联系方式提交不是交易状态变更。
    await prisma.inquiryOrderStatusLog.create({
      data: {
        orderId: id,
        fromStatus: existing.status,
        toStatus: existing.status,
        remark: "用户已提交联系方式，等待人工确认与报价",
      },
    });

    // 联系方式提交后，如果日期和目的地已经完整，自动创建供应商询价任务。
    // 机器人（例如豆包/闲鱼 Worker）会从 PENDING 队列领取，前台通过订单页轮询进度。
    let supplierTaskId: string | null = null;
    if (existing.destination && existing.checkInDate && existing.checkOutDate && existing.status !== "CANCELLED") {
      const existingTask = await prisma.xianYuTask.findFirst({
        where: { inquiryId: id, status: { not: "FAILED" } },
        select: { id: true },
      });
      if (existingTask) {
        supplierTaskId = existingTask.id;
      } else {
        const nights = existing.nights ?? Math.max(
          1,
          Math.ceil((existing.checkOutDate.getTime() - existing.checkInDate.getTime()) / 86_400_000),
        );
        const task = await prisma.xianYuTask.create({
          data: {
            inquiryId: id,
            hotelName: existing.destination,
            city: existing.destination,
            checkInDate: existing.checkInDate.toISOString().slice(0, 10),
            checkOutDate: existing.checkOutDate.toISOString().slice(0, 10),
            nights,
            guestCount: existing.guestCount,
            roomCount: existing.roomCount,
            status: "PENDING",
          },
          select: { id: true },
        });
        supplierTaskId = task.id;
        await prisma.inquiryOrder.update({ where: { id }, data: { status: "WAITING_PROCUREMENT" } });
        await prisma.inquiryOrderStatusLog.create({
          data: {
            orderId: id,
            fromStatus: existing.status,
            toStatus: "WAITING_PROCUREMENT",
            remark: "已进入供应商询价队列，等待机器人收集报价",
          },
        });
      }
    }

    // 后台生成简报（非阻塞）
    void (async () => {
      try {
        const requirements = existing.aiStructuredJson
          ? JSON.parse(existing.aiStructuredJson)
          : { destination: existing.destination };
        const summary = await generateStaffSummary({
          requirements,
          orderNo: existing.orderNo,
        });
        await prisma.inquiryOrder.update({
          where: { id },
          data: { aiStaffSummary: summary },
        });
      } catch (e) {
        console.error("[staff summary error]", e);
      }
    })();

    return NextResponse.json({ success: true, order: updated, supplierTaskId, message: supplierTaskId ? "需求已提交，正在向供应商询价" : "询价已提交，等待人工确认/报价" });
  } catch (e) {
    console.error("[POST /api/inquiry/[id]/confirm]", e);
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
