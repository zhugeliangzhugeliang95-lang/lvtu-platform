import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminCookie, createAdminSessionCookieValue } from "@/lib/adminAuth";
import { verifyPassword } from "@/lib/password";
import { enforceRateLimit } from "@/lib/rateLimit";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";

export async function POST(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const limited = enforceRateLimit(req, "admin:login", { limit: 8, windowMs: 10 * 60_000 });
  if (limited) return limited;
  const parsed = await readLimitedJson(req, 8 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  // 兼容旧 key (user/pass) 和新规范 (username/password)
  const username = String(payload.username ?? payload.user ?? "").trim();
  const pass = String(payload.password ?? payload.pass ?? "");

  if (!username || !pass) {
    return NextResponse.json({ error: "请填写账号和密码" }, { status: 400 });
  }

  // 先查数据库
  const admin = await prisma.adminUser.findUnique({
    where: { username },
    select: { id: true, passwordHash: true, role: true, status: true, realName: true },
  });

  if (admin && admin.status === "ACTIVE") {
    const ok = verifyPassword(pass, admin.passwordHash);
    if (ok) {
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });

      const value = createAdminSessionCookieValue(admin.id, admin.role);
      const res = NextResponse.json({ ok: true, role: admin.role, realName: admin.realName }, { status: 200 });
      res.cookies.set(adminCookie.name, value, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: adminCookie.maxAge,
      });
      return res;
    }
  }

  // 降级：支持 .env 中配置的单账号（保持向后兼容）
  const envUser = process.env.ADMIN_USER || "";
  const envPass = process.env.ADMIN_PASS || "";
  if (envUser && envPass && username === envUser && pass === envPass) {
    const value = createAdminSessionCookieValue("env-admin", "SUPER_ADMIN");
    const res = NextResponse.json({ ok: true, role: "SUPER_ADMIN" }, { status: 200 });
    res.cookies.set(adminCookie.name, value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: adminCookie.maxAge,
    });
    return res;
  }

  return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
}
