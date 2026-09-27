import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/adminAuth";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const requirements = await prisma.requirement.findMany({ orderBy: { createdAt: "desc" }, include: { user: { select: { nickname: true, mobile: true, email: true } }, quotes: true }, take: 100 });
  return NextResponse.json({ requirements });
}

export async function POST(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const parsed = await readLimitedJson(req, 16 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;
  const requirementId = typeof body.requirementId === "string" ? body.requirementId : "";
  const price = Number(body.price);
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!requirementId || !Number.isFinite(price) || price <= 0 || !description) return NextResponse.json({ error: "请填写需求、金额和说明" }, { status: 400 });
  const quote = await prisma.$transaction(async (tx) => {
    const created = await tx.quote.create({ data: { requirementId, price: Math.round(price), description: description.slice(0, 2000), expireAt: body.expireAt ? new Date(String(body.expireAt)) : null, status: "SENT" } });
    await tx.requirement.update({ where: { id: requirementId }, data: { status: "FINAL_QUOTED", priceStatus: "CONFIRMED" } });
    return created;
  });
  return NextResponse.json({ ok: true, quote }, { status: 201 });
}
