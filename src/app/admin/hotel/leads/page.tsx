"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AdminShell,
  Card,
  StatusBadge,
  copyText,
  fmtDate,
  fmtYuan,
} from "@/components/hotel-admin/AdminShell";
import {
  Search,
  Filter,
  Download,
  Copy,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  RefreshCw,
  Users,
} from "lucide-react";

/* =============================================================================
 * /admin/hotel/leads —— 线索列表
 *  - 搜索 / 状态 / 目的地 / 预算 / 来源 / 分配人 / 日期范围 / 排序 / 分页
 *  - 一键复制微信/手机
 *  - 下载 CSV（带当前筛选）
 * ============================================================================*/

const STATUS_OPTIONS = [
  "ALL",
  "NEW",
  "ADDED",
  "CONTACTED",
  "QUOTED",
  "DEAL",
  "LOST",
  "INVALID",
] as const;

const STATUS_LABEL: Record<string, string> = {
  ALL: "全部状态",
  NEW: "新线索",
  ADDED: "已添加微信",
  CONTACTED: "已沟通",
  QUOTED: "已报价",
  DEAL: "已成交",
  LOST: "已流失",
  INVALID: "无效线索",
};

type Lead = {
  id: string;
  leadNo: string;
  inquiryType: "INTENT" | "HOTEL";
  destination: string;
  timeframe: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  nights: number | null;
  roomCount: string | null;
  guestCount: string;
  budget: string | null;
  preferences: string[];
  contactType: "WECHAT" | "MOBILE";
  contactValue: string;
  remark: string | null;
  source: string;
  status: string;
  assignedTo: {
    id: string;
    username: string;
    realName: string | null;
  } | null;
  lastFollowedAt: string | null;
  dealAmount: number | null;
  createdAt: string;
};

type ListResp = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: Lead[];
  scope: "all" | "self";
};

type StaffOption = {
  id: string;
  username: string;
  realName: string | null;
  role: string;
  status: string;
};

