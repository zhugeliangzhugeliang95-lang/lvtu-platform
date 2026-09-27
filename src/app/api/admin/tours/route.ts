import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";

const createSchema = z.object({
  name: z.string().trim().min(4).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  destination: z.string().trim().min(2).max(50),
  departureCity: z.string().trim().max(50).optional(),
  days: z.number().int().min(1).max(60),
  tourType: z.string().trim().min(2).max(40),
  audience: z.string().trim().max(120).optional(),
  summary: z.string().trim().max(1000).optional(),
  coverImage: z.string().trim().max(500).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(12).default([]),
  recommended: z.boolean().default(false),
});

function canManage(role: string) {
  return ["SUPER_ADMIN", "OPS", "CONTENT"].includes(role.toUpperCase());
}

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const items = await prisma.tourProduct.findMany({
    orderBy: [{ recommended: "desc" }, { updatedAt: "desc" }],
    include: { _count: { select: { departures: true, itinerary: true } }, departures: { orderBy: { departureDate: "asc" }, take: 1 } },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;
  if (!canManage(auth.session.role)) return NextResponse.json({ error: "FORBIDDEN", message: "当前账号没有产品管理权限" }, { status: 403 });
  const json = await readLimitedJson(request, 24 * 1024);
  if (!json.ok) return json.response;
  const parsed = createSchema.safeParse(json.data);
  if (!parsed.success) return validationError();
  const input = parsed.data;
  const exists = await prisma.tourProduct.findUnique({ where: { slug: input.slug }, select: { id: true } });
  if (exists) return NextResponse.json({ error: "SLUG_EXISTS", message: "这个 slug 已经被使用" }, { status: 409 });
  const product = await prisma.tourProduct.create({ data: {
    name: input.name, slug: input.slug, destination: input.destination,
    departureCity: input.departureCity || null, days: input.days, tourType: input.tourType,
    audience: input.audience || null, summary: input.summary || null,
    coverImage: input.coverImage || null, tags: JSON.stringify(input.tags),
    recommended: input.recommended, status: "DRAFT", purchaseMode: "CONSULT",
  } });
  return NextResponse.json({ ok: true, product }, { status: 201 });
}
