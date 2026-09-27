import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";

const updateSchema = z.object({
  status: z.enum(["DRAFT", "ONLINE", "OFFLINE"]).optional(),
  recommended: z.boolean().optional(),
}).refine((value) => value.status !== undefined || value.recommended !== undefined);

function canManage(role: string) {
  return ["SUPER_ADMIN", "OPS", "CONTENT"].includes(role.toUpperCase());
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;
  if (!canManage(auth.session.role)) return NextResponse.json({ error: "FORBIDDEN", message: "当前账号没有产品管理权限" }, { status: 403 });
  const json = await readLimitedJson(request, 8 * 1024);
  if (!json.ok) return json.response;
  const parsed = updateSchema.safeParse(json.data);
  if (!parsed.success) return validationError();
  const { id } = await params;
  const product = await prisma.tourProduct.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ok: true, product });
}
