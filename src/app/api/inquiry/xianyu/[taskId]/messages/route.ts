import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSupplierBotApi } from "@/lib/supplierBotAuth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { readLimitedJson, validationError } from "@/lib/security/request";
import { z } from "zod";

const createMessageSchema = z.object({
  sellerId: z.string().trim().min(1).max(160),
  sellerName: z.string().trim().max(160).optional(),
  chatUrl: z.string().trim().max(1_000).optional(),
}).strict();

const updateMessageSchema = z.object({
  sellerId: z.string().trim().min(1).max(160),
  replyText: z.string().trim().max(12_000).optional(),
  chatUrl: z.string().trim().max(1_000).optional(),
}).strict();

// POST /api/inquiry/xianyu/[taskId]/messages
// 机器人记录已发送消息（每发一个商家调用一次）
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = requireSupplierBotApi(req);
  if (!auth.ok) return auth.response;
  const limited = enforceRateLimit(req, "worker:xianyu-message-create", { limit: 240, windowMs: 60_000, identity: "supplier-worker" });
  if (limited) return limited;

  const { taskId } = await params;
  try {
    const parsed = await readLimitedJson(req, 8 * 1024);
    if (!parsed.ok) return parsed.response;
    const input = createMessageSchema.safeParse(parsed.data);
    if (!input.success) return validationError();
    const { sellerId, sellerName, chatUrl } = input.data;

    const message = await prisma.xianYuMessage.create({
      data: {
        taskId,
        sellerId,
        sellerName: sellerName || null,
        chatUrl: chatUrl || null,
      },
    });

    // 更新已发送数量
    await prisma.xianYuTask.update({
      where: { id: taskId },
      data: { sentCount: { increment: 1 } },
    });

    return NextResponse.json({ message });
  } catch (e) {
    console.error("[xianyu/messages POST] error:", e);
    return NextResponse.json({ error: "服务异常" }, { status: 500 });
  }
}

// PATCH /api/inquiry/xianyu/[taskId]/messages
// 机器人更新某条消息的回复内容
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = requireSupplierBotApi(req);
  if (!auth.ok) return auth.response;
  const limited = enforceRateLimit(req, "worker:xianyu-message-update", { limit: 240, windowMs: 60_000, identity: "supplier-worker" });
  if (limited) return limited;

  const { taskId } = await params;
  try {
    const parsed = await readLimitedJson(req, 12 * 1024);
    if (!parsed.ok) return parsed.response;
    const input = updateMessageSchema.safeParse(parsed.data);
    if (!input.success) return validationError();
    const { sellerId, replyText, chatUrl } = input.data;

    if (!replyText && !chatUrl) return NextResponse.json({ error: "缺少参数" }, { status: 400 });

    const message = await prisma.xianYuMessage.findFirst({
      where: { taskId, sellerId },
      orderBy: { sentAt: "desc" },
    });

    if (!message) {
      return NextResponse.json({ error: "消息记录不存在" }, { status: 404 });
    }

    const updated = await prisma.xianYuMessage.update({
      where: { id: message.id },
      data: {
        ...(replyText && { replied: true, replyText, repliedAt: new Date() }),
        ...(chatUrl && { chatUrl }),
      },
    });

    return NextResponse.json({ message: updated });
  } catch (e) {
    console.error("[xianyu/messages PATCH] error:", e);
    return NextResponse.json({ error: "服务异常" }, { status: 500 });
  }
}
