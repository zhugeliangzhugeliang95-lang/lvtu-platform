import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";
import { getUserIdFromCookie } from "@/lib/userAuth";

export async function POST(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const parsed = await readLimitedJson(req, 8 * 1024);
  if (!parsed.ok) return parsed.response;
  const payload = parsed.data as Record<string, unknown>;
  const nickname = payload.nickname;
  const mobile = payload.mobile;

  const nicknameValue = typeof nickname === "string" ? nickname.trim().slice(0, 20) : null;
  const mobileValue = typeof mobile === "string" ? mobile.trim().slice(0, 20) : null;

  try {
    await prisma.user.update({ where: { id: userId }, data: { nickname: nicknameValue || null, mobile: mobileValue || null } });
  } catch {
    return NextResponse.json({ error: "这个手机号已绑定其他账号" }, { status: 409 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
