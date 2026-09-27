import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireAdminApi,
  canSeeAllLeads,
  type AdminSession,
} from "@/lib/adminAuth";
import { buildCsv, csvResponseHeaders } from "@/lib/csv";
import { HOTEL_LEAD_STATUSES } from "@/lib/validations";

/* =============================================================================
 * GET /api/admin/hotel-leads/export
 *  支持与列表相同的筛选参数：status / destination / budget / source /
 *  assignedToId / q / dateFrom / dateTo
 *
 *  输出：UTF-8 BOM CSV
 *  权限：SUPPORT 只导出自己；管理员导出全部
 *  安全：导出会在服务器日志里记录操作人，方便追溯
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

const STATUS_ZH: Record<string, string> = {
  NEW: "新线索",
  ADDED: "已添加微信",
  CONTACTED: "已沟通",
  QUOTED: "已报价",
  DEAL: "已成交",
  LOST: "已流失",
  INVALID: "无效线索",
};

function formatDate(d: Date | null | undefined): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function formatDateOnly(d: Date | null | undefined): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const { session } = auth;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const destination = url.searchParams.get("destination");
  const budget = url.searchParams.get("budget");
  const source = url.searchParams.get("source");
  const assignedToId = url.searchParams.get("assignedToId");
  const q = url.searchParams.get("q");
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");

  const where: Prisma.HotelLeadWhereInput = { ...scopeWhere(session) };
  const and: Prisma.HotelLeadWhereInput[] = [];

  if (status && status !== "ALL" && HOTEL_LEAD_STATUSES.includes(status as never)) {
    and.push({ status: status as never });
  }
  if (destination) and.push({ destination });
  if (budget) and.push({ budget });
  if (source) and.push({ source });
  if (assignedToId) {
    if (assignedToId === "UNASSIGNED") and.push({ assignedToId: null });
    else and.push({ assignedToId });
  }
  if (dateFrom || dateTo) {
    const range: Prisma.DateTimeFilter = {};
    if (dateFrom) {
      const d = new Date(dateFrom);
      if (!Number.isNaN(d.getTime())) range.gte = d;
    }
    if (dateTo) {
      const d = new Date(dateTo);
      if (!Number.isNaN(d.getTime())) {
        d.setDate(d.getDate() + 1);
        range.lt = d;
      }
    }
    and.push({ createdAt: range });
  }
  if (q && q.trim()) {
    const kw = q.trim();
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

  const rows = await prisma.hotelLead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      assignedTo: {
        select: { username: true, realName: true },
      },
    },
    take: 5000, // 最大单次导出
  });

  console.log(
    `[export] admin=${session.adminId} role=${session.role} count=${rows.length}`
  );

  const headers = [
    "线索编号",
    "提交时间",
    "目的地",
    "入住日期",
    "离店日期",
    "晚数",
    "房间数",
    "入住人数",
    "每晚预算",
    "酒店偏好",
    "联系方式类型",
    "联系方式",
    "备注",
    "来源",
    "状态",
    "跟进人",
    "最后跟进时间",
    "成交金额（元）",
    "成交备注",
    "成交时间",
  ];

  const body = rows.map((r) => {
    let prefs = "";
    try {
      const arr = JSON.parse(r.preferences);
      if (Array.isArray(arr)) prefs = arr.join("、");
    } catch {}
    const dealYuan = r.dealAmount != null ? (r.dealAmount / 100).toFixed(2) : "";
    const staff = r.assignedTo
      ? `${r.assignedTo.realName || r.assignedTo.username}`
      : "";
    return [
      r.leadNo,
      formatDate(r.createdAt),
      r.destination,
      formatDateOnly(r.checkInDate),
      formatDateOnly(r.checkOutDate),
      String(r.nights),
      r.roomCount,
      r.guestCount,
      r.budget,
      prefs,
      r.contactType === "WECHAT" ? "微信" : "手机号",
      r.contactValue,
      r.remark || "",
      r.source,
      STATUS_ZH[r.status] || r.status,
      staff,
      formatDate(r.lastFollowedAt),
      dealYuan,
      r.dealRemark || "",
      formatDate(r.dealAt),
    ];
  });

  const csv = buildCsv(headers, body);
  const filename = `旅途酒店线索_${formatDateOnly(new Date())}.csv`;

  return new Response(csv, {
    status: 200,
    headers: csvResponseHeaders(filename),
  });
}
