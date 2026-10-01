import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/userAuth";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";
import { analyzePaymentProof } from "@/lib/payment-proof";

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
  const proofImage = typeof body.proofImage === "string" && /^\/api\/uploads\/payment-[a-f0-9]{32}\.webp$/.test(body.proofImage) ? body.proofImage : "";
  if (!proofImage) return NextResponse.json({ error: "请先上传付款凭证" }, { status: 400 });
  const payment = await prisma.payment.create({ data: { orderId, method, proofImage, note: typeof body.note === "string" ? body.note.slice(0, 500) : null, status: "SUBMITTED" } });
  const ai = await analyzePaymentProof({ proofImage, expectedAmount: order.amount, paymentNo: order.orderNo });
  const checked = await prisma.payment.update({ where: { id: payment.id }, data: { proofAiStatus: ai.status, proofAiSummary: ai.summary, proofAiJson: JSON.stringify({ amount: ai.amount, transactionTime: ai.transactionTime, recipient: ai.recipient, confidence: ai.confidence, rawText: ai.rawText ?? null }), proofAiCheckedAt: new Date() } });
  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "UNPAID" } });
  return NextResponse.json({ ok: true, id: checked.id, status: checked.status, ai: { status: ai.status, confidence: ai.confidence, amount: ai.amount, summary: ai.summary } }, { status: 201 });
}
