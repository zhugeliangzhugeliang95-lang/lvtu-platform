import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRole, requireAdminApi } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";

export const dynamic = "force-dynamic";

function safeJson<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const [total, active, highValue, pendingHandoffs, conversations, handoffs, knowledge, modelCalls] = await Promise.all([
    prisma.aIConversation.count(),
    prisma.aIConversation.count({ where: { status: "ACTIVE" } }),
    prisma.aIConversation.count({ where: { highValue: true } }),
    prisma.aIHandoff.count({ where: { status: "PENDING" } }),
    prisma.aIConversation.findMany({
      orderBy: { lastMessageAt: "desc" }, take: 50,
      include: { messages: { orderBy: { createdAt: "desc" }, take: 8 } },
    }),
    prisma.aIHandoff.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.aIKnowledgeDocument.findMany({ orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.aIModelCall.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  return NextResponse.json({
    counters: { total, active, highValue, pendingHandoffs },
    conversations: conversations.map((item) => ({
      ...item,
      profile: safeJson(item.profileJson, {}),
      tags: safeJson(item.tagsJson, []),
      messages: [...item.messages].reverse(),
    })),
    handoffs,
    knowledge: knowledge.map((item) => ({ ...item, keywords: safeJson(item.keywordsJson, []) })),
    modelCalls,
  });
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("takeover"), conversationId: z.string().min(8).max(80) }),
  z.object({ action: z.literal("knowledge.create"), category: z.enum(["DESTINATION", "HOTEL", "ITINERARY", "FAQ"]), title: z.string().trim().min(2).max(120), city: z.string().trim().max(40).optional(), content: z.string().trim().min(10).max(10_000), keywords: z.array(z.string().max(30)).max(20).default([]) }),
  z.object({ action: z.literal("knowledge.toggle"), documentId: z.string().min(8).max(80), enabled: z.boolean() }),
]);

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;
  const json = await readLimitedJson(request, 24 * 1024);
  if (!json.ok) return json.response;
  const parsed = actionSchema.safeParse(json.data);
  if (!parsed.success) return validationError();
  const input = parsed.data;

  if (input.action === "takeover") {
    await prisma.$transaction([
      prisma.aIConversation.update({ where: { id: input.conversationId }, data: { status: "HUMAN_TAKEN_OVER", assignedAdminId: auth.session.adminId, humanTakeoverAt: new Date() } }),
      prisma.aIHandoff.updateMany({ where: { conversationId: input.conversationId, status: "PENDING" }, data: { status: "TAKEN_OVER", assignedAdminId: auth.session.adminId, handledAt: new Date() } }),
    ]);
    return NextResponse.json({ success: true });
  }

  if (!isAdminRole(auth.session)) return NextResponse.json({ error: "FORBIDDEN", message: "仅管理员可修改知识库" }, { status: 403 });
  if (input.action === "knowledge.create") {
    const document = await prisma.aIKnowledgeDocument.create({ data: {
      category: input.category, title: input.title, city: input.city || null,
      content: input.content, keywordsJson: JSON.stringify(input.keywords),
    } });
    return NextResponse.json({ success: true, document });
  }
  await prisma.aIKnowledgeDocument.update({ where: { id: input.documentId }, data: { enabled: input.enabled } });
  return NextResponse.json({ success: true });
}