export default function HotelLeadsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [destination, setDestination] = useState("");
  const [source, setSource] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [data, setData] = useState<ListResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    if (status !== "ALL") sp.set("status", status);
    if (q.trim()) sp.set("q", q.trim());
    if (destination.trim()) sp.set("destination", destination.trim());
    if (source.trim()) sp.set("source", source.trim());
    if (assignedToId) sp.set("assignedToId", assignedToId);
    if (dateFrom) sp.set("dateFrom", dateFrom);
    if (dateTo) sp.set("dateTo", dateTo);
    return sp.toString();
  }, [page, pageSize, status, q, destination, source, assignedToId, dateFrom, dateTo]);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/hotel-leads?${queryString}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [queryString]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    fetch("/api/admin/staff", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.items) setStaff(d.items);
      });
  }, []);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1800);
  };

  const onCopy = async (text: string, label: string) => {
    const ok = await copyText(text);
    showToast(ok ? `${label} 已复制` : "复制失败");
  };

  const resetFilters = () => {
    setQ("");
    setStatus("ALL");
    setDestination("");
    setSource("");
    setAssignedToId("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const activeFilterCount =
    (status !== "ALL" ? 1 : 0) +
    (destination ? 1 : 0) +
    (source ? 1 : 0) +
    (assignedToId ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  return (
    <AdminShell
      title="线索列表"
      subtitle="筛选、搜索、复制联系方式、进入详情跟进"
      headerExtra={
        <div className="flex flex-wrap gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e7ec] bg-white px-3 py-2 text-[13px] text-[#475467] transition hover:bg-[#f5f8ff]"
            title="刷新"
          >
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
          <a
            href={`/api/admin/hotel-leads/export?${queryString}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b4fd8] px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#1056eb]"
          >
            <Download className="h-4 w-4" />
            导出 CSV
          </a>
        </div>
      }
    >
      {/* 搜索栏 */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  load();
                }
              }}
              placeholder="搜索编号 / 联系方式 / 目的地 / 备注"
              className="h-10 w-full rounded-lg border border-[#e4e7ec] bg-white pl-9 pr-3 text-[13.5px] outline-none transition placeholder:text-[#98a2b3] focus:border-[#0b4fd8] focus:ring-4 focus:ring-[#0b4fd8]/10"
            />
          </div>

          {/* 状态快切 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition ${
                  status === s
                    ? "bg-[#0b4fd8] text-white"
                    : "border border-[#e4e7ec] bg-white text-[#475467] hover:bg-[#f5f8ff]"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] transition ${
              filtersOpen || activeFilterCount > 0
                ? "border-[#0b4fd8] bg-[#eaf1ff] text-[#0b4fd8]"
                : "border-[#e4e7ec] bg-white text-[#475467] hover:bg-[#f5f8ff]"
            }`}
          >
            <Filter className="h-4 w-4" />
            高级筛选
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-[#0b4fd8] px-1.5 text-[10.5px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-[12.5px] text-[#b42318] hover:bg-[#fef3f2]"
            >
              <X className="h-3.5 w-3.5" />
              清除
            </button>
          )}
        </div>

        {filtersOpen && (
          <div className="mt-4 grid gap-3 border-t border-[#e9edf5] pt-4 md:grid-cols-3 lg:grid-cols-4">
            <TextFilter
              label="目的地"
              value={destination}
              onChange={(v) => {
                setDestination(v);
                setPage(1);
              }}
              placeholder="例如 三亚"
            />
            <TextFilter
              label="来源渠道"
              value={source}
              onChange={(v) => {
                setSource(v);
                setPage(1);
              }}
              placeholder="例如 官网首页"
            />
            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#344054]">
                跟进人
              </label>
              <select
                value={assignedToId}
                onChange={(e) => {
                  setAssignedToId(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-lg border border-[#e4e7ec] bg-white px-2.5 text-[13px] outline-none focus:border-[#0b4fd8]"
              >
                <option value="">全部</option>
                <option value="UNASSIGNED">未分配</option>
                {staff
                  .filter((s) => s.role === "SUPPORT" || s.role === "SUPER_ADMIN" || s.role === "OPS")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.realName || s.username}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#344054]">
                日期范围
              </label>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-full rounded-lg border border-[#e4e7ec] bg-white px-2 text-[12.5px] outline-none focus:border-[#0b4fd8]"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-full rounded-lg border border-[#e4e7ec] bg-white px-2 text-[12.5px] outline-none focus:border-[#0b4fd8]"
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 列表 */}
      <div className="mt-4">
        {data?.scope === "self" && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#0b4fd8]/15 bg-[#eaf1ff] px-4 py-2 text-[12.5px] text-[#0b4fd8]">
            <Users className="h-3.5 w-3.5" />
            当前是客服视角，仅显示分配给你 + 未分配的 NEW 线索。
          </div>
        )}

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-[13px]">
              <thead>
                <tr className="border-b border-[#e9edf5] text-left text-[12px] text-[#98a2b3]">
                  <th className="px-4 py-3 font-medium">提交 / 编号</th>
                  <th className="px-4 py-3 font-medium">目的地 / 入住</th>
                  <th className="px-4 py-3 font-medium">房间 · 人数</th>
                  <th className="px-4 py-3 font-medium">预算</th>
                  <th className="px-4 py-3 font-medium">联系方式</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">跟进人</th>
                  <th className="px-4 py-3 font-medium">最后跟进</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-14 text-center text-[#98a2b3]">
                      加载中…
                    </td>
                  </tr>
                )}
                {!loading && data?.items.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-14 text-center text-[#98a2b3]">
                      没有符合条件的线索
                    </td>
                  </tr>
                )}
                {!loading &&
                  data?.items.map((l) => (
                    <tr
                      key={l.id}
                      className="border-t border-[#e9edf5] transition hover:bg-[#f5f8ff]"
                    >
                      <td className="px-4 py-3.5">
                        <div className="text-[12.5px] text-[#667085]">
                          {fmtDate(l.createdAt)}
                        </div>
                        <div className="mt-0.5 font-mono text-[12px] text-[#0b4fd8]">
                          {l.leadNo}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#98a2b3]">
                          来源 · {l.source}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10.5px] font-medium ring-1 ring-inset ${
                              l.inquiryType === "HOTEL"
                                ? "bg-[#fff3e8] text-[#b04a00] ring-[#ff7a1a]/25"
                                : "bg-[#eaf1ff] text-[#0b4fd8] ring-[#0b4fd8]/20"
                            }`}
                            title={
                              l.inquiryType === "HOTEL"
                                ? "详细酒店询价"
                                : "轻量出行意向"
                            }
                          >
                            {l.inquiryType === "HOTEL" ? "酒店询价" : "出行意向"}
                          </span>
                          <span className="font-medium text-[#0b1f4a]">
                            {l.destination}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[12px] text-[#667085]">
                          {l.inquiryType === "HOTEL" && l.checkInDate && l.checkOutDate ? (
                            <>
                              {fmtDate(l.checkInDate, false)} →{" "}
                              {fmtDate(l.checkOutDate, false)}{" "}
                              <span className="text-[#98a2b3]">
                                ({l.nights}晚)
                              </span>
                            </>
                          ) : l.timeframe ? (
                            <span>{l.timeframe}</span>
                          ) : (
                            <span className="text-[#98a2b3]">
                              日期待补充
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[12.5px] text-[#344054]">
                        <div>{l.roomCount || <span className="text-[#98a2b3]">—</span>}</div>
                        <div className="text-[#667085]">{l.guestCount}</div>
                      </td>
                      <td className="px-4 py-3.5 text-[12.5px] text-[#344054]">
                        {l.budget || <span className="text-[#98a2b3]">—</span>}
                        {l.dealAmount != null && (
                          <div className="mt-0.5 text-[11.5px] font-medium text-[#067647]">
                            成交 {fmtYuan(l.dealAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-[#f1f5fb] px-1.5 py-0.5 text-[10.5px] font-medium text-[#475467]">
                            {l.contactType === "WECHAT" ? "微信" : "手机"}
                          </span>
                          <span className="font-mono text-[12.5px] text-[#172033]">
                            {l.contactValue}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            onCopy(
                              l.contactValue,
                              l.contactType === "WECHAT" ? "微信号" : "手机号"
                            )
                          }
                          className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-[#0b4fd8] hover:underline"
                        >
                          <Copy className="h-3 w-3" />
                          复制
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="px-4 py-3.5 text-[12.5px] text-[#344054]">
                        {l.assignedTo ? (
                          l.assignedTo.realName || l.assignedTo.username
                        ) : (
                          <span className="text-[#98a2b3]">未分配</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[12px] text-[#667085]">
                        {l.lastFollowedAt ? fmtDate(l.lastFollowedAt) : "-"}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/hotel/leads/${l.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-[#0b4fd8]/20 bg-[#eaf1ff] px-2.5 py-1.5 text-[12px] font-semibold text-[#0b4fd8] transition hover:bg-[#dbe6fb]"
                        >
                          详情
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {data && data.total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e9edf5] px-4 py-3 text-[12.5px] text-[#667085]">
              <div>
                共 <span className="font-semibold text-[#172033]">{data.total}</span> 条 · 第 {data.page} / {data.totalPages} 页
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#e4e7ec] bg-white px-2.5 text-[12.5px] text-[#475467] transition enabled:hover:bg-[#f5f8ff] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  上一页
                </button>
                <button
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#e4e7ec] bg-white px-2.5 text-[12.5px] text-[#475467] transition enabled:hover:bg-[#f5f8ff] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  下一页
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-[#0b1f4a] px-4 py-2 text-[13px] font-medium text-white shadow-2xl">
          {toast}
        </div>
      )}
    </AdminShell>
  );
}

function TextFilter({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium text-[#344054]">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-[#e4e7ec] bg-white px-2.5 text-[13px] outline-none focus:border-[#0b4fd8]"
      />
    </div>
  );
}
