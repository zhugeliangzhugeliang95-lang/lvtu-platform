import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSecuritySecret, timingSafeTextEqual } from "@/lib/security/secrets";

const COOKIE_NAME = "user_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
const GUEST_INQUIRIES_COOKIE_NAME = "guest_inquiries";
const GUEST_INQUIRIES_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  return getSecuritySecret("USER_SESSION_SECRET");
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

export function createUserSessionCookieValue(userId: string) {
  const secret = getSecret();
  if (!secret) throw new Error("USER_SESSION_SECRET is required");

  const ts = String(Math.floor(Date.now() / 1000));
  const payload = `${userId}.${ts}`;
  const sig = sign(secret, payload);
  return `${payload}.${sig}`;
}

export function verifyUserSessionCookieValue(value: string | undefined | null) {
  const secret = getSecret();
  if (!secret || !value) return null;

  const parts = value.split(".");
  if (parts.length !== 3) return null;

  const [userId, tsStr, sig] = parts;
  const ts = Number(tsStr);
  if (!userId || !Number.isFinite(ts) || ts <= 0) return null;

  const now = Math.floor(Date.now() / 1000);
  if (now - ts > MAX_AGE_SECONDS) return null;
  if (ts - now > 60) return null;

  const payload = `${userId}.${tsStr}`;
  const expectedSig = sign(secret, payload);
  if (!safeEqual(sig, expectedSig)) return null;

  return userId;
}

export async function requireUser(nextPath: string) {
  const userId = await getUserIdFromCookie();
  if (userId) return userId;
  redirect(`/login?next=${encodeURIComponent(nextPath)}`);
}

export async function getUserIdFromCookie() {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  const userId = verifyUserSessionCookieValue(value);
  if (!userId) return null;
  const user = await prisma.user.findFirst({ where: { id: userId, status: "ACTIVE" }, select: { id: true } });
  return user?.id || null;
}

export const userCookie = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SECONDS,
};

export const guestInquiryCookie = {
  name: GUEST_INQUIRIES_COOKIE_NAME,
  maxAge: GUEST_INQUIRIES_MAX_AGE_SECONDS,
};

export function parseGuestInquiryIds(value: string | undefined | null) {
  if (!value) return [];
  const [version, encoded, signature] = value.split(".");
  if (version !== "v1" || !encoded || !signature) return [];
  const expected = sign(getSecuritySecret("GUEST_INQUIRY_SECRET"), `${version}.${encoded}`);
  if (!safeEqual(signature, expected)) return [];
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as { ids?: unknown; issuedAt?: unknown };
    if (!Array.isArray(payload.ids) || typeof payload.issuedAt !== "number") return [];
    const now = Math.floor(Date.now() / 1000);
    if (payload.issuedAt > now + 60 || now - payload.issuedAt > GUEST_INQUIRIES_MAX_AGE_SECONDS) return [];
    return [...new Set(payload.ids.filter((id): id is string => typeof id === "string" && /^[a-z0-9_-]{8,80}$/i.test(id)))].slice(-20);
  } catch {
    return [];
  }
}

export function createGuestInquiryCookieValue(ids: string[]) {
  const safeIds = [...new Set(ids.filter((id) => /^[a-z0-9_-]{8,80}$/i.test(id)))].slice(-20);
  const encoded = Buffer.from(JSON.stringify({ ids: safeIds, issuedAt: Math.floor(Date.now() / 1000) })).toString("base64url");
  const payload = `v1.${encoded}`;
  return `${payload}.${sign(getSecuritySecret("GUEST_INQUIRY_SECRET"), payload)}`;
}

/** 只允许回到站内路径，避免登录后的开放重定向。 */
export function safeReturnPath(value: string | undefined | null, fallback = "/member") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/^\/(?:login|signup)(?:[/?#]|$)/.test(value)) return fallback;
  return value;
}
