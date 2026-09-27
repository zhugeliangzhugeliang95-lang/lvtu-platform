import type { EstimateConfidence, MarketReferenceInput, MarketReferenceResult } from "./types";

function confidenceForSize(size: number): EstimateConfidence {
  if (size >= 3) return "HIGH";
  if (size === 2) return "MEDIUM";
  return "LOW";
}

export function calculateMarketReference(
  snapshots: MarketReferenceInput[],
  now = new Date(),
): MarketReferenceResult {
  const prices = snapshots
    .filter((item) => {
      if (!Number.isFinite(item.price) || item.price <= 0) return false;
      if (!item.expiresAt) return true;
      const expiry = item.expiresAt instanceof Date ? item.expiresAt : new Date(item.expiresAt);
      return !Number.isNaN(expiry.getTime()) && expiry.getTime() > now.getTime();
    })
    .map((item) => Math.round(item.price))
    .sort((a, b) => a - b);

  if (!prices.length) return { price: null, confidence: "LOW", sampleSize: 0 };

  const middle = Math.floor(prices.length / 2);
  const median = prices.length % 2 === 0
    ? Math.round((prices[middle - 1] + prices[middle]) / 2)
    : prices[middle];

  return { price: median, confidence: confidenceForSize(prices.length), sampleSize: prices.length };
}
