import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createUserSessionCookieValue, guestInquiryCookie, parseGuestInquiryIds, userCookie } from "@/lib/userAuth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function normalizeMobile(value: string) {
  return value.replace(/[\s-]/g, "");
}

function isMobileAccount(value: string) {
  return /^1\d{10}$/.test(normalizeMobile(value));
}

function mobileAliasEmail(mobile: string) {
  return `${mobile}@mobile.lvyou-tong.local`;
}

export async function POST(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const limited = enforceRateLimit(req, "auth:login", { limit: 8, windowMs: 10 * 60_000 });
  if (limited) return limited;
  const parsed = await readLimitedJson(req, 8 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const account = payload.account ?? payload.email;
  const password = payload.password;

  if (!isNonEmptyString(account)) {
    return NextResponse.json({ error: "请输入手机号或邮箱" }, { status: 400 });
  }
  if (!isNonEmptyString(password)) {
    return NextResponse.json({ error: "请输入密码" }, { status: 400 });
  }
  const normalizedAccount = account.trim().toLowerCase();
  const mobile = isMobileAccount(normalizedAccount) ? normalizeMobile(normalizedAccount) : null;
  const user = await prisma.user.findFirst({
    where: mobile
      ? { OR: [{ mobile }, { email: mobileAliasEmail(mobile) }] }
      : { email: normalizedAccount },
    select: { id: true, mobile: true, passwordHash: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      ...(mobile && !user.mobile ? { mobile } : {}),
    },
  }).catch(() => {});

  const store = await cookies();
  const guestIds = parseGuestInquiryIds(store.get(guestInquiryCookie.name)?.value);
  if (guestIds.length) {
    await prisma.inquiryOrder.updateMany({ where: { id: { in: guestIds }, userId: null }, data: { userId: user.id } });
  }

  const value = createUserSessionCookieValue(user.id);
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set(userCookie.name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: userCookie.maxAge,
  });
  if (guestIds.length) res.cookies.set(guestInquiryCookie.name, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return res;
}
