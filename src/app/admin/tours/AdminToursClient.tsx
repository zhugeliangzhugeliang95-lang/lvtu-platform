"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, ExternalLink, MapPin, Settings2, Sparkles } from "lucide-react";

type TourItem = {
  id: string;
  slug: string;
  name: string;
  destination: string;
  tourType: string;
  days: number;
  status: "DRAFT" | "ONLINE" | "OFFLINE";
  recommended: boolean;
  updatedAt: string;
  departureCount: number;
  itineraryCount: number;
  nextDeparture: { date: string; price: number } | null;
};

const STATUS = {
  DRAFT: { label: "草稿", className: "bg-[#f2f4f7] text-[#475467]" },
  ONLINE: { label: "已上架", className: "bg-[#e7f8ef] text-[#087443]" },
  OFFLINE: { label: "已下架", className: "bg-[#fff2e8] text-[#a64200]" },
} as const;

export function AdminToursClient({ initialItems }: { initialItems: TourItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function update(id: string, body: { status?: TourItem["status"]; recommended?: boolean }) {
    setBusyId(id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/tours/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "保存失败，请稍后重试");
      setItems((current) => current.map((item) => item.id === id ? { ...item, ...body } : item));
      setMessage(body.status === "ONLINE" ? "产品已上架，前台和 AI 均可读取" : body.status === "OFFLINE" ? "产品已下架" : "产品设置已保存");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败，请稍后重试");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {message ? <div className="rounded-xl border border-[#cfe0f5] bg-[#edf6ff] px-4 py-3 text-sm text-[#195e9f]" role="status">{message}</div> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["全部产品", items.length],
          ["已上架", items.filter((item) => item.status === "ONLINE").length],
          ["待完善", items.filter((item) => !item.departureCount || !item.itineraryCount).length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[#e4eaf2] bg-white p-4 shadow-[0_8px_24px_rgba(22,57,92,.04)]">
            <p className="text-xs text-[#667085]">{label}</p>
            <p className="mt-2 text-2xl font-bold text-[#0b1f4a]">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e4eaf2] bg-white shadow-[0_10px_30px_rgba(22,57,92,.04)]">
        {items.length ? items.map((item) => {
          const status = STATUS[item.status];
          return (
            <article key={item.id} className="border-b border-[#edf1f6] p-4 last:border-0 md:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-[15px] font-semibold text-[#14233b]">{item.name}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}>{status.label}</span>
                    {item.recommended ? <span className="inline-flex items-center gap-1 rounded-full bg-[#fff6db] px-2.5 py-1 text-[10px] font-semibold text-[#956400]"><Sparkles className="h-3 w-3" />推荐</span> : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#667085]">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.destination} · {item.days}天 · {item.tourType}</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{item.departureCount} 个班期 · {item.itineraryCount} 天行程</span>
                    <span>{item.nextDeparture ? `最近 ${new Date(item.nextDeparture.date).toLocaleDateString("zh-CN")} · ¥${item.nextDeparture.price.toLocaleString()}起` : "暂无班期"}</span>
                  </div>
                  <p className="mt-2 text-[11px] text-[#98a2b3]">/{item.slug} · 更新于 {new Date(item.updatedAt).toLocaleString("zh-CN")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" disabled={busyId === item.id} onClick={() => update(item.id, { recommended: !item.recommended })} className="h-9 rounded-lg border border-[#dfe5ee] bg-white px-3 text-xs font-medium text-[#475467] transition hover:bg-[#f7f9fc] disabled:opacity-50">
                    {item.recommended ? "取消推荐" : "设为推荐"}
                  </button>
                  <button type="button" disabled={busyId === item.id} onClick={() => update(item.id, { status: item.status === "ONLINE" ? "OFFLINE" : "ONLINE" })} className={`h-9 rounded-lg px-3 text-xs font-semibold text-white transition disabled:opacity-50 ${item.status === "ONLINE" ? "bg-[#667085] hover:bg-[#475467]" : "bg-[#1769e0] hover:bg-[#0f5ecf]"}`}>
                    {busyId === item.id ? "保存中…" : item.status === "ONLINE" ? "下架" : "上架"}
                  </button>
                  {item.status === "ONLINE" ? <Link href={`/tours/${item.slug}`} target="_blank" className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe5ee] text-[#475467]" aria-label="预览前台"><ExternalLink className="h-4 w-4" /></Link> : null}
                  <Link href={`/admin/tours/${item.id}/departures`} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#eaf1ff] px-3 text-xs font-semibold text-[#0b4fd8]">
                    <Settings2 className="h-4 w-4" />管理内容
                  </Link>
                </div>
              </div>
            </article>
          );
        }) : (
          <div className="px-6 py-16 text-center">
            <p className="text-base font-semibold text-[#172033]">还没有旅行团产品</p>
            <p className="mt-2 text-sm text-[#667085]">创建第一个产品后，再添加班期和每日行程。</p>
            <Link href="/admin/tours/new" className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#1769e0] px-4 text-sm font-semibold text-white">立即新建</Link>
          </div>
        )}
      </div>
    </div>
  );
}
