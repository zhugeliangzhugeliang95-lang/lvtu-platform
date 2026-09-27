import { NextResponse } from "next/server";

import { getUserIdFromCookie } from "@/lib/userAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, mobile: true, nickname: true, avatar: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  return NextResponse.json(user);
}
