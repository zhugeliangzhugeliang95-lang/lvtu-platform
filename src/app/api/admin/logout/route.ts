import { NextResponse } from "next/server";

import { adminCookie } from "@/lib/adminAuth";
import { requireTrustedOrigin } from "@/lib/security/request";

export async function POST(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set(adminCookie.name, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
