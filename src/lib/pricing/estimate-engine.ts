import type { EstimateCalculation, EstimateConfidence, EstimateRuleInput } from "./types";

const CONFIDENCE_RANK: Record<EstimateConfidence, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };

function lowerConfidence(a: EstimateConfidence, b: EstimateConfidence): EstimateConfidence {
  return CONFIDENCE_RANK[a] <= CONFIDENCE_RANK[b] ? a : b;
}

function roundToTen(value: number) {
  return Math.max(0, Math.round(value / 10) * 10);
}

export function calculateEstimate(
  marketReferencePrice: number | null,
  marketConfidence: EstimateConfidence,
  rule: EstimateRuleInput | null,
): EstimateCalculation {
  if (!marketReferencePrice || !rule) {
    return {
      minPrice: null,
      maxPrice: null,
      savingsMin: null,
      savingsMax: null,
      confidence: "LOW",
      priceStatus: "UNAVAILABLE",
    };
  }

  const riskBuffer = Number.isFinite(rule.riskBuffer) ? Math.max(0, rule.riskBuffer ?? 0) : 0;
  const lowerFactor = Math.min(rule.minFactor, rule.maxFactor) + riskBuffer;
  const upperFactor = Math.max(rule.minFactor, rule.maxFactor) + riskBuffer;
  const minPrice = roundToTen(marketReferencePrice * lowerFactor);
  const maxPrice = roundToTen(marketReferencePrice * upperFactor);

  return {
    minPrice,
    maxPrice,
    savingsMin: Math.max(0, marketReferencePrice - maxPrice),
    savingsMax: Math.max(0, marketReferencePrice - minPrice),
    confidence: lowerConfidence(marketConfidence, rule.confidence),
    priceStatus: "ESTIMATED",
  };
}

export function getEstimateConfidenceLabel(confidence: EstimateConfidence) {
  return confidence === "HIGH" ? "价格参考较稳定" : confidence === "MEDIUM" ? "价格可能存在波动" : "建议顾问确认";
}
