import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rateLimit";
import { requireTrustedOrigin } from "@/lib/security/request";

// POST /api/inquiry/xianyu/[taskId]/confirm-deal
// 兼容附件指定路径：后台确认成交，将订单推进到 WAITING_PROCUREMENT。
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const limited = enforceRateLimit(req, "admin:xianyu-confirm-deal", { limit: 20, windowMs: 10 * 60_000, identity: auth.session.adminId });
  if (limited) return limited;

  const { taskId } = await params;

  try {
    const task = await prisma.xianYuTask.findUnique({
      where: { id: taskId },
      select: { inquiryId: true },
    });

    if (!task) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    await Promise.all([
      prisma.inquiryOrder.update({
        where: { id: task.inquiryId },
        data: { status: "WAITING_PROCUREMENT" },
      }),
      prisma.xianYuTask.update({
        where: { id: taskId },
        data: { status: "WAITING_HUMAN_CONFIRM" },
      }),
    ]);

    return NextResponse.json({ ok: true, inquiryId: task.inquiryId });
  } catch (e) {
    console.error("[xianyu confirm-deal] error:", e);
    return NextResponse.json({ error: "服务异常" }, { status: 500 });
  }
}
