import { NextResponse } from "next/server";
import type { PlatformRequirementType } from "@prisma/client";
import { createOrRefreshEstimate } from "@/lib/services/estimate.service";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";

const TYPES = new Set<PlatformRequirementType>(["HOTEL", "FLIGHT", "TRAIN", "ACTIVITY", "CAR", "PACKAGE", "LOUNGE", "CUSTOM_TRIP", "OTHER"]);

export async function POST(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const parsed = await readLimitedJson(req, 16 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;
  const productType = String(body.productType || "OTHER").toUpperCase() as PlatformRequirementType;
  if (!TYPES.has(productType)) return NextResponse.json({ error: "不支持的服务类型" }, { status: 400 });
  try {
    const result = await createOrRefreshEstimate({
      productType,
      productId: typeof body.productId === "string" ? body.productId.slice(0, 160) : null,
      destination: typeof body.destination === "string" ? body.destination.slice(0, 160) : null,
      category: typeof body.category === "string" ? body.category.slice(0, 80) : null,
      startDate: typeof body.startDate === "string" ? body.startDate : null,
      endDate: typeof body.endDate === "string" ? body.endDate : null,
      partySize: Number.isFinite(Number(body.partySize)) ? Math.max(1, Number(body.partySize)) : null,
      roomCount: Number.isFinite(Number(body.roomCount)) ? Math.max(1, Number(body.roomCount)) : null,
    });
    return NextResponse.json({ ok: true, estimate: result });
  } catch (error) {
    console.error("[pricing estimate]", error);
    return NextResponse.json({ error: "预估暂时不可用，请提交需求让顾问确认" }, { status: 500 });
  }
}
