import crypto from "crypto";
import type { PlatformRequirementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateEstimate } from "@/lib/pricing/estimate-engine";
import { selectEstimateRule } from "@/lib/pricing/estimate-rules";
import { calculateMarketReference } from "@/lib/pricing/market-reference";

export type EstimateRequest = {
  productType: PlatformRequirementType;
  productId?: string | null;
  destination?: string | null;
  category?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  partySize?: number | null;
  roomCount?: number | null;
};

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() || "";
}

export async function createOrRefreshEstimate(input: EstimateRequest) {
  const now = new Date();
  const [allSnapshots, allRules] = await Promise.all([
    prisma.marketPriceSnapshot.findMany({
      where: {
        productType: input.productType,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        ...(process.env.NODE_ENV === "production" ? { isMock: false } : {}),
      },
      orderBy: { capturedAt: "desc" },
      take: 100,
    }),
    prisma.estimateRule.findMany({
      where: {
        productType: input.productType,
        active: true,
        ...(process.env.NODE_ENV === "production" ? { isMock: false } : {}),
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const productId = normalize(input.productId);
  const destination = normalize(input.destination);
  const matchingSnapshots = allSnapshots.filter((item) => {
    if (item.productId && productId && normalize(item.productId) === productId) return true;
    if (item.productId && normalize(item.productId) !== productId) return false;
    if (item.destination && destination) return destination.includes(normalize(item.destination));
    return !item.destination && !item.productId;
  });
  const reference = calculateMarketReference(matchingSnapshots);
  const rule = selectEstimateRule(allRules, input);
  const estimate = calculateEstimate(reference.price, reference.confidence, rule);
  const inputHash = crypto.createHash("sha256").update(JSON.stringify({
    ...input,
    destination: normalize(input.destination),
    category: normalize(input.category),
  })).digest("hex");
  const explanation = estimate.priceStatus === "ESTIMATED"
    ? `根据 ${reference.sampleSize} 条有效公开价格的中位数与当前配置规则生成，未使用随机数。`
    : "暂无足够公开价格数据或可用预估规则，需由旅行顾问人工确认。";

  const saved = await prisma.estimateResult.upsert({
    where: { inputHash },
    update: {
      marketReferencePrice: reference.price,
      estimatedMinPrice: estimate.minPrice,
      estimatedMaxPrice: estimate.maxPrice,
      confidence: estimate.confidence,
      priceStatus: estimate.priceStatus,
      ruleId: rule?.id ?? null,
      explanation,
    },
    create: {
      inputHash,
      productType: input.productType,
      productId: input.productId || null,
      marketReferencePrice: reference.price,
      estimatedMinPrice: estimate.minPrice,
      estimatedMaxPrice: estimate.maxPrice,
      confidence: estimate.confidence,
      priceStatus: estimate.priceStatus,
      ruleId: rule?.id ?? null,
      explanation,
    },
  });

  return {
    id: saved.id,
    marketReferencePrice: reference.price,
    estimatedMinPrice: estimate.minPrice,
    estimatedMaxPrice: estimate.maxPrice,
    savingsMin: estimate.savingsMin,
    savingsMax: estimate.savingsMax,
    confidence: estimate.confidence,
    priceStatus: estimate.priceStatus,
    sampleSize: reference.sampleSize,
    explanation,
  };
}
