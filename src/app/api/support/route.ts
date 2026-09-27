import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";
import { getUserIdFromCookie } from "@/lib/userAuth";

const allowedCategories = new Set(["订单异常", "入住问题", "房型不符", "早餐问题", "日期修改", "取消 / 退款", "门票问题", "车辆问题", "旅行团问题", "凭证问题", "其他"]);

export async function GET() {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const tickets = await prisma.supportTicket.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "请先登录后提交售后" }, { status: 401 });
  const parsed = await readLimitedJson(req, 24 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;
  const category = String(body.category || "其他").trim();
  const description = String(body.description || "").trim();
  const orderNo = String(body.orderNo || "").trim().slice(0, 80) || null;
  const attachment = String(body.attachment || "").trim().slice(0, 500) || null;
  if (!allowedCategories.has(category)) return NextResponse.json({ error: "请选择有效的问题类型" }, { status: 400 });
  if (description.length < 5) return NextResponse.json({ error: "请至少用 5 个字描述问题" }, { status: 400 });
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNo: `TS${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`,
      userId,
      category,
      orderNo,
      description: description.slice(0, 3000),
      attachment,
    },
  });
  return NextResponse.json({ ok: true, ticket: { id: ticket.id, ticketNo: ticket.ticketNo, status: ticket.status } }, { status: 201 });
}
