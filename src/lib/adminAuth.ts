import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSecuritySecret, timingSafeTextEqual } from "@/lib/security/secrets";

const COOKIE_NAME = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  return getSecuritySecret("ADMIN_SECRET");
}

function base64url(input: Buffer) {
  return input.toString("base64url");
}

function sign(secret: string, payload: string) {
  return base64url(crypto.createHmac("sha256", secret).update(payload).digest());
}

function safeEqual(a: string, b: string) {
  return timingSafeTextEqual(a, b);
}

export function createAdminSessionCookieValue(adminId: string, role: string) {
  const secret = getSecret();
  const ts = String(Math.floor(Date.now() / 1000));
  const payload = `${adminId}.${role}.${ts}`;
  const sig = sign(secret, payload);
  return `${payload}.${sig}`;
}

export function verifyAdminSessionCookieValue(value: string | undefined | null): { adminId: string; role: string } | null {
  const secret = getSecret();
  if (!secret || !value) return null;

  const parts = value.split(".");
  if (parts.length !== 4) return null;

  const [adminId, role, tsStr, sig] = parts;
  const ts = Number(tsStr);
  if (!adminId || !role || !Number.isFinite(ts) || ts <= 0) return null;

  const now = Math.floor(Date.now() / 1000);
  if (now - ts > MAX_AGE_SECONDS) return null;
  if (ts - now > 60) return null;

  const payload = `${adminId}.${role}.${tsStr}`;
  const expectedSig = sign(secret, payload);
  if (!safeEqual(sig, expectedSig)) return null;

  return { adminId, role };
}

export async function requireAdmin(nextPath: string) {
  const session = await getAdminSession();
  if (session) return session;
  redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
}

export async function getAdminSession() {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  const session = verifyAdminSessionCookieValue(value);
  if (!session) return null;
  if (session.adminId === "env-admin") {
    return process.env.ADMIN_USER?.trim() && process.env.ADMIN_PASS?.trim() ? session : null;
  }
  const admin = await prisma.adminUser.findFirst({
    where: { id: session.adminId, status: "ACTIVE" },
    select: { id: true, role: true },
  });
  return admin ? { adminId: admin.id, role: admin.role } : null;
}

/* ============================================================================
 * 旅途酒店 CRM · API 鉴权辅助
 *  - requireAdminApi: API 路由里直接拿 session 或 401 响应
 *  - hasRole: 判断是否属于某组角色（大小写不敏感）
 *  - isAdminRole / isStaffRole / canSeeAllLeads: 常用语义别名
 * ========================================================================= */

export type AdminSession = { adminId: string; role: string };

export async function requireAdminApi(): Promise<
  | { ok: true; session: AdminSession }
  | { ok: false; response: Response }
> {
  const session = await getAdminSession();
  if (!session) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "UNAUTHORIZED", message: "请先登录后台" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
  return { ok: true, session };
}

export function hasRole(session: AdminSession, ...allowed: string[]): boolean {
  return allowed.some((r) => r.toUpperCase() === session.role.toUpperCase());
}

/** SUPER_ADMIN / OPS：管理员级别，可看全部数据、管理账号和设置 */
export function isAdminRole(session: AdminSession): boolean {
  return hasRole(session, "SUPER_ADMIN", "OPS");
}

/** SUPPORT：客服，只看分配给自己的线索 + 未分配的 NEW 线索 */
export function isStaffRole(session: AdminSession): boolean {
  return hasRole(session, "SUPPORT");
}

/**
 * 是否可以看全部线索。
 * 规则：SUPER_ADMIN / OPS / ORDER 看全部；SUPPORT 仅自己 + 未分配 NEW。
 */
export function canSeeAllLeads(session: AdminSession): boolean {
  return hasRole(session, "SUPER_ADMIN", "OPS", "ORDER");
}

export const adminCookie = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SECONDS,
};
