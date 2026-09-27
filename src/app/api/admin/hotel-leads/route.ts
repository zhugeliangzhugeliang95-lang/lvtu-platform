import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireAdminApi,
  canSeeAllLeads,
  type AdminSession,
} from "@/lib/adminAuth";
import { leadListQuerySchema } from "@/lib/validations";

/* =============================================================================
 * GET /api/admin/hotel-leads
 *
 * 查询参数（所有可选）：
 *   page, pageSize
 *   status      ALL | NEW | ADDED | CONTACTED | QUOTED | DEAL | LOST | INVALID
 *   destination 精确匹配
 *   budget      精确匹配
 *   source      精确匹配
 *   assignedToId  "UNASSIGNED" / adminId
 *   q           模糊搜索 leadNo / contactValue / destination / remark
 *   dateFrom, dateTo   ISO 日期，按 createdAt 范围
 *   sort        createdAt | updatedAt | lastFollowedAt
 *   order       asc | desc
 *
 * 权限：
 *   SUPER_ADMIN / OPS / ORDER  — 可看全部
 *   SUPPORT                    — 只看分配给自己 + 未分配的 NEW
 * ============================================================================*/

function scopeWhere(session: AdminSession): Prisma.HotelLeadWhereInput {
  if (canSeeAllLeads(session)) return {};
  return {
    OR: [
      { assignedToId: session.adminId },
      { assignedToId: null, status: "NEW" },
    ],
  };
}

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const { session } = auth;

  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const parsed = leadListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message || "参数不合法",
      },
      { status: 400 }
    );
  }
  const q = parsed.data;

  const where: Prisma.HotelLeadWhereInput = { ...scopeWhere(session) };
  const and: Prisma.HotelLeadWhereInput[] = [];

  if (q.status && q.status !== "ALL") and.push({ status: q.status });
  if (q.destination) and.push({ destination: q.destination });
  if (q.budget) and.push({ budget: q.budget });
  if (q.source) and.push({ source: q.source });

  if (q.assignedToId) {
    if (q.assignedToId === "UNASSIGNED") {
      and.push({ assignedToId: null });
    } else {
      and.push({ assignedToId: q.assignedToId });
    }
  }

  if (q.dateFrom || q.dateTo) {
    const range: Prisma.DateTimeFilter = {};
    if (q.dateFrom) {
      const d = new Date(q.dateFrom);
      if (!Number.isNaN(d.getTime())) range.gte = d;
    }
    if (q.dateTo) {
      // 结束日期包含当天：加 1 天做 lt
      const d = new Date(q.dateTo);
      if (!Number.isNaN(d.getTime())) {
        d.setDate(d.getDate() + 1);
        range.lt = d;
      }
    }
    and.push({ createdAt: range });
  }

  if (q.q && q.q.trim()) {
    const kw = q.q.trim();
    and.push({
      OR: [
        { leadNo: { contains: kw } },
        { contactValue: { contains: kw } },
        { destination: { contains: kw } },
        { remark: { contains: kw } },
      ],
    });
  }

  if (and.length) where.AND = and;

  const [total, rows] = await Promise.all([
    prisma.hotelLead.count({ where }),
    prisma.hotelLead.findMany({
      where,
      orderBy: { [q.sort]: q.order },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      include: {
        assignedTo: {
          select: { id: true, username: true, realName: true },
        },
      },
    }),
  ]);

  return NextResponse.json({
    page: q.page,
    pageSize: q.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    items: rows.map((r) => ({
      id: r.id,
      leadNo: r.leadNo,
      inquiryType: r.inquiryType,
      destination: r.destination,
      timeframe: r.timeframe,
      checkInDate: r.checkInDate,
      checkOutDate: r.checkOutDate,
      nights: r.nights,
      roomCount: r.roomCount,
      guestCount: r.guestCount,
      budget: r.budget,
      preferences: (() => {
        try {
          return JSON.parse(r.preferences) as string[];
        } catch {
          return [] as string[];
        }
      })(),
      contactType: r.contactType,
      contactValue: r.contactValue,
      remark: r.remark,
      source: r.source,
      status: r.status,
      assignedTo: r.assignedTo,
      lastFollowedAt: r.lastFollowedAt,
      dealAmount: r.dealAmount,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    scope: canSeeAllLeads(session) ? "all" : "self",
  });
}
