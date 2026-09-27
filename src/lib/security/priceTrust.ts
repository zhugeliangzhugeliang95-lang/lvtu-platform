import type { HotelPriceResult } from "@/lib/priceSearch";

export const INTERNAL_ESTIMATE_NOTICE = "内部估算，仅供参考，不代表实时房态或最终报价";

export function isVerifiedPublicPrice(result: HotelPriceResult) {
  return result.confidence === "high" && /^https?:\/\//i.test(result.bookingUrl ?? "");
}

export function presentPriceResult(result: HotelPriceResult) {
  if (isVerifiedPublicPrice(result)) {
    return { ...result, isMock: false, sourceType: "verified_public" as const, notice: "公开来源参考价，最终库存和价格以人工确认为准" };
  }
  return {
    ...result,
    platform: "内部估算",
    bookingUrl: "",
    source: "内部估算",
    confidence: "estimated" as const,
    isMock: true,
    sourceType: "internal_estimate" as const,
    notice: INTERNAL_ESTIMATE_NOTICE,
  };
}
