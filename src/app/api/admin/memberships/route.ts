import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/adminAuth";
import { membershipState } from "@/lib/membership";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const phone = new URL(req.url).searchParams.get("phone")?.replace(/[\s-]/g, "").slice(0, 20) || "";
  const memberships = await prisma.membership.findMany({ where: phone ? { phone: { contains: phone } } : undefined, include: { user: { select: { mobile: true, email: true, nickname: true } } }, orderBy: { updatedAt: "desc" }, take: 100 });
  return NextResponse.json({ memberships: memberships.map((membership) => ({ ...membership, effectiveStatus: membershipState(membership) })) });
}
