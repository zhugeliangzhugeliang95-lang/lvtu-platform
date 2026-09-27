import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSupplierBotApi } from "@/lib/supplierBotAuth";
import { enforceRateLimit } from "@/lib/rateLimit";

// GET /api/robot/tasks/next — 取下一条 pending 任务
export async function GET(req: NextRequest) {
  const auth = requireSupplierBotApi(req);
  if (!auth.ok) return auth.response;
  const limited = enforceRateLimit(req, "worker:robot-task-next", { limit: 60, windowMs: 60_000, identity: "supplier-worker" });
  if (limited) return limited;
  const task = await prisma.robotTask.findFirst({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    include: {
      lead: {
        select: {
          id: true,
          name: true,
          wechat: true,
          destination: true,
          travelDate: true,
          peopleCount: true,
          aiRequestNote: true,
          aiOpening: true,
          status: true,
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ task: null });
  }

  return NextResponse.json({ task });
}
