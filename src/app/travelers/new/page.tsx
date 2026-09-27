"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { PlatformFrame } from "@/components/platform/Catalog";

export default function NewTraveler() {
  const [form, setForm] = useState({ name: "", mobile: "", documentType: "身份证", documentNumber: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    const response = await fetch("/api/travelers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    const json = await response.json().catch(() => ({}));
    if (response.status === 401) { window.location.assign(`/login?next=${encodeURIComponent("/travelers/new")}&reason=${encodeURIComponent("添加常用旅客")}`); return; }
    if (!response.ok) { setError(json.error || "保存失败，请稍后重试"); setLoading(false); return; }
    setSaved(true); setLoading(false);
  }
  if (saved) return <PlatformFrame title="添加成功" back="/travelers" active="member"><section className="px-5 pt-12"><div className="app-card px-6 py-10 text-center"><CheckCircle2 size={46} className="mx-auto text-emerald-500"/><h1 className="mt-4 text-[20px] font-semibold">常用旅客已保存</h1><p className="mt-2 text-[11px] leading-5 text-[var(--app-muted)]">后续咨询、票务和酒店服务可以更快核对出行人信息。</p><Link href="/travelers" className="mt-6 inline-flex min-h-11 items-center rounded-[15px] bg-[var(--app-blue)] px-5 text-[12px] font-semibold text-white">返回旅客列表</Link></div></section></PlatformFrame>;
  const update = (key: keyof typeof form, value: string) => setForm((old) => ({ ...old, [key]: value }));
  return <PlatformFrame title="添加旅客" subtitle="证件信息可以稍后补充" back="/travelers" active="member"><form onSubmit={submit} className="space-y-4 px-5 py-6"><label className="block"><span className="mb-2 block text-[12px] font-semibold">真实姓名 *</span><input required value={form.name} onChange={(e)=>update("name",e.target.value)} placeholder="请输入证件上的姓名" className="h-12 w-full rounded-[15px] border border-[#dce8f4] bg-white px-4 text-[13px] outline-none focus:border-[#1677ff]"/></label><label className="block"><span className="mb-2 block text-[12px] font-semibold">手机号</span><input value={form.mobile} onChange={(e)=>update("mobile",e.target.value)} inputMode="tel" placeholder="用于必要的出行联系" className="h-12 w-full rounded-[15px] border border-[#dce8f4] bg-white px-4 text-[13px] outline-none focus:border-[#1677ff]"/></label><div className="grid grid-cols-[118px_1fr] gap-3"><label className="block"><span className="mb-2 block text-[12px] font-semibold">证件类型</span><select value={form.documentType} onChange={(e)=>update("documentType",e.target.value)} className="h-12 w-full rounded-[15px] border border-[#dce8f4] bg-white px-3 text-[12px] outline-none"><option>身份证</option><option>护照</option><option>港澳通行证</option><option>其他</option></select></label><label className="block"><span className="mb-2 block text-[12px] font-semibold">证件号码</span><input value={form.documentNumber} onChange={(e)=>update("documentNumber",e.target.value)} placeholder="非必填" className="h-12 w-full rounded-[15px] border border-[#dce8f4] bg-white px-4 text-[13px] outline-none focus:border-[#1677ff]"/></label></div><div className="flex gap-3 rounded-[18px] bg-[#eef7ff] p-4 text-[10px] leading-5 text-[#53677e]"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[var(--app-blue)]"/>证件信息仅用于你明确确认的实名旅行服务，并会在列表中脱敏显示。</div>{error ? <p className="rounded-[14px] bg-red-50 px-4 py-3 text-[11px] text-red-700">{error}</p> : null}<button disabled={loading || form.name.trim().length < 2} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[17px] bg-[var(--app-blue)] text-[13px] font-semibold text-white disabled:opacity-50">{loading ? <><Loader2 size={16} className="animate-spin"/>保存中…</> : "保存旅客"}</button></form></PlatformFrame>;
}
