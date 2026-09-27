"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AdminShell,
  Card,
  fmtYuan,
} from "@/components/hotel-admin/AdminShell";
import {
  TrendingUp,
  Users,
  CheckCircle2,
  Target,
  Download,
  MessageCircle,
  MapPin,
  PieChart,
  BadgeCheck,
  UserCircle2,
} from "lucide-react";

/* =============================================================================
 * /admin/hotel —— 数据看板
 * ============================================================================*/

const STATUS_META: Record<string, { label: string; color: string }> = {
  NEW: { label: "新线索", color: "#0b4fd8" },
  ADDED: { label: "已添加微信", color: "#0952d0" },
  CONTACTED: { label: "已沟通", color: "#ff7a1a" },
  QUOTED: { label: "已报价", color: "#d0a23d" },
  DEAL: { label: "已成交", color: "#12b76a" },
  LOST: { label: "已流失", color: "#b42318" },
  INVALID: { label: "无效线索", color: "#98a2b3" },
};

type Dashboard = {
  counters: {
    todayNew: number;
    weekNew: number;
    monthNew: number;
    pendingNew: number;
    total: number;
    totalDeal: number;
    totalEffective: number;
    sumDealAmountCents: number;
    dealConversion: number;
    effectiveRate: number;
  };
  todayStatus: Record<string, number>;
  funnel: Record<string, number>;
  topSources: Array<{ source: string; count: number }>;
  topDestinations: Array<{ destination: string; count: number }>;
  staffStats: Array<{
    adminId: string;
    realName: string | null;
    username: string;
    total: number;
    deal: number;
  }>;
  scope: "all" | "self";
};

