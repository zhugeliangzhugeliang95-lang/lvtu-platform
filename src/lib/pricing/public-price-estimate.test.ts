import { describe, expect, it } from "vitest";
import { calculatePublicPriceEstimate, extractPublicReferencePrice } from "./public-price-estimate";

describe("public price estimate", () => {
  it("uses the stable 70% to 80% rule and 35% service-fee explanation", () => {
    expect(calculatePublicPriceEstimate(5000)).toEqual({
      marketReferencePrice: 5000,
      estimatedMinPrice: 3500,
      estimatedMaxPrice: 4000,
      savingsMin: 1000,
      savingsMax: 1500,
      estimatedServiceFeeMin: 350,
      estimatedServiceFeeMax: 530,
      factorRange: "70%～80%",
      serviceFeeRate: 0.35,
      sampleSize: 1,
    });
  });

  it("extracts only prices explicitly described by the user", () => {
    expect(extractPublicReferencePrice("三亚酒店公开价是 5288 元")).toBe(5288);
    expect(extractPublicReferencePrice("预算5000，想去三亚")).toBeNull();
  });
});
