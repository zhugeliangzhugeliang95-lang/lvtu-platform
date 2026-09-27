import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { requireSupplierBotApi } from "@/lib/supplierBotAuth";
import { GET as getLegacyTask } from "@/app/api/robot/tasks/next/route";
import { GET as getPendingXianyu } from "@/app/api/inquiry/xianyu/pending/route";

afterEach(() => vi.unstubAllEnvs());

describe("supplier worker authentication", () => {
  it("fails closed when the token is missing", async () => {
    vi.stubEnv("SUPPLIER_BOT_TOKEN", "");
    vi.stubEnv("XIANYU_BOT_TOKEN", "");
    const req = new NextRequest("http://localhost/api/worker");
    expect(requireSupplierBotApi(req).ok).toBe(false);
    expect((await getLegacyTask(req)).status).toBe(401);
    expect((await getPendingXianyu(req)).status).toBe(401);
  });

  it("rejects a wrong or empty token", () => {
    vi.stubEnv("SUPPLIER_BOT_TOKEN", "correct-worker-token");
    expect(requireSupplierBotApi(new NextRequest("http://localhost", { headers: { authorization: "Bearer wrong" } })).ok).toBe(false);
    expect(requireSupplierBotApi(new NextRequest("http://localhost", { headers: { "x-supplier-bot-token": "correct-worker-token" } })).ok).toBe(true);
  });
});
