import { NextResponse } from "next/server";
import { requireAdminApi, isAdminRole } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";
import { supplierUpdateSchema } from "@/lib/supplierSchemas";

const SENSITIVE = new Set(["VERIFIED", "ACTIVE"]);

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  if (!isAdminRole(auth.session)) return NextResponse.json({ error: "FORBIDDEN", message: "需要管理员权限" }, { status: 403 });
  const { id } = await params;
  const item = await prisma.travelSupplier.findUnique({ where: { id }, include: { brands: true, licenses: true, services: true, destinations: true, contacts: true, sources: { orderBy: { queriedAt: "desc" } }, verifications: { orderBy: { createdAt: "desc" } }, risks: { orderBy: { createdAt: "desc" } }, interactions: { orderBy: { contactedAt: "desc" } }, contracts: true, publications: { orderBy: { createdAt: "desc" } }, auditLogs: { orderBy: { createdAt: "desc" }, take: 100 } } });
  if (!item) return NextResponse.json({ error: "NOT_FOUND", message: "供应商不存在" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  if (!isAdminRole(auth.session)) return NextResponse.json({ error: "FORBIDDEN", message: "需要管理员权限" }, { status: 403 });
  const body = await readLimitedJson(request, 24 * 1024);
  if (!body.ok) return body.response;
  const parsed = supplierUpdateSchema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message }, { status: 400 });
  const { id } = await params;
  const current = await prisma.travelSupplier.findUnique({ where: { id }, include: { licenses: true } });
  if (!current) return NextResponse.json({ error: "NOT_FOUND", message: "供应商不存在" }, { status: 404 });
  const data = parsed.data;
  const validLicense = current.licenses.some((license) => license.status === "VALID" && !license.needsManualReview && (!license.validUntil || license.validUntil > new Date()));
  if ((data.status && SENSITIVE.has(data.status)) || data.isPublic === true) {
    if (data.confirm !== "CONFIRM") return NextResponse.json({ error: "CONFIRMATION_REQUIRED", message: "敏感操作需要二次确认" }, { status: 409 });
    if (!data.reason) return NextResponse.json({ error: "REASON_REQUIRED", message: "请填写审核依据" }, { status: 400 });
  }
  if (data.status === "VERIFIED" && !validLicense) return NextResponse.json({ error: "QUALIFICATION_INCOMPLETE", message: "至少需要一项已人工核验且有效的许可证" }, { status: 409 });
  if (data.status === "ACTIVE" && (!current.isVerified || !validLicense)) return NextResponse.json({ error: "NOT_VERIFIED", message: "未完成资质核验，不能设为 ACTIVE" }, { status: 409 });
  if (data.isPublic === true && (current.status !== "ACTIVE" || !current.isVerified || !current.publicContentReady || !validLicense)) return NextResponse.json({ error: "PUBLICATION_BLOCKED", message: "发布需同时满足 ACTIVE、已核验、许可证有效和公开内容已审核" }, { status: 409 });
  const update = { ...(data.status ? { status: data.status } : {}), ...(data.summary !== undefined ? { summary: data.summary } : {}), ...(data.internalScore !== undefined ? { internalScore: data.internalScore } : {}), ...(data.nextFollowUpAt !== undefined ? { nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null } : {}), ...(data.publicContentReady !== undefined ? { publicContentReady: data.publicContentReady } : {}), ...(data.isPublic !== undefined ? { isPublic: data.isPublic, publishedAt: data.isPublic ? new Date() : null } : {}), ...(data.status === "VERIFIED" ? { isVerified: true, verifiedAt: new Date() } : {}), ...(data.status === "EXPIRED" ? { isVerified: false, isPublic: false } : {}) };
  await prisma.$transaction(async (tx) => {
    await tx.travelSupplier.update({ where: { id }, data: update });
    if (data.isPublic !== undefined) await tx.supplierPublication.create({ data: { supplierId: id, status: data.isPublic ? "PUBLISHED" : "UNPUBLISHED", reviewedBy: auth.session.adminId, reviewedAt: new Date(), publishedAt: data.isPublic ? new Date() : null, unpublishedAt: data.isPublic ? null : new Date() } });
    await tx.supplierAuditLog.create({ data: { supplierId: id, actorAdminId: auth.session.adminId, action: data.isPublic !== undefined ? (data.isPublic ? "PUBLISH" : "UNPUBLISH") : "UPDATE", fieldName: data.status ? "status" : data.publicContentReady !== undefined ? "publicContentReady" : "supplier", beforeValue: data.status ? current.status : undefined, afterValue: data.status || (data.isPublic !== undefined ? String(data.isPublic) : JSON.stringify(update)), reason: data.reason } });
  });
  return NextResponse.json({ ok: true });
}
