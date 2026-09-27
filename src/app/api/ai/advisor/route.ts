import { NextResponse } from "next/server";
import { z } from "zod";
import { advise } from "@/lib/ai-advisor/advisor";
import type { TravelProfile } from "@/lib/ai-advisor/types";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rateLimit";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";
import { getUserIdFromCookie } from "@/lib/userAuth";
import { getMembershipConfig, membershipState } from "@/lib/membership";

const profileSchema = z.object({
  customerName: z.string().max(30).optional(), contact: z.string().max(80).optional(),
  origin: z.string().max(40).optional(), destination: z.string().max(80).optional(),
  travelTime: z.string().max(80).optional(), duration: z.string().max(30).optional(), travelers: z.number().int().min(1).max(999).optional(),
  budget: z.string().max(80).optional(),
  travelType: z.enum(["情侣", "家庭", "朋友", "商务", "团队", "个人"]).optional(),
  preferences: z.array(z.string().max(20)).max(12).default([]),
  hotelLevel: z.enum(["经济", "舒适", "高端"]).optional(),
}).partial();

const requestSchema = z.object({
  sessionId: z.string().regex(/^[A-Za-z0-9_-]{8,80}$/),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) })).min(1).max(30),
  profile: profileSchema.optional(),
});

function parseProfile(raw: string | null | undefined): Partial<TravelProfile> {
  if (!raw) return {};
  try { return profileSchema.parse(JSON.parse(raw)); } catch { return {}; }
}

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;
  const limited = enforceRateLimit(request, "ai:advisor", { limit: 30, windowMs: 10 * 60_000 });
  if (limited) return limited;
  const json = await readLimitedJson(request, 72 * 1024);
  if (!json.ok) return json.response;
  const parsed = requestSchema.safeParse(json.data);
  if (!parsed.success) return validationError();

  const { sessionId, messages, profile: clientProfile } = parsed.data;
  const userId = await getUserIdFromCookie();
  let storedProfile: Partial<TravelProfile> = {};
  try {
    const existing = await prisma.aIConversation.findUnique({ where: { sessionKey: sessionId }, select: { profileJson: true } });
    storedProfile = parseProfile(existing?.profileJson);
  } catch (error) {
    console.error("[AI advisor profile read]", error);
  }

  const [membership, membershipConfig] = await Promise.all([
    userId ? prisma.membership.findFirst({ where: { userId }, orderBy: { createdAt: "desc" }, select: { status: true, expiresAt: true, phone: true } }) : null,
    getMembershipConfig(),
  ]);
  const result = await advise({
    messages,
    currentProfile: { ...storedProfile, ...clientProfile, preferences: clientProfile?.preferences ?? storedProfile.preferences ?? [] },
    membership: {
      state: membershipState(membership),
      expiresAt: membership?.expiresAt?.toISOString() || null,
      phoneSuffix: membership?.phone ? membership.phone.slice(-4) : null,
      price: membershipConfig.price,
    },
  });
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")!;

  try {
    const conversation = await prisma.aIConversation.upsert({
      where: { sessionKey: sessionId },
      create: {
        sessionKey: sessionId, userId, profileJson: JSON.stringify(result.profile),
        tagsJson: JSON.stringify([result.profile.travelType, ...result.profile.preferences].filter(Boolean)),
        highValue: result.highValue, handoffReason: result.handoffReason, lastMessageAt: new Date(),
      },
      update: {
        userId: userId || undefined, profileJson: JSON.stringify(result.profile),
        tagsJson: JSON.stringify([result.profile.travelType, ...result.profile.preferences].filter(Boolean)),
        highValue: result.highValue, handoffReason: result.handoffReason, lastMessageAt: new Date(),
      },
    });
    await prisma.$transaction([
      prisma.aIChatMessage.create({ data: { conversationId: conversation.id, role: "USER", content: lastUserMessage.content } }),
      prisma.aIChatMessage.create({ data: { conversationId: conversation.id, role: "ASSISTANT", content: result.message, modelName: result.model, taskType: result.task, sourceIdsJson: JSON.stringify(result.sourceIds) } }),
      prisma.aIModelCall.create({ data: {
        conversationId: conversation.id, taskType: result.task, modelName: result.model, provider: result.provider,
        latencyMs: result.latencyMs, success: true, inputTokens: result.usage?.inputTokens, outputTokens: result.usage?.outputTokens,
      } }),
    ]);
  } catch (error) {
    console.error("[AI advisor persistence]", error);
  }

  return NextResponse.json({ apiVersion: "1", sessionId, ...result });
}
