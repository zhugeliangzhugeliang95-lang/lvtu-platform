"use client";

import { useEffect, useState } from "react";
import { Bot, RefreshCw, CheckCircle2, MessageSquare } from "lucide-react";
import { AdminShell, Card } from "@/components/hotel-admin/AdminShell";

type RobotLead = {
  id: string;
  name: string;
  wechat: string;
  destination: string;
  travelDate: string | null;
  peopleCount: number;
  budget: string | null;
  notes: string | null;
  aiRequestNote: string | null;
  aiOpening: string | null;
  status: string;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  NEW: "新线索",
  FRIEND_PENDING: "待通过好友",
  FRIEND_ACCEPTED: "已通过好友",
  QUOTED: "已报价",
  CLOSED: "已关闭",
};

const STATUS_CLS: Record<string, string> = {
  NEW: "bg-[#eaf1ff] text-[#0b4fd8] ring-[#0b4fd8]/20",
  FRIEND_PENDING: "bg-[#fff3e8] text-[#b04a00] ring-[#ff7a1a]/25",
  FRIEND_ACCEPTED: "bg-[#e6f9f0] text-[#067647] ring-[#12b76a]/25",
  QUOTED: "bg-[#fef4ca] text-[#8a5400] ring-[#d0a23d]/25",
  CLOSED: "bg-[#f1f5fb] text-[#475467] ring-[#cdd5df]",
};

const EMPTY_QUOTE = {
  hotelName: "", hotelPrice: "", roomType: "",
  totalPrice: "", includes: "", notes: "",
};

