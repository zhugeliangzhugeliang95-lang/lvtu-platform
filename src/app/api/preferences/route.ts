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
  const body = parsed.data as Record<string, unknown>;
  const serviceNotifications = body.serviceNotifications;
  const marketingNotifications = body.marketingNotifications;
  if (typeof serviceNotifications !== "boolean" || typeof marketingNotifications !== "boolean") {
    return NextResponse.json({ error: "设置格式不正确" }, { status: 400 });
  }
  await prisma.user.update({ where: { id: userId }, data: { serviceNotifications, marketingNotifications } });
  return NextResponse.json({ ok: true });
}
