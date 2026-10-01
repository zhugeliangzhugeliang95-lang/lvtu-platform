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
  const payment = await prisma.membershipPayment.findUnique({ where: { paymentNo }, select: { id: true } });
  if (!payment) return NextResponse.json({ error: "付款申请不存在" }, { status: 404 });
  if (action === "reject") {
    const rejected = await prisma.membershipPayment.updateMany({ where: { id: payment.id, status: { in: ["PENDING", "USER_MARKED_PAID"] } }, data: { status: "REJECTED", confirmedAt: new Date(), confirmedBy: auth.session.adminId === "env-admin" ? null : auth.session.adminId } });
    if (!rejected.count) return NextResponse.json({ error: "当前付款申请不可拒绝" }, { status: 409 });
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }
  const config = await getMembershipConfig();
  const now = new Date();
  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.membershipPayment.findUnique({ where: { id: payment.id }, include: { membership: true, user: { select: { mobile: true } } } });
      if (!current || !["PENDING", "USER_MARKED_PAID"].includes(current.status)) throw new Error("当前付款申请不可确认");
      const claim = await tx.membershipPayment.updateMany({ where: { id: current.id, status: { in: ["PENDING", "USER_MARKED_PAID"] } }, data: { status: "CONFIRMED", confirmedAt: now, confirmedBy: auth.session.adminId === "env-admin" ? null : auth.session.adminId } });
      if (!claim.count) throw new Error("当前付款申请已被其他管理员处理");
      const membership = current.membership
        ? await tx.membership.update({ where: { id: current.membership.id }, data: (() => { const base = isMembershipActive(current.membership, now) && current.membership.expiresAt ? current.membership.expiresAt : now; const expiresAt = new Date(base.getTime() + config.days * 86400000); return { status: "ACTIVE" as const, startedAt: current.membership.startedAt && isMembershipActive(current.membership, now) ? current.membership.startedAt : now, expiresAt }; })() })
        : await tx.membership.create({ data: { userId: current.userId, memberNo: `LV${Date.now().toString(36).toUpperCase()}`, name: "旅途会员", phone: current.user.mobile || "", status: "ACTIVE", startedAt: now, expiresAt: new Date(now.getTime() + config.days * 86400000) } });
      const updatedPayment = await tx.membershipPayment.update({ where: { id: current.id }, data: { membershipId: membership.id } });
      await tx.notification.create({ data: { userId: current.userId, title: "旅途会员已开通", content: `会员已确认到账，有效期至 ${membership.expiresAt?.toLocaleDateString("zh-CN") || ""}。`, type: "MEMBERSHIP" } });
      return { membership, payment: updatedPayment };
    });
    return NextResponse.json({ ok: true, status: result.payment.status, membership: result.membership });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "确认失败" }, { status: 409 });
  }
}
