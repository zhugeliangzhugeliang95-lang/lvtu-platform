import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";
import { getUserIdFromCookie } from "@/lib/userAuth";

export async function GET() {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const travelers = await prisma.traveler.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ travelers });
}

export async function POST(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "请先登录后添加旅客" }, { status: 401 });
  const parsed = await readLimitedJson(req, 16 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;
  const name = String(body.name || "").trim();
  const mobile = String(body.mobile || "").trim();
  const documentType = String(body.documentType || "").trim();
  const documentNumber = String(body.documentNumber || "").trim();
  if (name.length < 2 || name.length > 60) return NextResponse.json({ error: "请填写正确的旅客姓名" }, { status: 400 });
  if (mobile && !/^[+\d][\d\s-]{5,20}$/.test(mobile)) return NextResponse.json({ error: "请填写正确的手机号" }, { status: 400 });
  if (documentNumber && documentNumber.length < 5) return NextResponse.json({ error: "请检查证件号码" }, { status: 400 });
  const traveler = await prisma.traveler.create({
    data: {
      userId,
      name,
      mobile: mobile || null,
      documentType: documentNumber ? (documentType || "身份证") : null,
      documentNumber: documentNumber || null,
    },
  });
  return NextResponse.json({ ok: true, traveler: { id: traveler.id, name: traveler.name } }, { status: 201 });
}

export async function DELETE(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const parsed = await readLimitedJson(req, 8 * 1024);
  if (!parsed.ok) return parsed.response;
  const id = String((parsed.data as Record<string, unknown>).id || "").trim();
  const result = await prisma.traveler.deleteMany({ where: { id, userId } });
  if (!result.count) return NextResponse.json({ error: "未找到旅客" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
