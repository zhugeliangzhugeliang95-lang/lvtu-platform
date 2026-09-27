import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/userAuth";
import { getMembershipConfig, isMembershipActive, makeMemberNo, makeMembershipPaymentNo } from "@/lib/membership";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";
import { enforceRateLimit } from "@/lib/rateLimit";

function validPhone(value: string) { return /^1[3-9]\d{9}$/.test(value.replace(/[\s-]/g, "")); }

export async function GET() {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const [membership, latestPayment, config] = await Promise.all([
    prisma.membership.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.membershipPayment.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    getMembershipConfig(),
  ]);
  return NextResponse.json({ membership, latestPayment, active: isMembershipActive(membership), config });
}

export async function POST(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const limited = enforceRateLimit(req, "membership:create-payment", { limit: 5, windowMs: 10 * 60_000 });
  if (limited) return limited;
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const parsed = await readLimitedJson(req, 8 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 50) : "";
  const phone = typeof body.phone === "string" ? body.phone.replace(/[\s-]/g, "").slice(0, 20) : "";
  if (name.length < 1 || name.length > 50 || !validPhone(phone)) return validationError();
  if (body.agreed !== true) return NextResponse.json({ error: "请先同意会员服务协议" }, { status: 400 });
  const config = await getMembershipConfig();
  if (!config.enabled) return NextResponse.json({ error: "会员服务暂未开放" }, { status: 409 });
  const membership = await prisma.membership.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  const pending = await prisma.membershipPayment.findFirst({ where: { userId, status: { in: ["PENDING", "USER_MARKED_PAID"] } }, orderBy: { createdAt: "desc" } });
  if (pending) return NextResponse.json({ paymentNo: pending.paymentNo, membershipId: pending.membershipId, status: pending.status, config });
  const created = await prisma.$transaction(async (tx) => {
    const nextMembership = membership
      ? await tx.membership.update({ where: { id: membership.id }, data: { name, phone, status: isMembershipActive(membership) ? "ACTIVE" : "PENDING" } })
      : await tx.membership.create({ data: { userId, memberNo: makeMemberNo(), name, phone, status: "PENDING" } });
    const payment = await tx.membershipPayment.create({ data: { paymentNo: makeMembershipPaymentNo(), userId, membershipId: nextMembership.id, amount: config.price, method: "WECHAT", status: "PENDING" } });
    return { membership: nextMembership, payment };
  });
  return NextResponse.json({ paymentNo: created.payment.paymentNo, membershipId: created.membership.id, status: created.payment.status, config }, { status: 201 });
}

export async function PATCH(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const parsed = await readLimitedJson(req, 4 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;
  const paymentNo = typeof body.paymentNo === "string" ? body.paymentNo.trim() : "";
  if (!paymentNo) return validationError();
  const payment = await prisma.membershipPayment.findFirst({ where: { paymentNo, userId } });
  if (!payment) return NextResponse.json({ error: "付款申请不存在" }, { status: 404 });
  if (payment.status === "CONFIRMED") return NextResponse.json({ ok: true, status: payment.status });
  if (!["PENDING", "USER_MARKED_PAID"].includes(payment.status)) return NextResponse.json({ error: "当前付款申请不可更新" }, { status: 409 });
  const updated = await prisma.membershipPayment.update({ where: { id: payment.id }, data: { status: "USER_MARKED_PAID", remark: typeof body.remark === "string" ? body.remark.trim().slice(0, 500) : payment.remark } });
  return NextResponse.json({ ok: true, status: updated.status });
}
