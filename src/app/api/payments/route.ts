import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/userAuth";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";

export async function POST(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const parsed = await readLimitedJson(req, 16 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;
  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  const method = body.method === "ALIPAY" ? "ALIPAY" : body.method === "BANK_TRANSFER" ? "BANK_TRANSFER" : "WECHAT";
  if (!orderId) return NextResponse.json({ error: "缺少订单" }, { status: 400 });
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  if (order.orderStatus !== "PENDING_PAYMENT") return NextResponse.json({ error: "当前订单无需付款" }, { status: 400 });
  const payment = await prisma.payment.create({ data: { orderId, method, proofImage: typeof body.proofImage === "string" ? body.proofImage.slice(0, 500) : null, note: typeof body.note === "string" ? body.note.slice(0, 500) : null, status: "SUBMITTED" } });
  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "UNPAID" } });
  return NextResponse.json({ ok: true, id: payment.id, status: payment.status }, { status: 201 });
}
