"use client";
import { useState } from "react";
type MembershipItem = {
  id: string;
  name: string;
  phone: string;
  memberNo: string;
  effectiveStatus: string;
  expiresAt?: string | null;
};

export function MembershipsClient() {
  const [phone, setPhone] = useState("");
  const [items, setItems] = useState<MembershipItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/memberships?phone=${encodeURIComponent(phone)}`);
      const data = await response.json() as { memberships?: MembershipItem[] };
      setItems(data.memberships || []);
    } finally {
      setLoading(false);
    }
  }

  return <section className="space-y-4"><div className="flex gap-2"><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="输入手机号查询" className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"/><button type="button" onClick={() => void search()} className="rounded-xl bg-[#1769e0] px-5 text-sm font-semibold text-white">{loading ? "查询中" : "查询"}</button></div><div className="grid gap-3">{items.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><div><p className="font-semibold text-slate-900">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.phone} · {item.memberNo}</p></div><span className={`rounded-full px-2.5 py-1 text-xs ${item.effectiveStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.effectiveStatus === "ACTIVE" ? "有效会员" : item.effectiveStatus === "EXPIRED" ? "已过期" : item.effectiveStatus}</span></div><p className="mt-4 text-xs text-slate-500">有效期至：{item.expiresAt ? new Date(item.expiresAt).toLocaleDateString("zh-CN") : "-"}</p></div>)}{!loading && !items.length ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">输入手机号查询会员</div> : null}</div></section>;
}
