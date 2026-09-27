import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
  createLog: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: {
  inquiryOrder: { findFirst: mocks.findFirst, update: mocks.update },
  inquiryOrderStatusLog: { create: mocks.createLog },
} }));
vi.mock("@/lib/openai", () => ({ generateStaffSummary: vi.fn().mockResolvedValue("summary") }));

import { createGuestInquiryCookieValue, guestInquiryCookie } from "@/lib/userAuth";
import { POST } from "./route";

describe("legacy inquiry confirm", () => {
  beforeEach(() => {
    process.env.GUEST_INQUIRY_SECRET = "guest-test-secret-which-is-distinct";
    mocks.findFirst.mockReset();
    mocks.update.mockReset();
    mocks.createLog.mockReset();
  });

  function request() {
    const credential = createGuestInquiryCookieValue(["guest_order_1"]);
    return new NextRequest("http://localhost/api/inquiry/guest_order_1/confirm", {
      method: "POST",
      headers: { origin: "http://localhost:3001", cookie: `${guestInquiryCookie.name}=${credential}`, "content-type": "application/json" },
      body: JSON.stringify({ contactName: "测试用户", contactPhone: "13800138000" }),
    });
  }

  it("returns the same 404 for an inaccessible inquiry", async () => {
    mocks.findFirst.mockResolvedValue(null);
    const response = await POST(request(), { params: Promise.resolve({ id: "guest_order_1" }) });
    expect(response.status).toBe(404);
  });

  it("saves contact details without entering WAITING_PAYMENT or logging PII", async () => {
    mocks.findFirst.mockResolvedValue({ id: "guest_order_1", status: "PRICE_REFERENCE_READY", aiStructuredJson: null, destination: "上海", orderNo: "IQ1" });
    mocks.update.mockResolvedValue({ id: "guest_order_1", status: "PRICE_REFERENCE_READY" });
    mocks.createLog.mockResolvedValue({ id: "log-1" });
    const response = await POST(request(), { params: Promise.resolve({ id: "guest_order_1" }) });
    expect(response.status).toBe(200);
    expect(mocks.update.mock.calls[0][0].data).toEqual({ contactName: "测试用户", contactPhone: "13800138000" });
    const logData = mocks.createLog.mock.calls[0][0].data;
    expect(logData.toStatus).toBe("PRICE_REFERENCE_READY");
    expect(logData.remark).not.toContain("13800138000");
    expect(logData.remark).not.toContain("测试用户");
  });
});
