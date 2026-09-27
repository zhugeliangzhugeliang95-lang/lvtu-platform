import { NextResponse } from "next/server";
import { z } from "zod";
import { createHandoffSummary } from "@/lib/ai-advisor/advisor";
import type { TravelProfile } from "@/lib/ai-advisor/types";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rateLimit";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";

const requestSchema = z.object({
  sessionId: z.string().regex(/^[A-Za-z0-9_-]{8,80}$/),
  customerName: z.string().trim().min(2).max(30),
  contact: z.string().trim().min(5).max(80),
  note: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;
  const limited = enforceRateLimit(request, "ai:handoff", { limit: 6, windowMs: 10 * 60_000 });
  if (limited) return limited;
  const json = await readLimitedJson(request, 16 * 1024);
  if (!json.ok) return json.response;
  const parsed = requestSchema.safeParse(json.data);
  if (!parsed.success) return validationError();

  const conversation = await prisma.aIConversation.findUnique({ where: { sessionKey: parsed.data.sessionId } });
  if (!conversation) return NextResponse.json({ error: "CONVERSATION_NOT_FOUND", message: "请先和AI顾问聊几句，再转人工" }, { status: 404 });

  let profile: TravelProfile = { preferences: [] };
  try { profile = { ...profile, ...JSON.parse(conversation.profileJson) }; } catch {}
  profile.customerName = parsed.data.customerName;
  profile.contact = parsed.data.contact;
  const summary = createHandoffSummary(profile, parsed.data.note);
  const handoff = await prisma.$transaction(async (tx) => {
    const created = await tx.aIHandoff.create({ data: {
      conversationId: conversation.id, customerName: parsed.data.customerName,
      contact: parsed.data.contact, summary,
    } });
    await tx.aIConversation.update({ where: { id: conversation.id }, data: {
      status: "HANDOFF_REQUESTED", profileJson: JSON.stringify(profile), summary,
      highValue: true, handoffReason: conversation.handoffReason || "用户主动请求人工顾问",
    } });
    return created;
  });
  return NextResponse.json({ apiVersion: "1", success: true, handoffId: handoff.id, status: "PENDING", summary });
}
