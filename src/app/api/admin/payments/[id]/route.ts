import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;

  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = await readLimitedJson(req, 4 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as { action?: unknown };
  const action = body?.action === "REJECT" ? "REJECT" : "APPROVE";

  try {
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id },
        include: { order: { include: { requirement: { select: { content: true } } } } },
      });
      if (!payment) throw new Error("付款记录不存在");
      if (payment.status !== "SUBMITTED") throw new Error("该付款记录已完成审核");

      if (action === "REJECT") {
        const rejected = await tx.payment.update({
          where: { id },
          data: { status: "REJECTED", reviewedBy: auth.session.adminId, reviewedAt: new Date() },
        });
        await tx.notification.create({ data: { userId: payment.order.userId, title: "付款凭证需要重新提交", content: `订单 ${payment.order.orderNo} 的付款凭证暂未通过审核，请核对后重新上传或联系顾问。`, type: "PAYMENT" } });
        return rejected;
      }

      const updated = await tx.payment.update({
        where: { id },
        data: { status: "APPROVED", reviewedBy: auth.session.adminId, reviewedAt: new Date() },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: "PAID", orderStatus: "FULFILLING" },
      });
      if (payment.order.requirementId) await tx.requirement.update({ where: { id: payment.order.requirementId }, data: { status: "FULFILLING" } });
      await tx.notification.create({ data: { userId: payment.order.userId, title: "付款凭证审核成功", content: `订单 ${payment.order.orderNo} 已进入人工预订与履约流程。`, type: "PAYMENT" } });

      return updated;
    });
    return NextResponse.json({ ok: true, payment: result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "审核失败" }, { status: 400 });
  }
}
