import { NextRequest, NextResponse } from "next/server";
import type { XianYuTaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSupplierBotApi } from "@/lib/supplierBotAuth";
import { enforceRateLimit } from "@/lib/rateLimit";

const RESUMABLE_STATUSES: XianYuTaskStatus[] = [
  "SEARCHING",
  "MESSAGING",
  "WAITING_REPLIES",
  "AUTO_FOLLOWUP",
  "COLLECTING",
];
const STALE_TASK_MS = 2 * 60 * 1000;

const taskInclude = {
  inquiry: {
    select: {
      id: true,
      destination: true,
      checkInDate: true,
      checkOutDate: true,
      nights: true,
      guestCount: true,
      roomCount: true,
    },
  },
};

// GET /api/inquiry/xianyu/pending
// 调试查看：取下一个待处理的 PENDING 任务，不改变状态
export async function GET(req: NextRequest) {
  const auth = requireSupplierBotApi(req);
  if (!auth.ok) return auth.response;
  const limited = enforceRateLimit(req, "worker:xianyu-pending-read", { limit: 60, windowMs: 60_000, identity: "supplier-worker" });
  if (limited) return limited;
  try {
    const task = await prisma.xianYuTask.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: taskInclude,
    });

    return NextResponse.json({ task });
  } catch (e) {
    console.error("[xianyu/pending] error:", e);
    return NextResponse.json({ task: null });
  }
}

// POST /api/inquiry/xianyu/pending
// 机器人领取：取下一个 PENDING 任务并立即标记 SEARCHING，避免前台一直停在 5%。
export async function POST(req: NextRequest) {
  const auth = requireSupplierBotApi(req);
  if (!auth.ok) return auth.response;
  const limited = enforceRateLimit(req, "worker:xianyu-pending-claim", { limit: 30, windowMs: 60_000, identity: "supplier-worker" });
  if (limited) return limited;

  try {
    const task = await prisma.$transaction(async (tx) => {
      const staleBefore = new Date(Date.now() - STALE_TASK_MS);
      const nextTask = await tx.xianYuTask.findFirst({
        where: {
          OR: [
            { status: "PENDING" },
            { status: { in: RESUMABLE_STATUSES }, updatedAt: { lt: staleBefore } },
          ],
        },
        orderBy: { createdAt: "asc" },
        select: { id: true, status: true },
      });

      if (!nextTask) return null;

      return tx.xianYuTask.update({
        where: { id: nextTask.id },
        data: { status: nextTask.status === "PENDING" ? "SEARCHING" : nextTask.status },
        include: taskInclude,
      });
    });

    return NextResponse.json({ task });
  } catch (e) {
    console.error("[xianyu/pending POST] error:", e);
    return NextResponse.json({ task: null }, { status: 500 });
  }
}
