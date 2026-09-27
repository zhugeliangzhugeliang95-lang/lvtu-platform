"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { PlatformFrame } from "@/components/platform/Catalog";

const categories = ["订单异常", "入住问题", "房型不符", "早餐问题", "日期修改", "取消 / 退款", "门票问题", "车辆问题", "旅行团问题", "凭证问题", "其他"];

export function SupportForm({ initialType, initialOrderNo }: { initialType?: string; initialOrderNo?: string }) {
  const [category, setCategory] = useState(categories.includes(initialType || "") ? initialType! : "订单异常");
  const [orderNo, setOrderNo] = useState(initialOrderNo || "");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ticketNo, setTicketNo] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    const response = await fetch("/api/support", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ category, orderNo, description, attachment }) });
    const json = await response.json().catch(() => ({}));
    if (response.status === 401) { window.location.assign(`/login?next=${encodeURIComponent("/support/new")}&reason=${encodeURIComponent("提交售后")}`); return; }
    if (!response.ok) { setError(json.error || "提交失败，请稍后重试"); setLoading(false); return; }
    setTicketNo(json.ticket.ticketNo); setLoading(false);
  }

  if (ticketNo) return <PlatformFrame title="售后已提交" back="/support" active="member"><section className="px-5 pt-12"><div className="app-card px-6 py-10 text-center"><CheckCircle2 size={46} className="mx-auto text-emerald-500"/><h1 className="mt-4 text-[20px] font-semibold">我们已收到你的问题</h1><p className="mt-2 text-[11px] leading-5 text-[var(--app-muted)]">售后编号 {ticketNo}<br/>顾问会根据问题类型继续跟进，进度可在售后中心查看。</p><Link href="/support" className="mt-6 inline-flex min-h-11 items-center rounded-[15px] bg-[#1677ff] px-5 text-[12px] font-semibold text-white">查看处理进度</Link></div></section></PlatformFrame>;

  return <PlatformFrame title="提交售后" subtitle="描述问题，顾问会持续跟进" back="/support" active="member"><form onSubmit={submit} className="space-y-4 px-5 py-6"><label className="block"><span className="mb-2 block text-[12px] font-semibold">问题类型</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 w-full rounded-[15px] border border-[#dce8f4] bg-white px-4 text-[13px] outline-none focus:border-[#1677ff]">{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="block"><span className="mb-2 block text-[12px] font-semibold">订单号（可选）</span><input value={orderNo} onChange={(event) => setOrderNo(event.target.value)} placeholder="如 TGMU40SPA7227" className="h-12 w-full rounded-[15px] border border-[#dce8f4] bg-white px-4 text-[13px] outline-none focus:border-[#1677ff]"/></label><label className="block"><span className="mb-2 block text-[12px] font-semibold">问题说明</span><textarea required minLength={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="请说明发生了什么、希望如何处理" className="min-h-36 w-full rounded-[15px] border border-[#dce8f4] bg-white p-4 text-[13px] outline-none focus:border-[#1677ff]"/></label><label className="block"><span className="mb-2 block text-[12px] font-semibold">图片或凭证链接（可选）</span><input value={attachment} onChange={(event) => setAttachment(event.target.value)} placeholder="粘贴图片链接或凭证说明" className="h-12 w-full rounded-[15px] border border-[#dce8f4] bg-white px-4 text-[13px] outline-none focus:border-[#1677ff]"/></label>{error ? <p className="rounded-[14px] bg-red-50 px-4 py-3 text-[11px] text-red-700">{error}</p> : null}<button disabled={loading || description.trim().length < 5} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[17px] bg-[#1677ff] text-[13px] font-semibold text-white disabled:opacity-50">{loading ? <><Loader2 size={16} className="animate-spin"/>提交中…</> : "提交售后"}</button></form></PlatformFrame>;
}
