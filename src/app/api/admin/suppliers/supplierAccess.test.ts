import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminApi = vi.fn();
vi.mock("@/lib/adminAuth", () => ({ requireAdminApi, isAdminRole: (session: { role: string }) => session.role === "SUPER_ADMIN" || session.role === "OPS" }));
vi.mock("@/lib/prisma", () => ({ prisma: { travelSupplier: { count: vi.fn(), findMany: vi.fn(), create: vi.fn() } } }));

describe("supplier admin access", () => {
  beforeEach(() => requireAdminApi.mockReset());
  it("rejects unauthenticated internal list access", async () => { requireAdminApi.mockResolvedValue({ ok: false, response: new Response("unauthorized", { status: 401 }) }); const { GET } = await import("./route"); const response = await GET(new Request("http://localhost/api/admin/suppliers")); expect(response.status).toBe(401); });
  it("rejects non-admin internal list access", async () => { requireAdminApi.mockResolvedValue({ ok: true, session: { adminId: "support-1", role: "SUPPORT" } }); const { GET } = await import("./route"); const response = await GET(new Request("http://localhost/api/admin/suppliers")); expect(response.status).toBe(403); });
  it("rejects non-admin candidate creation", async () => { requireAdminApi.mockResolvedValue({ ok: true, session: { adminId: "support-1", role: "SUPPORT" } }); const { POST } = await import("./route"); const response = await POST(new Request("http://localhost/api/admin/suppliers", { method: "POST", body: "{}" })); expect(response.status).toBe(403); });
});
