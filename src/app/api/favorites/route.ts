import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";
import { getUserIdFromCookie } from "@/lib/userAuth";

const typeAllowed = ["HOTEL", "FLIGHT", "TRAIN", "ROUTE"] as const;
type ProductType = (typeof typeAllowed)[number];

export async function POST(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const parsed = await readLimitedJson(req, 4 * 1024);
  if (!parsed.ok) return parsed.response;
  if (!parsed.data || typeof parsed.data !== "object") return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const payload = parsed.data as Record<string, unknown>;
  const productType = String(payload.productType || "").toUpperCase();
  const productId = String(payload.productId || "").trim();
  if (!typeAllowed.includes(productType as ProductType)) return NextResponse.json({ error: "类型不支持" }, { status: 400 });
  if (!productId) return NextResponse.json({ error: "缺少 productId" }, { status: 400 });

  await prisma.favorite.upsert({
    where: { userId_productType_productId: { userId, productType: productType as ProductType, productId } },
    create: { userId, productType: productType as ProductType, productId },
    update: {},
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const parsed = await readLimitedJson(req, 4 * 1024);
  if (!parsed.ok) return parsed.response;
  if (!parsed.data || typeof parsed.data !== "object") return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const payload = parsed.data as Record<string, unknown>;
  const productType = String(payload.productType || "").toUpperCase();
  const productId = String(payload.productId || "").trim();
  if (!typeAllowed.includes(productType as ProductType)) return NextResponse.json({ error: "类型不支持" }, { status: 400 });
  if (!productId) return NextResponse.json({ error: "缺少 productId" }, { status: 400 });

  await prisma.favorite
    .delete({ where: { userId_productType_productId: { userId, productType: productType as ProductType, productId } } })
    .catch(() => null);

  return NextResponse.json({ ok: true }, { status: 200 });
}
