import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdminApi,
  canSeeAllLeads,
  type AdminSession,
} from "@/lib/adminAuth";
import { hotelLeadNoteSchema, formatZodError } from "@/lib/validations";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";

/* =============================================================================
 * 跟进备注
 *  GET  /api/admin/hotel-leads/:id/notes — 时间倒序
 *  POST /api/admin/hotel-leads/:id/notes — 新增，刷新 lastFollowedAt
 *
 * 权限：SUPPORT 只能操作自己 + 未分配的 NEW；管理员看/写全部
 * ============================================================================*/

type RouteContext = { params: Promise<{ id: string }> };

async function canAccess(id: string, session: AdminSession) {
  if (canSeeAllLeads(session)) {
    const l = await prisma.hotelLead.findUnique({
      where: { id },
      select: { id: true },
    });
    return l ? { ok: true as const } : ({ ok: false, code: 404 } as const);
  }
  const l = await prisma.hotelLead.findUnique({
    where: { id },
    select: { assignedToId: true, status: true },
  });
  if (!l) return { ok: false, code: 404 } as const;
  if (l.assignedToId === session.adminId) return { ok: true as const };
  if (l.assignedToId === null && l.status === "NEW")
    return { ok: true as const };
  return { ok: false, code: 403 } as const;
}

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const access = await canAccess(id, auth.session);
  if (!access.ok) {
    return NextResponse.json(
      {
        error: access.code === 404 ? "NOT_FOUND" : "FORBIDDEN",
        message: access.code === 404 ? "线索不存在" : "无权查看",
      },
      { status: access.code }
    );
  }

  const notes = await prisma.hotelLeadNote.findMany({
    where: { leadId: id },
    orderBy: { createdAt: "desc" },
    include: {
      adminUser: {
        select: { id: true, username: true, realName: true },
      },
    },
  });
  return NextResponse.json({ items: notes });
}

export async function POST(req: Request, ctx: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const { session } = auth;

  const { id } = await ctx.params;
  const access = await canAccess(id, session);
  if (!access.ok) {
    return NextResponse.json(
      {
        error: access.code === 404 ? "NOT_FOUND" : "FORBIDDEN",
        message: access.code === 404 ? "线索不存在" : "无权操作",
      },
      { status: access.code }
    );
  }

  const body = await readLimitedJson(req, 8 * 1024);
  if (!body.ok) return body.response;
  const parsed = hotelLeadNoteSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  // env-admin 没有 DB 账号，拒绝写备注（避免 FK 破坏）
  if (session.adminId === "env-admin") {
    return NextResponse.json(
      {
        error: "ENV_ADMIN_CANNOT_WRITE",
        message: "env 降级账号不支持跟进备注，请用数据库管理员登录",
      },
      { status: 403 }
    );
  }

  const note = await prisma.$transaction(async (tx) => {
    const n = await tx.hotelLeadNote.create({
      data: {
        leadId: id,
        adminUserId: session.adminId,
        content: parsed.data.content,
      },
      include: {
        adminUser: {
          select: { id: true, username: true, realName: true },
        },
      },
    });
    await tx.hotelLead.update({
      where: { id },
      data: { lastFollowedAt: new Date() },
    });
    return n;
  });

  return NextResponse.json({ ok: true, note });
}
