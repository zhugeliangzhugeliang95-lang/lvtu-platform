import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminApi, isAdminRole } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";
import { supplierCreateSchema, supplierListSchema } from "@/lib/supplierSchemas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  if (!isAdminRole(auth.session)) return NextResponse.json({ error: "FORBIDDEN", message: "需要管理员权限" }, { status: 403 });
  const parsed = supplierListSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message }, { status: 400 });
  const query = parsed.data;
  const and: Prisma.TravelSupplierWhereInput[] = [];
  if (query.status !== "ALL") and.push({ status: query.status });
  if (query.city) and.push({ city: query.city });
  if (query.destination) and.push({ destinations: { some: { name: { contains: query.destination } } } });
  if (query.service) and.push({ services: { some: { code: query.service } } });
  if (query.licenseStatus !== "ALL") and.push({ licenses: { some: { status: query.licenseStatus } } });
  if (query.risk) and.push({ risks: { some: { code: query.risk, resolvedAt: null } } });
  if (query.q) and.push({ OR: [{ brandName: { contains: query.q } }, { legalEntityName: { contains: query.q } }, { licenses: { some: { licenseNumber: { contains: query.q } } } }] });
  const where: Prisma.TravelSupplierWhereInput = and.length ? { AND: and } : {};
  const orderBy: Prisma.TravelSupplierOrderByWithRelationInput =
    query.sort === "lastReviewedAt" || query.sort === "nextFollowUpAt"
      ? { [query.sort]: { sort: query.order, nulls: "last" } }
      : { [query.sort]: query.order };
  const [total, items] = await Promise.all([
    prisma.travelSupplier.count({ where }),
    prisma.travelSupplier.findMany({ where, orderBy, skip: (query.page - 1) * query.pageSize, take: query.pageSize, include: { licenses: { orderBy: { updatedAt: "desc" }, take: 1 }, services: true, destinations: true, risks: { where: { resolvedAt: null } }, interactions: { orderBy: { contactedAt: "desc" }, take: 1 } } }),
  ]);
  return NextResponse.json({ total, page: query.page, pageSize: query.pageSize, items });
}

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  if (!isAdminRole(auth.session)) return NextResponse.json({ error: "FORBIDDEN", message: "需要管理员权限" }, { status: 403 });
  const body = await readLimitedJson(request, 16 * 1024);
  if (!body.ok) return body.response;
  const parsed = supplierCreateSchema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message }, { status: 400 });
  try {
    const supplier = await prisma.travelSupplier.create({ data: { ...parsed.data, website: parsed.data.website || null, status: "DISCOVERED", isVerified: false, isPublic: false, publicContentReady: false, publications: { create: { status: "DRAFT" } }, auditLogs: { create: { actorAdminId: auth.session.adminId, action: "CREATE_CANDIDATE", afterValue: "DISCOVERED" } } } });
    return NextResponse.json({ id: supplier.id }, { status: 201 });
  } catch { return NextResponse.json({ error: "CONFLICT", message: "法定名称或 slug 已存在" }, { status: 409 }); }
}
