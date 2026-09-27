import { describe, expect, it } from "vitest";
import { calculateEstimate } from "./estimate-engine";
import { calculateMarketReference } from "./market-reference";

describe("pricing", () => {
  it("uses the median rather than the lowest public price", () => {
    expect(calculateMarketReference([{ price: 3080 }, { price: 3200 }, { price: 3350 }])).toEqual({
      price: 3200,
      confidence: "HIGH",
      sampleSize: 3,
    });
  });

  it("returns no invented price when public data is missing", () => {
    expect(calculateEstimate(null, "LOW", { minFactor: 0.65, maxFactor: 0.72, confidence: "MEDIUM" }).priceStatus).toBe("UNAVAILABLE");
  });

  it("is deterministic for the same reference and rule", () => {
    const rule = { minFactor: 0.65, maxFactor: 0.72, riskBuffer: 0, confidence: "HIGH" as const };
    expect(calculateEstimate(3200, "HIGH", rule)).toEqual(calculateEstimate(3200, "HIGH", rule));
    expect(calculateEstimate(3200, "HIGH", rule)).toMatchObject({ minPrice: 2080, maxPrice: 2300 });
  });
});
