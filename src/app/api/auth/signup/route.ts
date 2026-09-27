import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
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

function isEmailAccount(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const limited = enforceRateLimit(req, "auth:signup", { limit: 5, windowMs: 60 * 60_000 });
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
  const name = typeof payload.name === "string" ? payload.name.trim().slice(0, 50) : "";

  if (!isNonEmptyString(account)) {
    return NextResponse.json({ error: "请输入手机号或邮箱" }, { status: 400 });
  }
  if (!isNonEmptyString(password) || password.length < 8) {
    return NextResponse.json({ error: "密码至少8位" }, { status: 400 });
  }
  if (!name) return NextResponse.json({ error: "请输入姓名或昵称" }, { status: 400 });
  if (payload.agreed !== true) return NextResponse.json({ error: "请先同意用户协议和隐私政策" }, { status: 400 });

  const normalizedAccount = account.trim().toLowerCase();
  const mobile = isMobileAccount(normalizedAccount) ? normalizeMobile(normalizedAccount) : null;
  const email = mobile ? `${mobile}@mobile.lvyou-tong.local` : normalizedAccount;

  if (!mobile && !isEmailAccount(email)) {
    return NextResponse.json({ error: "请输入正确的手机号或邮箱" }, { status: 400 });
  }

  const exists = await prisma.user.findFirst({
    where: mobile ? { OR: [{ mobile }, { email }] } : { email },
    select: { id: true },
  });
  if (exists) {
    return NextResponse.json({ error: "该账号已注册，请直接登录" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      mobile,
      nickname: name,
      passwordHash: hashPassword(password),
    },
    select: { id: true },
  });

  const value = createUserSessionCookieValue(user.id);
  const res = NextResponse.json({ ok: true }, { status: 200 });
  const store = await cookies();
  const guestIds = parseGuestInquiryIds(store.get(guestInquiryCookie.name)?.value);
  if (guestIds.length) {
    await prisma.inquiryOrder.updateMany({ where: { id: { in: guestIds }, userId: null }, data: { userId: user.id } });
  }
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
