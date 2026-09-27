"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, ChevronRight, LoaderCircle, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { SupplierStatusBadge } from "./SupplierStatusBadge";

type Supplier = { id: string; brandName: string; legalEntityName: string; status: string; city: string | null; internalScore: number; isVerified: boolean; isPublic: boolean; lastReviewedAt: string | null; nextFollowUpAt: string | null; licenses: Array<{ status: string; licenseNumber: string | null }>; services: Array<{ code: string }>; destinations: Array<{ name: string }>; risks: Array<{ id: string }> };

export function SupplierListClient({ initialStatus = "ALL" }: { initialStatus?: string }) {
  const [items, setItems] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [city, setCity] = useState("");
  const query = useMemo(() => new URLSearchParams({ ...(q ? { q } : {}), ...(status !== "ALL" ? { status } : {}), ...(city ? { city } : {}), pageSize: "50" }).toString(), [q, status, city]);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const response = await fetch(`/api/admin/suppliers?${query}`, { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "加载失败"); setItems(data.items); setTotal(data.total); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "加载失败"); } finally { setLoading(false); }
  }, [query]);
  useEffect(() => { const timer = window.setTimeout(load, 120); return () => window.clearTimeout(timer); }, [load]);
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2 border-b border-[#dfe5ee] pb-4">
      <label className="relative min-w-[240px] flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-[#98a2b3]"/><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索品牌、法定名称或许可证" className="h-10 w-full rounded-lg border border-[#dfe5ee] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#1769e0]"/></label>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-[#dfe5ee] bg-white px-3 text-sm"><option value="ALL">全部状态</option><option value="RESEARCHED">已研究</option><option value="CONTACT_PENDING">待联系</option><option value="CONTACTED">已联系</option><option value="QUALIFICATION_PENDING">待补资质</option><option value="VERIFIED">已核验</option><option value="ACTIVE">可供货</option><option value="PAUSED">暂停</option><option value="REJECTED">拒绝</option><option value="EXPIRED">过期</option></select>
      <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="城市" className="h-10 w-28 rounded-lg border border-[#dfe5ee] bg-white px-3 text-sm"/>
      <button onClick={load} title="刷新" className="grid h-10 w-10 place-items-center rounded-lg border border-[#dfe5ee] bg-white text-[#475467]"><RefreshCw className="h-4 w-4"/></button>
    </div>
    <div className="flex items-center justify-between text-xs text-[#667085]"><span>筛选结果 {total} 家</span><span>内部评分仅用于采购排序</span></div>
    {loading ? <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-[#667085]"><LoaderCircle className="h-5 w-5 animate-spin"/>正在读取供应商资料</div> : error ? <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-sm text-red-700"><AlertTriangle/>{error}<button onClick={load} className="rounded-lg border px-3 py-2">重试</button></div> : items.length === 0 ? <div className="flex min-h-56 flex-col items-center justify-center text-center"><Building2 className="h-8 w-8 text-[#98a2b3]"/><p className="mt-3 font-semibold">没有符合条件的机构</p><p className="mt-1 text-sm text-[#667085]">请放宽状态或城市筛选。</p></div> : <div className="overflow-hidden rounded-lg border border-[#dfe5ee] bg-white">
      {items.map((item) => <Link href={`/admin/suppliers/${item.id}`} key={item.id} className="grid gap-3 border-b border-[#eef1f5] p-4 transition last:border-0 hover:bg-[#f8fafc] md:grid-cols-[minmax(240px,1.5fr)_130px_110px_100px_32px] md:items-center">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="truncate text-sm text-[#172033]">{item.brandName}</strong>{item.isVerified && <ShieldCheck className="h-4 w-4 text-emerald-600"/>}</div><p className="mt-1 truncate text-xs text-[#667085]">{item.legalEntityName}</p><div className="mt-2 flex gap-3 text-[11px] text-[#98a2b3]"><span>{item.city || "地区待核验"}</span><span>{item.destinations.slice(0, 2).map((x) => x.name).join(" · ")}</span></div></div>
        <div><SupplierStatusBadge status={item.status}/><div className="mt-1 text-[11px] text-[#667085]">{item.licenses[0]?.status === "VALID" ? "许可证有效" : "资质待核验"}</div></div>
        <div className="text-xs text-[#667085]"><span className="block text-[10px] text-[#98a2b3]">内部评分</span><strong className="text-lg text-[#172033]">{item.internalScore}</strong> / 100</div>
        <div className="text-xs text-[#667085]"><span className="block text-[10px] text-[#98a2b3]">风险 / 发布</span><span className={item.risks.length ? "text-amber-700" : "text-emerald-700"}>{item.risks.length} 项</span> · {item.isPublic ? "已公开" : "未公开"}</div>
        <ChevronRight className="hidden h-4 w-4 text-[#98a2b3] md:block"/>
      </Link>)}
    </div>}
  </div>;
}
