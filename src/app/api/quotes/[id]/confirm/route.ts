import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/userAuth";
import { requireTrustedOrigin } from "@/lib/security/request";
import crypto from "crypto";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const { id } = await params;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.findUnique({ include: { requirement: true }, where: { id } });
      if (!quote || quote.requirement.userId !== userId) throw new Error("报价不存在");
      if (quote.status !== "SENT") throw new Error("该报价当前不可确认");
      if (quote.expireAt && quote.expireAt <= new Date()) {
        await tx.quote.update({ where: { id }, data: { status: "EXPIRED" } });
        throw new Error("该报价已失效，请联系顾问重新确认");
      }
      const dates = quote.requirement.content.match(/20\d{2}-\d{2}-\d{2}/g) || [];
      const travelDate = dates[0] ? new Date(`${dates[0]}T12:00:00+08:00`) : null;
      const order = await tx.order.create({
        data: {
          orderNo: `TG${Date.now().toString(36).toUpperCase()}${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
          userId,
          requirementId: quote.requirementId,
          productId: quote.requirement.productId,
          productName: quote.requirement.productName || "旅途定制服务",
          amount: quote.price,
          orderStatus: "PENDING_PAYMENT",
          paymentStatus: "UNPAID",
          remark: quote.description,
          travelDate,
        },
      });
      await tx.quote.update({ where: { id }, data: { status: "ACCEPTED" } });
      await tx.requirement.update({ where: { id: quote.requirementId }, data: { status: "WAITING_PAYMENT", priceStatus: "CONFIRMED" } });
      await tx.notification.create({ data: { userId, title: "确认预订成功", content: `订单 ${order.orderNo} 已生成，请按页面说明提交付款凭证。`, type: "ORDER" } });
      return order;
    });
    return NextResponse.json({ ok: true, orderId: result.id, orderNo: result.orderNo });
  } catch (error) {
    const message = error instanceof Error ? error.message : "确认失败";
    if (message.includes("已失效")) await prisma.quote.updateMany({ where: { id, status: "SENT" }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
