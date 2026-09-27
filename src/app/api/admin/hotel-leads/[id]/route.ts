import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdminApi,
  canSeeAllLeads,
  isAdminRole,
  type AdminSession,
} from "@/lib/adminAuth";
import { hotelLeadUpdateSchema, formatZodError } from "@/lib/validations";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";

/* =============================================================================
 * 酒店线索详情
 *  GET   /api/admin/hotel-leads/:id
 *  PATCH /api/admin/hotel-leads/:id
 *
 * PATCH 支持字段（任一）：
 *   status        状态切换 → 自动写 HotelLeadStatusLog + 刷新 lastFollowedAt
 *                  切到 DEAL 时顺便置 dealAt（若未给 dealAmount 保持旧值）
 *   assignedToId  分配客服（管理员 / 客服本人都可分配给自己；管理员可分配给他人）
 *   dealAmount    成交金额（分）
 *   dealRemark    成交备注
 *
 * 权限：
 *   SUPER_ADMIN / OPS / ORDER 看全部；SUPPORT 只能看/改自己 + 未分配的 NEW
 * ============================================================================*/

type RouteContext = { params: Promise<{ id: string }> };

async function loadLead(id: string) {
  return prisma.hotelLead.findUnique({
    where: { id },
    include: {
      assignedTo: {
        select: { id: true, username: true, realName: true, role: true },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: {
          adminUser: {
            select: { id: true, username: true, realName: true },
          },
        },
      },
      statusLogs: {
        orderBy: { createdAt: "asc" },
        include: {
          operator: {
            select: { id: true, username: true, realName: true },
          },
        },
      },
    },
  });
}

function canAccessLead(
  lead: NonNullable<Awaited<ReturnType<typeof loadLead>>>,
  session: AdminSession
) {
  if (canSeeAllLeads(session)) return true;
  if (lead.assignedToId === session.adminId) return true;
  if (!lead.assignedToId && lead.status === "NEW") return true;
  return false;
}

function parsePrefs(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const { session } = auth;

  const { id } = await ctx.params;
  const lead = await loadLead(id);
  if (!lead) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "线索不存在" },
      { status: 404 }
    );
  }
  if (!canAccessLead(lead, session)) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "无权查看该线索" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ...lead,
    preferences: parsePrefs(lead.preferences),
  });
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const { session } = auth;

  const { id } = await ctx.params;
  const parsedBody = await readLimitedJson(req, 16 * 1024);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.data;
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "INVALID_JSON", message: "请求体不合法" },
      { status: 400 }
    );
  }

  const parsed = hotelLeadUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }
  const input = parsed.data;

  const existing = await prisma.hotelLead.findUnique({
    where: { id },
    select: { id: true, status: true, assignedToId: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "线索不存在" },
      { status: 404 }
    );
  }

  // 访问控制
  const isAccessible =
    canSeeAllLeads(session) ||
    existing.assignedToId === session.adminId ||
    (existing.assignedToId === null && existing.status === "NEW");
  if (!isAccessible) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "无权修改该线索" },
      { status: 403 }
    );
  }

  // 分配客服权限：
  //  - 管理员可任意分配
  //  - 客服只能分配给自己（接单）
  if (input.assignedToId !== undefined) {
    if (!isAdminRole(session)) {
      if (input.assignedToId !== session.adminId && input.assignedToId !== null) {
        return NextResponse.json(
          {
            error: "FORBIDDEN",
            message: "客服只能把线索分配给自己（接单）",
          },
          { status: 403 }
        );
      }
    }
    if (typeof input.assignedToId === "string" && input.assignedToId) {
      const exists = await prisma.adminUser.findUnique({
        where: { id: input.assignedToId },
        select: { id: true, status: true },
      });
      if (!exists || exists.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "INVALID_ASSIGNEE", message: "客服账号不存在或已禁用" },
          { status: 400 }
        );
      }
    }
  }

  // 构建 update
  const data: Record<string, unknown> = {};
  const now = new Date();
  let statusChanged: { from: string; to: string } | null = null;

  if (input.status && input.status !== existing.status) {
    data.status = input.status;
    data.lastFollowedAt = now;
    if (input.status === "DEAL") data.dealAt = now;
    statusChanged = { from: existing.status, to: input.status };
  }
  if (input.assignedToId !== undefined) data.assignedToId = input.assignedToId;
  if (input.dealAmount !== undefined) data.dealAmount = input.dealAmount;
  if (input.dealRemark !== undefined) data.dealRemark = input.dealRemark;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  // env-admin 降级账号无 DB 记录 → 状态日志 operatorId 需用 null
  const operatorId =
    session.adminId === "env-admin" ? null : session.adminId;

  await prisma.$transaction(async (tx) => {
    await tx.hotelLead.update({ where: { id }, data });
    if (statusChanged) {
      await tx.hotelLeadStatusLog.create({
        data: {
          leadId: id,
          fromStatus: statusChanged.from as never,
          toStatus: statusChanged.to as never,
          operatorId,
        },
      });
    }
  });

  const updated = await loadLead(id);
  return NextResponse.json({
    ok: true,
    lead: updated && {
      ...updated,
      preferences: parsePrefs(updated.preferences),
    },
  });
}

export async function DELETE(req: Request, ctx: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const { session } = auth;

  if (!isAdminRole(session)) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "仅管理员可删除线索" },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  const existing = await prisma.hotelLead.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "线索不存在" },
      { status: 404 }
    );
  }

  await prisma.$transaction([
    prisma.hotelLeadNote.deleteMany({ where: { leadId: id } }),
    prisma.hotelLeadStatusLog.deleteMany({ where: { leadId: id } }),
    prisma.hotelLead.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
