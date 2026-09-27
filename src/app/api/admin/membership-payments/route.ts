import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi, hasRole } from "@/lib/adminAuth";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";
import { getMembershipConfig, isMembershipActive } from "@/lib/membership";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const payments = await prisma.membershipPayment.findMany({ where: { status: { in: ["PENDING", "USER_MARKED_PAID", "CONFIRMED", "REJECTED"] } }, include: { user: { select: { id: true, email: true, mobile: true, nickname: true } }, membership: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ payments });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  if (!hasRole(auth.session, "SUPER_ADMIN", "OPS")) return NextResponse.json({ error: "无权操作会员付款" }, { status: 403 });
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const parsed = await readLimitedJson(req, 8 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;
  const paymentNo = typeof body.paymentNo === "string" ? body.paymentNo.trim() : "";
  const action = body.action === "confirm" || body.action === "reject" ? body.action : "";
  if (!paymentNo || !action) return validationError();
  const payment = await prisma.membershipPayment.findUnique({ where: { paymentNo }, include: { membership: true, user: { select: { mobile: true } } } });
  if (!payment) return NextResponse.json({ error: "付款申请不存在" }, { status: 404 });
  if (action === "reject") {
    const updated = await prisma.membershipPayment.update({ where: { id: payment.id }, data: { status: "REJECTED", confirmedAt: new Date(), confirmedBy: auth.session.adminId === "env-admin" ? null : auth.session.adminId } });
    return NextResponse.json({ ok: true, status: updated.status });
  }
  if (!["PENDING", "USER_MARKED_PAID"].includes(payment.status)) return NextResponse.json({ error: "当前付款申请不可确认" }, { status: 409 });
  const config = await getMembershipConfig();
  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const membership = payment.membership
      ? await tx.membership.update({ where: { id: payment.membership.id }, data: (() => { const base = isMembershipActive(payment.membership, now) && payment.membership.expiresAt ? payment.membership.expiresAt : now; const expiresAt = new Date(base.getTime() + config.days * 86400000); return { status: "ACTIVE" as const, startedAt: payment.membership.startedAt && isMembershipActive(payment.membership, now) ? payment.membership.startedAt : now, expiresAt }; })() })
      : await tx.membership.create({ data: { userId: payment.userId, memberNo: `LV${Date.now().toString(36).toUpperCase()}`, name: "旅途会员", phone: payment.user.mobile || "", status: "ACTIVE", startedAt: now, expiresAt: new Date(now.getTime() + config.days * 86400000) } });
    const updatedPayment = await tx.membershipPayment.update({ where: { id: payment.id }, data: { status: "CONFIRMED", confirmedAt: now, confirmedBy: auth.session.adminId === "env-admin" ? null : auth.session.adminId, membershipId: membership.id } });
    await tx.notification.create({ data: { userId: payment.userId, title: "旅途会员已开通", content: `会员已确认到账，有效期至 ${membership.expiresAt?.toLocaleDateString("zh-CN") || ""}。`, type: "MEMBERSHIP" } });
    return { membership, payment: updatedPayment };
  });
  return NextResponse.json({ ok: true, status: result.payment.status, membership: result.membership });
}
