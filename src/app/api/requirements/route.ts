import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/userAuth";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";
import type { EstimateConfidence, PlatformRequirementType, PriceStatus } from "@prisma/client";

const typeMap: Record<string, PlatformRequirementType> = {
  HOTEL: "HOTEL",
  酒店: "HOTEL",
  FLIGHT: "FLIGHT",
  TRAIN: "TRAIN",
  ACTIVITY: "ACTIVITY",
  CUSTOM_TRIP: "CUSTOM_TRIP",
  ROUTE: "CUSTOM_TRIP",
  CUSTOM: "CUSTOM_TRIP",
  定制旅行: "CUSTOM_TRIP",
  CAR: "CAR",
  包车: "CAR",
  PACKAGE: "PACKAGE",
  LOUNGE: "LOUNGE",
  OTHER: "OTHER",
};

const confidenceValues = new Set<EstimateConfidence>(["HIGH", "MEDIUM", "LOW"]);
const priceStatusValues = new Set<PriceStatus>(["REFERENCE", "ESTIMATED", "PENDING_CONFIRMATION", "CONFIRMED", "EXPIRED", "UNAVAILABLE"]);
function optionalMoney(value: unknown) { const number = Number(value); return Number.isFinite(number) && number > 0 ? Math.round(number) : null; }
function optionalDate(value: unknown) { if (typeof value !== "string" || !value) return null; const date = new Date(`${value}T12:00:00+08:00`); return Number.isNaN(date.getTime()) ? null : date; }
function requirementNo() { return `RQ${Date.now().toString(36).toUpperCase()}${crypto.randomUUID().slice(0, 4).toUpperCase()}`; }

export async function POST(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const parsed = await readLimitedJson(req, 32 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;
  const type = typeMap[String(body.type || "OTHER").toUpperCase()] || "OTHER";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) return NextResponse.json({ error: "请填写需求内容" }, { status: 400 });
  const confidence = String(body.estimateConfidence || "") as EstimateConfidence;
  const priceStatus = String(body.priceStatus || "PENDING_CONFIRMATION") as PriceStatus;
  const requirement = await prisma.$transaction(async (tx) => {
    const created = await tx.requirement.create({ data: {
      requirementNo: requirementNo(), userId, type,
      productId: typeof body.productId === "string" ? body.productId.slice(0, 160) : null,
      productName: typeof body.productName === "string" ? body.productName.slice(0, 160) : null,
      destination: typeof body.destination === "string" ? body.destination.trim().slice(0, 160) : null,
      startDate: optionalDate(body.startDate), endDate: optionalDate(body.endDate),
      partySize: Number.isFinite(Number(body.partySize)) ? Math.max(1, Math.round(Number(body.partySize))) : null,
      content: content.slice(0, 5000), detailsJson: typeof body.detailsJson === "string" ? body.detailsJson.slice(0, 12000) : null,
      contactName: typeof body.contactName === "string" ? body.contactName.trim().slice(0, 80) : null,
      contactPhone: typeof body.contactPhone === "string" ? body.contactPhone.trim().slice(0, 30) : null,
      wechat: typeof body.wechat === "string" ? body.wechat.trim().slice(0, 80) : null,
      marketReferencePrice: optionalMoney(body.marketReferencePrice), estimatedMinPrice: optionalMoney(body.estimatedMinPrice), estimatedMaxPrice: optionalMoney(body.estimatedMaxPrice),
      estimateConfidence: confidenceValues.has(confidence) ? confidence : null,
      priceStatus: priceStatusValues.has(priceStatus) ? priceStatus : "PENDING_CONFIRMATION",
      status: "SUBMITTED",
    }});
    if (typeof body.estimateId === "string" && body.estimateId) await tx.estimateResult.updateMany({ where: { id: body.estimateId, requirementId: null }, data: { requirementId: created.id } });
    await tx.notification.create({ data: { userId, title: "需求提交成功", content: `需求 ${created.requirementNo || created.id.slice(-8)} 已提交，旅行顾问将人工确认实际可订方案。`, type: "REQUIREMENT" } });
    return created;
  });
  return NextResponse.json({ ok: true, id: requirement.id, status: requirement.status }, { status: 201 });
}

export async function GET() {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const requirements = await prisma.requirement.findMany({
    where: { userId }, orderBy: { createdAt: "desc" }, include: { quotes: { orderBy: { createdAt: "desc" } } }, take: 50,
  });
  return NextResponse.json({ requirements });
}
