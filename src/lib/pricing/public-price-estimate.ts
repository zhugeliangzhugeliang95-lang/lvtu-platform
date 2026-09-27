export const PUBLIC_PRICE_MIN_FACTOR = 0.7;
export const PUBLIC_PRICE_MAX_FACTOR = 0.8;
export const STANDARD_SERVICE_FEE_RATE = 0.35;

function roundToTen(value: number) {
  return Math.max(0, Math.round(value / 10) * 10);
}

export function calculatePublicPriceEstimate(publicReferencePrice: number) {
  if (!Number.isFinite(publicReferencePrice) || publicReferencePrice <= 0) return null;
  const marketReferencePrice = Math.round(publicReferencePrice);
  const estimatedMinPrice = roundToTen(marketReferencePrice * PUBLIC_PRICE_MIN_FACTOR);
  const estimatedMaxPrice = roundToTen(marketReferencePrice * PUBLIC_PRICE_MAX_FACTOR);
  const savingsMin = Math.max(0, marketReferencePrice - estimatedMaxPrice);
  const savingsMax = Math.max(0, marketReferencePrice - estimatedMinPrice);

  return {
    marketReferencePrice,
    estimatedMinPrice,
    estimatedMaxPrice,
    savingsMin,
    savingsMax,
    estimatedServiceFeeMin: roundToTen(savingsMin * STANDARD_SERVICE_FEE_RATE),
    estimatedServiceFeeMax: roundToTen(savingsMax * STANDARD_SERVICE_FEE_RATE),
    factorRange: "70%～80%",
    serviceFeeRate: STANDARD_SERVICE_FEE_RATE,
    sampleSize: 1,
  };
}

export function extractPublicReferencePrice(text: string) {
  const matches = [...text.matchAll(/(?:公开价|原价|平台价|看到(?:是|的)?|报价|价格)[^\d]{0,10}(\d{2,8}(?:\.\d{1,2})?)/g)];
  const raw = matches.at(-1)?.[1];
  if (!raw) return null;
  const amount = Number(raw);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
}
