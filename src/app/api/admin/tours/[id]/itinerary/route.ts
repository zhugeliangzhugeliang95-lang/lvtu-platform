import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";

const schema = z.object({
  day: z.number().int().min(1).max(60), title: z.string().trim().min(2).max(120),
  city: z.string().trim().max(60).optional(), attractions: z.string().trim().max(500).optional(),
  transport: z.string().trim().max(300).optional(), meals: z.string().trim().max(300).optional(),
  hotel: z.string().trim().max(300).optional(), detail: z.string().trim().max(2000).optional(),
});

function canManage(role: string) { return ["SUPER_ADMIN", "OPS", "CONTENT"].includes(role.toUpperCase()); }

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;
  if (!canManage(auth.session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const json = await readLimitedJson(request, 16 * 1024);
  if (!json.ok) return json.response;
  const parsed = schema.safeParse(json.data);
  if (!parsed.success) return validationError();
  const { id } = await params;
  const input = parsed.data;
  const item = await prisma.tourItineraryDay.upsert({
    where: { productId_day: { productId: id, day: input.day } },
    create: { productId: id, ...input, city: input.city || null, attractions: input.attractions || null, transport: input.transport || null, meals: input.meals || null, hotel: input.hotel || null, detail: input.detail || null },
    update: { ...input, city: input.city || null, attractions: input.attractions || null, transport: input.transport || null, meals: input.meals || null, hotel: input.hotel || null, detail: input.detail || null },
  });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
