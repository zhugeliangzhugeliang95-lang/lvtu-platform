import { NextResponse } from "next/server";
import { isAdminRole, requireAdminApi } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";
import { supplierInteractionSchema } from "@/lib/supplierSchemas";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  if (!isAdminRole(auth.session)) return NextResponse.json({ error: "FORBIDDEN", message: "需要管理员权限" }, { status: 403 });
  const body = await readLimitedJson(request, 16 * 1024);
  if (!body.ok) return body.response;
  const parsed = supplierInteractionSchema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message }, { status: 400 });
  const { id } = await params;
  const supplier = await prisma.travelSupplier.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!supplier) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const input = parsed.data;
  await prisma.$transaction([
    prisma.supplierInteraction.create({ data: { supplierId: id, contactMethod: input.contactMethod, contactedAt: new Date(input.contactedAt), contactPerson: input.contactPerson || null, channel: input.channel, outcome: input.outcome, nextStep: input.nextStep || null, followUpAt: input.followUpAt ? new Date(input.followUpAt) : null, internalNote: input.internalNote || null, createdBy: auth.session.adminId } }),
    prisma.travelSupplier.update({ where: { id }, data: { status: supplier.status === "RESEARCHED" || supplier.status === "CONTACT_PENDING" ? "CONTACTED" : supplier.status, nextFollowUpAt: input.followUpAt ? new Date(input.followUpAt) : null } }),
    prisma.supplierAuditLog.create({ data: { supplierId: id, actorAdminId: auth.session.adminId, action: "ADD_INTERACTION", afterValue: input.channel } }),
  ]);
  return NextResponse.json({ ok: true }, { status: 201 });
}
