export const PRICE_STATUS_LABELS = {
  REFERENCE: "公开参考价",
  ESTIMATED: "旅途预估价",
  PENDING_CONFIRMATION: "顾问确认中",
  CONFIRMED: "最终确认价",
  EXPIRED: "报价已失效",
  UNAVAILABLE: "当前暂无可订方案",
} as const;

export type PriceStatus = keyof typeof PRICE_STATUS_LABELS;
export type EstimateConfidence = "HIGH" | "MEDIUM" | "LOW";

export type MarketReferenceInput = {
  price: number;
  expiresAt?: Date | string | null;
};

export type MarketReferenceResult = {
  price: number | null;
  confidence: EstimateConfidence;
  sampleSize: number;
};

export type EstimateRuleInput = {
  id?: string;
  minFactor: number;
  maxFactor: number;
  riskBuffer?: number;
  confidence: EstimateConfidence;
};

export type EstimateCalculation = {
  minPrice: number | null;
  maxPrice: number | null;
  savingsMin: number | null;
  savingsMax: number | null;
  confidence: EstimateConfidence;
  priceStatus: PriceStatus;
};
