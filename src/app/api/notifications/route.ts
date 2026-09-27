import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTrustedOrigin } from "@/lib/security/request";
import { getUserIdFromCookie } from "@/lib/userAuth";

export async function GET() {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ unread: 0 });
  const unread = await prisma.notification.count({ where: { userId, isRead: false } });
  return NextResponse.json({ unread });
}

export async function PATCH(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  return NextResponse.json({ ok: true });
}