export default function RobotPage() {
  const [leads, setLeads] = useState<RobotLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [quoteForm, setQuoteForm] = useState(EMPTY_QUOTE);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    const r = await fetch("/api/robot/leads").catch(() => null);
    const d = r?.ok ? await r.json() : null;
    setLeads(d?.leads ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 5000);
  }

  async function markAccepted(id: string) {
    setBusy(true);
    await fetch(`/api/robot/leads/${id}/mark-friend-accepted`, { method: "POST" });
    showToast("已标记通过好友，开场白任务已创建");
    await load();
    setBusy(false);
  }

  async function submitQuote(id: string) {
    setBusy(true);
    const r = await fetch(`/api/robot/leads/${id}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quoteForm),
    });
    const d = r.ok ? await r.json() : null;
    showToast(d?.quoteMessage ? `报价话术已生成：${d.quoteMessage}` : "报价已提交");
    setQuoteId(null);
    setQuoteForm(EMPTY_QUOTE);
    await load();
    setBusy(false);
  }

  const total = leads.length;
  const pending = leads.filter((l) => l.status === "NEW" || l.status === "FRIEND_PENDING").length;
  const accepted = leads.filter((l) => l.status === "FRIEND_ACCEPTED").length;
  const quoted = leads.filter((l) => l.status === "QUOTED").length;

  return (
    <AdminShell
      title="AI 私域机器人"
      subtitle="管理私域线索 · 查看 AI 话术 · 录入报价"
      headerExtra={
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e7ec] bg-white px-3.5 py-2 text-[13px] font-medium text-[#475467] transition hover:bg-[#f1f5fb]"
        >
          <RefreshCw className="h-4 w-4" />
          刷新
        </button>
      }
    >
      {/* Toast */}
      {toast && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-[#12b76a]/30 bg-[#e6f9f0] px-4 py-3 text-[13px] text-[#067647]">
          <span>{toast}</span>
          <button onClick={() => setToast("")} className="shrink-0 text-[#067647]/60 hover:text-[#067647]">✕</button>
        </div>
      )}

      {/* KPI */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "全部线索", value: total, icon: <Bot className="h-4 w-4" /> },
          { label: "待处理", value: pending, icon: <MessageSquare className="h-4 w-4" />, accent: "warn" },
          { label: "已通过好友", value: accepted, icon: <CheckCircle2 className="h-4 w-4" />, accent: "success" },
          { label: "已报价", value: quoted, icon: <CheckCircle2 className="h-4 w-4" />, accent: "brand" },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              k.accent === "warn" ? "bg-[#fff3e8] text-[#b04a00]"
              : k.accent === "success" ? "bg-[#e6f9f0] text-[#067647]"
              : k.accent === "brand" ? "bg-[#eaf1ff] text-[#0b4fd8]"
              : "bg-[#f1f5fb] text-[#475467]"
            }`}>{k.icon}</div>
            <div className="mt-2 text-[24px] font-bold text-[#0b1f4a]">{k.value}</div>
            <div className="text-[12px] text-[#98a2b3]">{k.label}</div>
          </Card>
        ))}
      </div>

      {/* 线索列表 */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[100px] animate-pulse rounded-2xl bg-white ring-1 ring-[#e9edf5]" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <Card className="py-16 text-center text-[14px] text-[#98a2b3]">暂无线索</Card>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Card key={lead.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                {/* 基本信息 */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold text-[#0b1f4a]">{lead.name}</span>
                    <span className="font-mono text-[12.5px] text-[#667085]">微信：{lead.wechat}</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ring-1 ring-inset ${STATUS_CLS[lead.status] ?? STATUS_CLS.CLOSED}`}>
                      {STATUS_LABEL[lead.status] ?? lead.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[13px] text-[#475467]">
                    <span>目的地：<strong className="text-[#172033]">{lead.destination}</strong></span>
                    {lead.travelDate && <span>出行：{lead.travelDate}</span>}
                    <span>{lead.peopleCount} 人</span>
                    {lead.budget && <span>预算：{lead.budget}</span>}
                  </div>
                  {lead.notes && <div className="text-[12.5px] text-[#98a2b3]">备注：{lead.notes}</div>}
                </div>

                {/* 操作按钮 */}
                <div className="flex shrink-0 gap-2">
                  {(lead.status === "NEW" || lead.status === "FRIEND_PENDING") && (
                    <button
                      disabled={busy}
                      onClick={() => markAccepted(lead.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#e6f9f0] px-3 py-1.5 text-[12.5px] font-medium text-[#067647] transition hover:bg-[#12b76a] hover:text-white disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      已通过好友
                    </button>
                  )}
                  {lead.status === "FRIEND_ACCEPTED" && (
                    <button
                      onClick={() => { setQuoteId(lead.id); setQuoteForm(EMPTY_QUOTE); }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#eaf1ff] px-3 py-1.5 text-[12.5px] font-medium text-[#0b4fd8] transition hover:bg-[#0b4fd8] hover:text-white"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      录入报价
                    </button>
                  )}
                </div>
              </div>

              {/* AI 话术展示 */}
              {(lead.aiRequestNote || lead.aiOpening) && (
                <div className="mt-3 space-y-2 border-t border-[#e9edf5] pt-3">
                  {lead.aiRequestNote && (
                    <div className="rounded-lg bg-[#f5f8ff] px-3 py-2 text-[12.5px] text-[#344054]">
                      <span className="mr-1.5 font-semibold text-[#0b4fd8]">加好友备注：</span>
                      {lead.aiRequestNote}
                    </div>
                  )}
                  {lead.aiOpening && (
                    <div className="rounded-lg bg-[#f0fdf4] px-3 py-2 text-[12.5px] text-[#344054]">
                      <span className="mr-1.5 font-semibold text-[#067647]">开场白：</span>
                      {lead.aiOpening}
                    </div>
                  )}
                </div>
              )}

              {/* 报价表单（内联展开） */}
              {quoteId === lead.id && (
                <div className="mt-4 border-t border-[#e9edf5] pt-4">
                  <div className="mb-3 text-[13.5px] font-semibold text-[#0b1f4a]">录入报价信息</div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {([
                      ["hotelName", "酒店名称"],
                      ["roomType", "房型"],
                      ["hotelPrice", "酒店价格"],
                      ["totalPrice", "总价"],
                      ["includes", "含（早餐等）"],
                      ["notes", "备注"],
                    ] as [keyof typeof EMPTY_QUOTE, string][]).map(([key, label]) => (
                      <div key={key}>
                        <label className="mb-1 block text-[12px] text-[#667085]">{label}</label>
                        <input
                          value={quoteForm[key]}
                          onChange={(e) => setQuoteForm((f) => ({ ...f, [key]: e.target.value }))}
                          placeholder={label}
                          className="w-full rounded-lg border border-[#e4e7ec] bg-white px-3 py-1.5 text-[13px] text-[#172033] placeholder-[#c0c9d8] focus:border-[#0b4fd8] focus:outline-none focus:ring-1 focus:ring-[#0b4fd8]/30"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      disabled={busy}
                      onClick={() => submitQuote(lead.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b4fd8] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#1056eb] disabled:opacity-50"
                    >
                      {busy ? "生成中…" : "生成报价话术并提交"}
                    </button>
                    <button
                      onClick={() => setQuoteId(null)}
                      className="rounded-lg border border-[#e4e7ec] px-4 py-2 text-[13px] text-[#475467] transition hover:bg-[#f1f5fb]"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
