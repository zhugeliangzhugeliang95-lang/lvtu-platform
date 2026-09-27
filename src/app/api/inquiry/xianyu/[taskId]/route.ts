import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSupplierBotApi } from "@/lib/supplierBotAuth";
import { inquiryOwnerWhere, inquiryNotFound } from "@/lib/security/inquiryAccess";
import { enforceRateLimit } from "@/lib/rateLimit";
import { z } from "zod";
import { readLimitedJson, validationError } from "@/lib/security/request";

const taskUpdateSchema = z.object({
  status: z.enum(["PENDING", "SEARCHING", "MESSAGING", "WAITING_REPLIES", "AUTO_FOLLOWUP", "COLLECTING", "AI_ANALYZING", "QUOTED", "WAITING_HUMAN_CONFIRM", "NEEDS_HUMAN", "FAILED"]).optional(),
  sentCount: z.number().int().min(0).max(1000).optional(),
  aiSummary: z.string().max(20_000).optional(),
}).strict();

// GET /api/inquiry/xianyu/[taskId]
// 前台轮询任务状态 + 报价列表
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  try {
    const task = await prisma.xianYuTask.findFirst({
      where: { id: taskId, inquiry: { is: inquiryOwnerWhere(req) } },
      select: {
        id: true,
        status: true,
        sentCount: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          select: {
            id: true,
            sentAt: true,
            replied: true,
            repliedAt: true,
          },
          orderBy: { sentAt: "asc" },
        },
        quotes: {
          select: {
            id: true,
            pricePerNight: true,
            totalPrice: true,
            breakfastIncluded: true,
            cancellable: true,
            extraServices: true,
            createdAt: true,
          },
          orderBy: { totalPrice: "asc" },
        },
      },
    });

    if (!task) {
      return NextResponse.json(inquiryNotFound, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (e) {
    console.error("[xianyu/taskId GET] error:", e);
    return NextResponse.json({ error: "服务异常" }, { status: 500 });
  }
}

// PATCH /api/inquiry/xianyu/[taskId]
// 机器人更新任务状态
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = requireSupplierBotApi(req);
  if (!auth.ok) return auth.response;
  const limited = enforceRateLimit(req, "worker:xianyu-task-update", { limit: 120, windowMs: 60_000, identity: "supplier-worker" });
  if (limited) return limited;
  const { taskId } = await params;
  try {
    const json = await readLimitedJson(req, 32 * 1024);
    if (!json.ok) return json.response;
    const parsed = taskUpdateSchema.safeParse(json.data);
    if (!parsed.success) return validationError();
    const { status, sentCount, aiSummary } = parsed.data;

    const updated = await prisma.xianYuTask.update({
      where: { id: taskId },
      data: {
        ...(status !== undefined && { status }),
        ...(sentCount !== undefined && { sentCount }),
        ...(aiSummary !== undefined && { aiSummary }),
      },
    });

    return NextResponse.json({ task: updated });
  } catch (e) {
    console.error("[xianyu/taskId PATCH] error:", e);
    return NextResponse.json({ error: "服务异常" }, { status: 500 });
  }
}
