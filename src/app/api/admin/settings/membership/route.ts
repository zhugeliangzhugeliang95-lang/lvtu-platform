import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi, hasRole } from "@/lib/adminAuth";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";

const keys = ["membership.price", "membership.days", "membership.title", "membership.benefits", "payment.wechatQrUrl", "payment.alipayQrUrl", "payment.instructions", "payment.enabled"] as const;

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: [...keys] } } });
  return NextResponse.json({ settings: Object.fromEntries(rows.map((row) => [row.key, row.value])) });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  if (!hasRole(auth.session, "SUPER_ADMIN", "OPS")) return NextResponse.json({ error: "无权修改会员配置" }, { status: 403 });
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const parsed = await readLimitedJson(req, 16 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  if (!body || typeof body !== "object") return validationError();
  const entries = Object.entries(body as Record<string, unknown>)
    .filter(([key, value]) => keys.includes(key as (typeof keys)[number]) && typeof value === "string")
    .map(([key, value]) => ({ key, value: (value as string).trim().slice(0, 4000) }));
  if (!entries.length) return validationError();
  await prisma.$transaction(entries.map((entry) => prisma.siteSetting.upsert({ where: { key: entry.key }, update: { value: entry.value }, create: { key: entry.key, value: entry.value } })));
  return NextResponse.json({ ok: true });
}
