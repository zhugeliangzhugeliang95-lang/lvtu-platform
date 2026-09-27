import { NextResponse } from "next/server";

import { userCookie } from "@/lib/userAuth";
import { requireTrustedOrigin } from "@/lib/security/request";

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function getOrigin(req: Request) {
  const requestUrl = new URL(req.url);
  const forwardedHost = firstHeaderValue(req.headers.get("x-forwarded-host"));
  const host = forwardedHost || firstHeaderValue(req.headers.get("host")) || requestUrl.host;
  const isLocalHost = /^localhost(?::\d+)?$/.test(host) || /^127\.0\.0\.1(?::\d+)?$/.test(host);

  if (process.env.NODE_ENV === "production" && isLocalHost && process.env.FLY_APP_NAME) {
    return `https://${process.env.FLY_APP_NAME}.fly.dev`;
  }

  const forwardedProto = firstHeaderValue(req.headers.get("x-forwarded-proto"));
  const proto = forwardedProto || requestUrl.protocol.replace(":", "") || "https";
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const res = NextResponse.redirect(new URL("/", getOrigin(req)), { status: 303 });
  res.cookies.set(userCookie.name, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
