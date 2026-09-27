import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateStaffSummary } from "@/lib/openai";
import { inquiryContactSchema } from "@/lib/inquirySchemas";
import { enforceRateLimit } from "@/lib/rateLimit";
import { inquiryAccessWhere, inquiryNotFound } from "@/lib/security/inquiryAccess";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";

type Params = { params: Promise<{ id: string }> };

/** POST /api/inquiry/[id]/confirm — 兼容旧前端：只保存联系方式，不推进支付状态。 */
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

    return NextResponse.json({ success: true, order: updated, message: "询价已提交，等待人工确认/报价" });
  } catch (e) {
    console.error("[POST /api/inquiry/[id]/confirm]", e);
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
