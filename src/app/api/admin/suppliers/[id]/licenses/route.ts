import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRole, requireAdminApi } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";

const schema = z.object({ licenseType: z.string().trim().min(1).max(100), licenseNumber: z.string().trim().min(1).max(100), legalEntityName: z.string().trim().min(1).max(160), businessScope: z.string().trim().max(1000).optional(), issuingAuthority: z.string().trim().max(160).optional(), evidenceUrl: z.string().url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol)), validUntil: z.string().date().optional(), status: z.enum(["UNVERIFIED","VALID","EXPIRED","SUSPENDED","NOT_FOUND","CONFLICT"]), confirm: z.literal("CONFIRM").optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = requireTrustedOrigin(request); if (originError) return originError;
  const auth = await requireAdminApi(); if (!auth.ok) return auth.response;
  if (!isAdminRole(auth.session)) return NextResponse.json({ error: "FORBIDDEN", message: "需要管理员权限" }, { status: 403 });
  const body = await readLimitedJson(request, 16 * 1024); if (!body.ok) return body.response;
  const parsed = schema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message }, { status: 400 });
  if (parsed.data.status === "VALID" && parsed.data.confirm !== "CONFIRM") return NextResponse.json({ error: "CONFIRMATION_REQUIRED", message: "标记许可证有效需要二次确认" }, { status: 409 });
  const { id } = await params; const input = { ...parsed.data }; delete input.confirm;
  try { await prisma.$transaction([
    prisma.supplierLicense.create({ data: { supplierId: id, ...input, validUntil: input.validUntil ? new Date(input.validUntil) : null, verifiedAt: input.status === "VALID" ? new Date() : null, verifiedBy: input.status === "VALID" ? auth.session.adminId : null, needsManualReview: input.status !== "VALID", verificationSource: input.evidenceUrl } }),
    prisma.supplierAuditLog.create({ data: { supplierId: id, actorAdminId: auth.session.adminId, action: "ADD_LICENSE", afterValue: input.status, reason: input.evidenceUrl } }),
  ]); return NextResponse.json({ ok: true }, { status: 201 }); }
  catch { return NextResponse.json({ error: "CONFLICT", message: "许可证编号已存在，请核查主体" }, { status: 409 }); }
}
