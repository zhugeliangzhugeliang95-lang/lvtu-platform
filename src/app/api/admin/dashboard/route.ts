import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdminApi,
  canSeeAllLeads,
  type AdminSession,
} from "@/lib/adminAuth";
import { HOTEL_LEAD_STATUSES } from "@/lib/validations";

/* =============================================================================
 * GET /api/admin/dashboard
 *
 * 返回：
 *  - 今日 / 本周 / 本月 新增线索
 *  - 今日 各状态数量（ADDED/CONTACTED/QUOTED/DEAL/LOST/INVALID/NEW）
 *  - 待处理新线索（NEW 状态总数）
 *  - 成交转化率（DEAL / 全量非 INVALID）
 *  - 有效线索率（非 INVALID / 全量）
 *  - 线索状态漏斗（全量）
 *  - 各来源渠道占比 TOP
 *  - 热门目的地 TOP 10
 *  - 各客服跟进 / 成交数量
 *
 * 权限：SUPPORT 客服只看自己的；SUPER_ADMIN/OPS/ORDER 看全部
 * ============================================================================*/

function scopeWhere(session: AdminSession) {
  if (canSeeAllLeads(session)) return {};
  // 客服：只看分配给自己 + 未分配的 NEW 线索
  return {
    OR: [
      { assignedToId: session.adminId },
      { assignedToId: null, status: "NEW" as const },
    ],
  };
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfWeek() {
  const d = startOfToday();
  const day = d.getDay();
  // 周一作为一周开始（周日 0 → 周一前 6 天）
  const offset = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - offset);
  return d;
}
function startOfMonth() {
  const d = startOfToday();
  d.setDate(1);
  return d;
}

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const { session } = auth;

  const where = scopeWhere(session);
  const today = startOfToday();
  const week = startOfWeek();
  const month = startOfMonth();

  // 基础统计（并行）
  const [
    todayNew,
    weekNew,
    monthNew,
    pendingNew,
    total,
    totalEffective,
    totalDeal,
    sumDealAmountAgg,
  ] = await Promise.all([
    prisma.hotelLead.count({ where: { ...where, createdAt: { gte: today } } }),
    prisma.hotelLead.count({ where: { ...where, createdAt: { gte: week } } }),
    prisma.hotelLead.count({ where: { ...where, createdAt: { gte: month } } }),
    prisma.hotelLead.count({ where: { ...where, status: "NEW" } }),
    prisma.hotelLead.count({ where }),
    prisma.hotelLead.count({
      where: { ...where, status: { not: "INVALID" } },
    }),
    prisma.hotelLead.count({ where: { ...where, status: "DEAL" } }),
    prisma.hotelLead.aggregate({
      where: { ...where, status: "DEAL" },
      _sum: { dealAmount: true },
    }),
  ]);

  // 今日各状态分布
  const todayByStatus = await prisma.hotelLead.groupBy({
    by: ["status"],
    where: { ...where, createdAt: { gte: today } },
    _count: { _all: true },
  });
  const todayStatusMap: Record<string, number> = {};
  for (const s of HOTEL_LEAD_STATUSES) todayStatusMap[s] = 0;
  for (const g of todayByStatus) todayStatusMap[g.status] = g._count._all;

  // 线索状态漏斗（全量）
  const statusByAll = await prisma.hotelLead.groupBy({
    by: ["status"],
    where,
    _count: { _all: true },
  });
  const funnel: Record<string, number> = {};
  for (const s of HOTEL_LEAD_STATUSES) funnel[s] = 0;
  for (const g of statusByAll) funnel[g.status] = g._count._all;

  // 渠道占比
  const bySource = await prisma.hotelLead.groupBy({
    by: ["source"],
    where,
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  // 热门目的地 TOP 10
  const topDestinations = await prisma.hotelLead.groupBy({
    by: ["destination"],
    where,
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  // 各客服跟进 / 成交（仅管理员可见）
  let staffStats: Array<{
    adminId: string;
    realName: string | null;
    username: string;
    total: number;
    deal: number;
  }> = [];
  if (canSeeAllLeads(session)) {
    const [followUp, deals] = await Promise.all([
      prisma.hotelLead.groupBy({
        by: ["assignedToId"],
        where: { assignedToId: { not: null } },
        _count: { _all: true },
      }),
      prisma.hotelLead.groupBy({
        by: ["assignedToId"],
        where: { assignedToId: { not: null }, status: "DEAL" },
        _count: { _all: true },
      }),
    ]);
    const dealMap = new Map(deals.map((d) => [d.assignedToId!, d._count._all]));
    const ids = followUp.map((f) => f.assignedToId!).filter(Boolean);
    const staffRows = ids.length
      ? await prisma.adminUser.findMany({
          where: { id: { in: ids } },
          select: { id: true, realName: true, username: true, role: true },
        })
      : [];
    const staffMap = new Map(staffRows.map((s) => [s.id, s]));
    staffStats = followUp
      .map((f) => {
        const s = staffMap.get(f.assignedToId!);
        return {
          adminId: f.assignedToId!,
          realName: s?.realName || null,
          username: s?.username || "未知",
          total: f._count._all,
          deal: dealMap.get(f.assignedToId!) || 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }

  const dealConversion =
    totalEffective > 0 ? +((totalDeal / totalEffective) * 100).toFixed(1) : 0;
  const effectiveRate =
    total > 0 ? +((totalEffective / total) * 100).toFixed(1) : 0;

  return NextResponse.json({
    counters: {
      todayNew,
      weekNew,
      monthNew,
      pendingNew,
      total,
      totalDeal,
      totalEffective,
      sumDealAmountCents: sumDealAmountAgg._sum.dealAmount || 0,
      dealConversion, // 百分比
      effectiveRate, // 百分比
    },
    todayStatus: todayStatusMap,
    funnel,
    topSources: bySource.map((s) => ({
      source: s.source,
      count: s._count._all,
    })),
    topDestinations: topDestinations.map((d) => ({
      destination: d.destination,
      count: d._count._all,
    })),
    staffStats,
    scope: canSeeAllLeads(session) ? "all" : "self",
  });
}
