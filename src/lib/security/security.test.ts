import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { createGuestInquiryCookieValue, createUserSessionCookieValue, guestInquiryCookie, parseGuestInquiryIds, userCookie } from "@/lib/userAuth";
import { inquiryAccessWhere } from "@/lib/security/inquiryAccess";
import { presentPriceResult, INTERNAL_ESTIMATE_NOTICE } from "@/lib/security/priceTrust";
import { enforceRateLimit, resetRateLimitsForTests } from "@/lib/rateLimit";
import { requireTrustedOrigin } from "@/lib/security/request";

afterEach(() => {
  vi.unstubAllEnvs();
  resetRateLimitsForTests();
});

describe("session and guest credentials", () => {
  it("fails closed when a production user session secret is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("USER_SESSION_SECRET", "");
    expect(() => createUserSessionCookieValue("user-a")).toThrow(/USER_SESSION_SECRET/);
  });

  it("accepts only signed, unexpired guest inquiry ids", () => {
    vi.stubEnv("GUEST_INQUIRY_SECRET", "guest-test-secret-which-is-distinct");
    const signed = createGuestInquiryCookieValue(["inquiry_12345"]);
    expect(parseGuestInquiryIds(signed)).toEqual(["inquiry_12345"]);
    expect(parseGuestInquiryIds(`${signed.slice(0, -1)}x`)).toEqual([]);
    expect(parseGuestInquiryIds("inquiry_12345,inquiry_other")).toEqual([]);
  });
});

describe("inquiry ownership", () => {
  it("scopes a signed-in user query to that user", () => {
    vi.stubEnv("USER_SESSION_SECRET", "user-test-secret-which-is-distinct");
    const session = createUserSessionCookieValue("user-a");
    const req = new NextRequest("http://localhost/api/inquiry/order-b", { headers: { cookie: `${userCookie.name}=${session}` } });
    expect(inquiryAccessWhere(req, "order-b")).toEqual({ AND: [{ id: "order-b" }, { userId: "user-a" }] });
  });

  it("allows only a guest id carried by a valid signed credential", () => {
    vi.stubEnv("GUEST_INQUIRY_SECRET", "guest-test-secret-which-is-distinct");
    const signed = createGuestInquiryCookieValue(["guest_order_1"]);
    const owned = new NextRequest("http://localhost", { headers: { cookie: `${guestInquiryCookie.name}=${signed}` } });
    const unowned = new NextRequest("http://localhost");
    expect(inquiryAccessWhere(owned, "guest_order_1")).toEqual({ AND: [{ id: "guest_order_1" }, { id: { in: ["guest_order_1"] }, userId: null }] });
    expect(inquiryAccessWhere(unowned, "guest_order_1")).toEqual({ AND: [{ id: "guest_order_1" }, { id: "__not_accessible__" }] });
  });
});

describe("price trust", () => {
  it("never presents formula output as a real platform price", () => {
    const result = presentPriceResult({
      platform: "携程", hotelName: "测试酒店", roomType: "大床房", pricePerNight: 500, totalPrice: 500,
      breakfastIncluded: false, cancellable: true, bookingUrl: "", source: "公式", confidence: "estimated",
    });
    expect(result).toMatchObject({ platform: "内部估算", isMock: true, sourceType: "internal_estimate", notice: INTERNAL_ESTIMATE_NOTICE });
    expect(result.bookingUrl).toBe("");
  });
});

describe("request protections", () => {
  it("returns 429 with Retry-After after the configured limit", () => {
    const req = new Request("http://localhost/api/test", { headers: { "x-forwarded-for": "192.0.2.1" } });
    expect(enforceRateLimit(req, "test", { limit: 1, windowMs: 60_000 })).toBeNull();
    const blocked = enforceRateLimit(req, "test", { limit: 1, windowMs: 60_000 });
    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get("Retry-After")).toBeTruthy();
  });

  it("rejects an untrusted Origin and accepts localhost in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(requireTrustedOrigin(new Request("http://localhost/api", { headers: { origin: "https://evil.example" } }))?.status).toBe(403);
    expect(requireTrustedOrigin(new Request("http://localhost/api", { headers: { origin: "http://localhost:3001" } }))).toBeNull();
  });
});
