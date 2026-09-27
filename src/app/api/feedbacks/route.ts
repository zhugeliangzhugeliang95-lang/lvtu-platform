import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rateLimit";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";
import { getUserIdFromCookie } from "@/lib/userAuth";

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

const typeAllowed = ["SUGGESTION", "COMPLAINT", "REVIEW"] as const;
type FeedbackTypeValue = (typeof typeAllowed)[number];

export async function POST(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const limited = enforceRateLimit(req, "feedback:create", { limit: 6, windowMs: 10 * 60_000 });
  if (limited) return limited;
  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const parsed = await readLimitedJson(req, 24 * 1024);
  if (!parsed.ok) return parsed.response;
  if (!parsed.data || typeof parsed.data !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = parsed.data as Record<string, unknown>;
  const feedbackType = String(payload.feedbackType || "SUGGESTION").toUpperCase();
  const title = payload.title;
  const content = payload.content;
  const contactMobile = payload.contactMobile;
  const needCallback = Boolean(payload.needCallback);
  const images = payload.images;
  const orderId = payload.orderId;

  if (!isNonEmptyString(title)) return NextResponse.json({ error: "请填写标题" }, { status: 400 });
  if (!isNonEmptyString(content)) return NextResponse.json({ error: "请填写内容" }, { status: 400 });

  const typeValue = typeAllowed.includes(feedbackType as FeedbackTypeValue) ? (feedbackType as FeedbackTypeValue) : "SUGGESTION";

  let imagesValue: string | null = null;
  if (Array.isArray(images)) {
    const cleaned = images
      .filter((x) => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 6);
    imagesValue = cleaned.length ? JSON.stringify(cleaned) : null;
  }

  let connectOrderId: string | null = null;
  if (typeof orderId === "string" && orderId.trim()) {
    const owned = await prisma.order.findFirst({ where: { id: orderId.trim(), userId }, select: { id: true } });
    if (owned) connectOrderId = owned.id;
  }

  await prisma.feedback.create({
    data: {
      userId,
      orderId: connectOrderId,
      feedbackType: typeValue,
      title: title.trim().slice(0, 80),
      content: content.trim().slice(0, 2000),
      images: imagesValue,
      contactMobile: isNonEmptyString(contactMobile) ? contactMobile.trim().slice(0, 40) : null,
      needCallback,
      status: "UNPROCESSED",
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