export default function HotelDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AdminShell
      title="数据看板"
      subtitle="酒店线索每日概览 · 跟进 · 成交"
      headerExtra={
        <div className="flex gap-2">
          <Link
            href="/admin/hotel/leads"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e7ec] bg-white px-3.5 py-2 text-[13px] font-medium text-[#0b4fd8] transition hover:bg-[#eaf1ff]"
          >
            <MessageCircle className="h-4 w-4" />
            进入线索列表
          </Link>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/api/admin/hotel-leads/export";
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b4fd8] px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-[#1056eb]"
          >
            <Download className="h-4 w-4" />
            导出 CSV
          </button>
        </div>
      }
    >
      {loading && <LoadingSkeleton />}
      {!loading && data && (
        <>
          {data.scope === "self" && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#0b4fd8]/15 bg-[#eaf1ff] px-4 py-2.5 text-[13px] text-[#0b4fd8]">
              <BadgeCheck className="h-4 w-4" />
              当前是客服视角 — 仅展示分配给你 + 未分配的 NEW 线索。
            </div>
          )}

          {/* KPI 卡片 */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="今日新增线索"
              value={data.counters.todayNew}
              hint={`本周 ${data.counters.weekNew} · 本月 ${data.counters.monthNew}`}
            />
            <KpiCard
              icon={<Users className="h-4 w-4" />}
              label="待处理新线索"
              value={data.counters.pendingNew}
              hint="状态 = NEW"
              accent="warn"
            />
            <KpiCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="累计成交"
              value={data.counters.totalDeal}
              hint={`成交金额 ${fmtYuan(data.counters.sumDealAmountCents)}`}
              accent="success"
            />
            <KpiCard
              icon={<Target className="h-4 w-4" />}
              label="成交转化率"
              value={`${data.counters.dealConversion}%`}
              hint={`有效线索率 ${data.counters.effectiveRate}% · 共 ${data.counters.total} 条`}
              accent="brand"
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            {/* 状态漏斗 */}
            <Card className="p-5">
              <SectionTitle icon={<PieChart className="h-4 w-4" />}>
                线索状态漏斗
              </SectionTitle>
              <div className="mt-4 space-y-3">
                {Object.entries(data.funnel).map(([s, c]) => {
                  const total = data.counters.total || 1;
                  const pct = Math.round((c / total) * 100);
                  const meta = STATUS_META[s];
                  return (
                    <div key={s}>
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="flex items-center gap-2 font-medium text-[#344054]">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: meta?.color }}
                          />
                          {meta?.label || s}
                        </span>
                        <span className="text-[#667085]">
                          <span className="font-semibold text-[#172033]">
                            {c}
                          </span>{" "}
                          · {pct}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#f1f5fb]">
                        <div
                          className="h-full rounded-full transition-[width]"
                          style={{
                            width: `${pct}%`,
                            background: meta?.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 热门目的地 */}
            <Card className="p-5">
              <SectionTitle icon={<MapPin className="h-4 w-4" />}>
                热门目的地 TOP
              </SectionTitle>
              <div className="mt-3">
                <RankList
                  items={data.topDestinations.map((d) => ({
                    label: d.destination,
                    count: d.count,
                  }))}
                  emptyHint="暂无数据"
                />
              </div>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            {/* 渠道来源 */}
            <Card className="p-5">
              <SectionTitle>渠道来源 TOP</SectionTitle>
              <div className="mt-3">
                <RankList
                  items={data.topSources.map((s) => ({
                    label: s.source,
                    count: s.count,
                  }))}
                  emptyHint="暂无数据"
                />
              </div>
            </Card>

            {/* 今日状态 */}
            <Card className="p-5">
              <SectionTitle>今日新增按状态分布</SectionTitle>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {Object.entries(data.todayStatus).map(([s, c]) => {
                  const meta = STATUS_META[s];
                  return (
                    <div
                      key={s}
                      className="rounded-xl border border-[#e9edf5] bg-[#f5f8ff] p-3"
                    >
                      <div className="flex items-center gap-1.5 text-[11.5px] text-[#667085]">
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ background: meta?.color }}
                        />
                        {meta?.label || s}
                      </div>
                      <div className="mt-1 text-[18px] font-bold text-[#0b1f4a]">
                        {c}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* 客服排行（仅管理员可见） */}
          {data.staffStats.length > 0 && (
            <div className="mt-4">
              <Card className="p-5">
                <SectionTitle icon={<UserCircle2 className="h-4 w-4" />}>
                  客服跟进排行
                </SectionTitle>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-[13px]">
                    <thead>
                      <tr className="text-left text-[12px] text-[#98a2b3]">
                        <th className="pb-2 font-medium">客服</th>
                        <th className="pb-2 font-medium">跟进数</th>
                        <th className="pb-2 font-medium">成交数</th>
                        <th className="pb-2 font-medium">成交率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.staffStats.map((s) => (
                        <tr key={s.adminId} className="border-t border-[#e9edf5]">
                          <td className="py-2.5">
                            <span className="font-medium text-[#172033]">
                              {s.realName || s.username}
                            </span>
                            <span className="ml-1.5 text-[11.5px] text-[#98a2b3]">
                              @{s.username}
                            </span>
                          </td>
                          <td className="py-2.5 text-[#344054]">{s.total}</td>
                          <td className="py-2.5 font-semibold text-[#067647]">
                            {s.deal}
                          </td>
                          <td className="py-2.5 text-[#0b4fd8]">
                            {s.total > 0
                              ? `${Math.round((s.deal / s.total) * 100)}%`
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
  accent?: "brand" | "warn" | "success";
}) {
  const iconBg =
    accent === "warn"
      ? "bg-[#fff3e8] text-[#b04a00]"
      : accent === "success"
      ? "bg-[#e6f9f0] text-[#067647]"
      : accent === "brand"
      ? "bg-[#eaf1ff] text-[#0b4fd8]"
      : "bg-[#f1f5fb] text-[#475467]";
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span
          className={`grid h-7 w-7 place-items-center rounded-lg ${iconBg}`}
        >
          {icon}
        </span>
        <span className="text-[12.5px] text-[#667085]">{label}</span>
      </div>
      <div className="mt-3 text-[28px] font-bold leading-none tracking-tight text-[#0b1f4a]">
        {value}
      </div>
      {hint && <div className="mt-2 text-[12px] text-[#98a2b3]">{hint}</div>}
    </Card>
  );
}

function SectionTitle({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-[14.5px] font-semibold text-[#0b1f4a]">
      {icon && (
        <span className="grid h-6 w-6 place-items-center rounded-md bg-[#eaf1ff] text-[#0b4fd8]">
          {icon}
        </span>
      )}
      {children}
    </div>
  );
}

function RankList({
  items,
  emptyHint,
}: {
  items: Array<{ label: string; count: number }>;
  emptyHint: string;
}) {
  if (items.length === 0)
    return <div className="py-8 text-center text-[13px] text-[#98a2b3]">{emptyHint}</div>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-2">
      {items.map((it, i) => {
        const pct = Math.round((it.count / max) * 100);
        return (
          <div key={it.label} className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eaf1ff] text-[11.5px] font-semibold text-[#0b4fd8]">
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-medium text-[#172033]">{it.label}</span>
                <span className="text-[#667085]">{it.count}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#f1f5fb]">
                <div
                  className="h-full rounded-full bg-[#0b4fd8]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[120px] animate-pulse rounded-2xl bg-white ring-1 ring-[#e9edf5]"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-[300px] animate-pulse rounded-2xl bg-white ring-1 ring-[#e9edf5]" />
        <div className="h-[300px] animate-pulse rounded-2xl bg-white ring-1 ring-[#e9edf5]" />
      </div>
    </div>
  );
}
