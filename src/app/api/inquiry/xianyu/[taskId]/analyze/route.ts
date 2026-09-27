import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSupplierBotApi } from "@/lib/supplierBotAuth";
import { refreshXianYuQuoteSummary } from "@/lib/xianyuSummary";
import { enforceRateLimit } from "@/lib/rateLimit";

// POST /api/inquiry/xianyu/[taskId]/analyze
// 机器人触发：汇总报价，生成最终报价摘要，更新询价单状态
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = requireSupplierBotApi(req);
  if (!auth.ok) return auth.response;
  const limited = enforceRateLimit(req, "worker:xianyu-analyze", { limit: 20, windowMs: 10 * 60_000, identity: "supplier-worker" });
  if (limited) return limited;

  const { taskId } = await params;

  try {
    const summary = await refreshXianYuQuoteSummary(taskId);

    if (!summary) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    return NextResponse.json({ summary });
  } catch (e) {
    console.error("[xianyu/analyze POST] error:", e);
    await prisma.xianYuTask
      .update({
        where: { id: taskId },
        data: { status: "FAILED" },
      })
      .catch(() => {});
    return NextResponse.json({ error: "分析失败" }, { status: 500 });
  }
}
