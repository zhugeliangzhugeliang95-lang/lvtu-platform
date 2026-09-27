import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";

const schema = z.object({
  departureDate: z.string().date(),
  adultPrice: z.number().int().min(1).max(10_000_000),
  childPrice: z.number().int().min(0).max(10_000_000).nullable().optional(),
  singleRoomDiff: z.number().int().min(0).max(10_000_000).nullable().optional(),
  capacity: z.number().int().min(1).max(999).nullable().optional(),
  status: z.enum(["OPEN", "ALMOST_FULL", "SOLD_OUT", "CLOSED", "PENDING_CONFIRMATION"]),
  cutoffAt: z.string().date().nullable().optional(),
  note: z.string().trim().max(500).optional(),
});

function canManage(role: string) { return ["SUPER_ADMIN", "OPS", "CONTENT"].includes(role.toUpperCase()); }

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;
  if (!canManage(auth.session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const json = await readLimitedJson(request, 12 * 1024);
  if (!json.ok) return json.response;
  const parsed = schema.safeParse(json.data);
  if (!parsed.success) return validationError();
  const { id } = await params;
  const input = parsed.data;
  const item = await prisma.tourDeparture.create({ data: {
    productId: id, departureDate: new Date(`${input.departureDate}T00:00:00.000Z`),
    adultPrice: input.adultPrice, childPrice: input.childPrice ?? null,
    singleRoomDiff: input.singleRoomDiff ?? null, capacity: input.capacity ?? null,
    status: input.status, cutoffAt: input.cutoffAt ? new Date(`${input.cutoffAt}T23:59:59.000Z`) : null,
    note: input.note || null,
  } });
  return NextResponse.json({ ok: true, item }, { status: 201 });
}
