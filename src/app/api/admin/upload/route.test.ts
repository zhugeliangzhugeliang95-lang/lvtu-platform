import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/adminAuth", () => ({ requireAdminApi: vi.fn().mockResolvedValue({
  ok: false,
  response: new Response(JSON.stringify({ error: "UNAUTHORIZED" }), { status: 401 }),
}) }));

import { POST } from "./route";

describe("admin upload authorization", () => {
  it("rejects non-admin uploads before parsing the file", async () => {
    const response = await POST(new Request("http://localhost/api/admin/upload", { method: "POST" }));
    expect(response.status).toBe(401);
  });
});
