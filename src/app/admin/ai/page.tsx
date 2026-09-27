"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen, Bot, CheckCircle2, Database, Headphones, LoaderCircle,
  MessageCircle, Plus, RefreshCw, Sparkles, Tags, UsersRound,
} from "lucide-react";
import { AdminShell, Card } from "@/components/hotel-admin/AdminShell";

type Conversation = {
  id: string; status: string; highValue: boolean; handoffReason: string | null;
  lastMessageAt: string; profile: Record<string, unknown>; tags: string[];
  messages: Array<{ id: string; role: string; content: string; modelName: string | null; createdAt: string }>;
};
type Handoff = { id: string; conversationId: string; customerName: string | null; contact: string | null; summary: string; status: string; createdAt: string };
type Knowledge = { id: string; category: string; title: string; city: string | null; content: string; enabled: boolean; updatedAt: string };
type ModelCall = { id: string; taskType: string; modelName: string; provider: string; latencyMs: number; success: boolean; inputTokens: number | null; outputTokens: number | null; createdAt: string };
type DashboardData = {
  counters: { total: number; active: number; highValue: number; pendingHandoffs: number };
  conversations: Conversation[]; handoffs: Handoff[]; knowledge: Knowledge[]; modelCalls: ModelCall[];
};

const TABS = [
  { key: "conversations", label: "聊天与需求", icon: MessageCircle },
  { key: "handoffs", label: "人工接管", icon: Headphones },
  { key: "knowledge", label: "知识库", icon: BookOpen },
  { key: "models", label: "模型日志", icon: Database },
] as const;
type Tab = typeof TABS[number]["key"];

const STATUS_LABEL: Record<string, string> = { ACTIVE: "AI服务中", HANDOFF_REQUESTED: "待人工接管", HUMAN_TAKEN_OVER: "人工已接管", CLOSED: "已结束" };
const CATEGORY_LABEL: Record<string, string> = { DESTINATION: "目的地", HOTEL: "酒店", ITINERARY: "旅行方案", FAQ: "FAQ" };

export default function AIAdvisorAdminPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("conversations");
  const [selectedId, setSelectedId] = useState<string>();
  const [working, setWorking] = useState("");

  async function load() {
    setLoading(true);
    try { const response = await fetch("/api/admin/ai", { cache: "no-store" }); if (response.ok) setData(await response.json()); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  const selected = useMemo(() => data?.conversations.find((item) => item.id === selectedId) || data?.conversations[0], [data, selectedId]);

  async function action(body: Record<string, unknown>, key: string) {
    setWorking(key);
    try {
      const response = await fetch("/api/admin/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) { const result = await response.json(); window.alert(result.message || "操作失败"); return false; }
      await load(); return true;
    } finally { setWorking(""); }
  }

  return <AdminShell title="AI 旅行顾问" subtitle="对话质量、客户需求、人工接力与知识库运营" headerExtra={<button type="button" onClick={load} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#dce4ed] bg-white px-3 text-[12px] font-medium text-[#475467]"><RefreshCw size={14} className={loading ? "animate-spin" : ""} />刷新</button>}>
    {loading && !data ? <LoadingState /> : data ? <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<MessageCircle size={16} />} label="累计会话" value={data.counters.total} note={`${data.counters.active} 个AI服务中`} />
        <Metric icon={<Sparkles size={16} />} label="高价值客户" value={data.counters.highValue} note="预订、价格、定制等信号" tone="blue" />
        <Metric icon={<Headphones size={16} />} label="待人工接管" value={data.counters.pendingHandoffs} note="需顾问尽快处理" tone="orange" />
        <Metric icon={<BookOpen size={16} />} label="知识文档" value={data.knowledge.filter((item) => item.enabled).length} note={`共 ${data.knowledge.length} 条`} tone="green" />
      </div>

      <div className="no-scrollbar mt-5 flex gap-1 overflow-x-auto border-b border-[#dfe6ee]">
        {TABS.map(({ key, label, icon: Icon }) => <button key={key} type="button" onClick={() => setTab(key)} className={`flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-[12px] font-semibold transition ${tab === key ? "border-[#0b4fd8] text-[#0b4fd8]" : "border-transparent text-[#667085] hover:text-[#344054]"}`}><Icon size={15} />{label}</button>)}
      </div>

      {tab === "conversations" ? <ConversationWorkspace conversations={data.conversations} selected={selected} onSelect={setSelectedId} onTakeover={(id) => action({ action: "takeover", conversationId: id }, id)} working={working} /> : null}
      {tab === "handoffs" ? <HandoffWorkspace handoffs={data.handoffs} conversations={data.conversations} onTakeover={(id) => action({ action: "takeover", conversationId: id }, id)} working={working} /> : null}
      {tab === "knowledge" ? <KnowledgeWorkspace items={data.knowledge} action={action} working={working} /> : null}
      {tab === "models" ? <ModelWorkspace items={data.modelCalls} /> : null}
    </> : <Card className="p-8 text-center text-sm text-[#667085]">数据加载失败，请稍后重试。</Card>}
  </AdminShell>;
}

function Metric({ icon, label, value, note, tone = "gray" }: { icon: React.ReactNode; label: string; value: number; note: string; tone?: string }) {
  const colors: Record<string, string> = { gray: "bg-[#f1f5f9] text-[#475467]", blue: "bg-[#eaf1ff] text-[#0b4fd8]", orange: "bg-[#fff3e8] text-[#b04a00]", green: "bg-[#e6f9f0] text-[#067647]" };
  return <Card className="p-4"><div className={`grid size-9 place-items-center rounded-xl ${colors[tone]}`}>{icon}</div><p className="mt-3 text-[11px] text-[#667085]">{label}</p><p className="mt-1 text-[27px] font-bold tracking-tight text-[#0b1f4a]">{value}</p><p className="mt-1 text-[10px] text-[#98a2b3]">{note}</p></Card>;
}

function ConversationWorkspace({ conversations, selected, onSelect, onTakeover, working }: { conversations: Conversation[]; selected?: Conversation; onSelect: (id: string) => void; onTakeover: (id: string) => void; working: string }) {
  if (!conversations.length) return <Empty text="还没有AI顾问会话" />;
  return <div className="mt-5 grid min-h-[560px] gap-4 lg:grid-cols-[340px_1fr]">
    <Card className="overflow-hidden"><div className="border-b border-[#e9edf5] px-4 py-3 text-[11px] font-semibold text-[#667085]">最近会话 · {conversations.length}</div><div className="max-h-[620px] overflow-y-auto">{conversations.map((item) => { const destination = String(item.profile.destination || "目的地待确认"); const last = item.messages.at(-1)?.content || "暂无消息"; return <button type="button" key={item.id} onClick={() => onSelect(item.id)} className={`block w-full border-b border-[#eef2f6] px-4 py-3 text-left transition ${selected?.id === item.id ? "bg-[#eef5ff]" : "bg-white hover:bg-[#f8fafc]"}`}><div className="flex items-center justify-between gap-2"><strong className="truncate text-[12px] text-[#172033]">{destination}</strong><span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${item.highValue ? "bg-[#fff3e8] text-[#b04a00]" : "bg-[#eef2f6] text-[#667085]"}`}>{item.highValue ? "高意向" : STATUS_LABEL[item.status]}</span></div><p className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-[#667085]">{last}</p><p className="mt-2 text-[9px] text-[#98a2b3]">{new Date(item.lastMessageAt).toLocaleString("zh-CN", { hour12: false })}</p></button>; })}</div></Card>
    {selected ? <Card className="flex min-h-0 flex-col overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e9edf5] px-5 py-4"><div><div className="flex items-center gap-2"><h2 className="text-[15px] font-semibold text-[#172033]">{String(selected.profile.destination || "旅行需求")}</h2><span className="rounded-full bg-[#eaf1ff] px-2 py-0.5 text-[9px] font-semibold text-[#0b4fd8]">{STATUS_LABEL[selected.status] || selected.status}</span></div><p className="mt-1 text-[10px] text-[#667085]">{[selected.profile.origin, selected.profile.travelTime, selected.profile.travelers ? `${selected.profile.travelers}人` : "", selected.profile.budget].filter(Boolean).join(" · ") || "关键信息待补充"}</p></div>{selected.status !== "HUMAN_TAKEN_OVER" ? <button type="button" onClick={() => onTakeover(selected.id)} disabled={working === selected.id} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0b4fd8] px-3 text-[11px] font-semibold text-white disabled:opacity-60">{working === selected.id ? <LoaderCircle className="animate-spin" size={14} /> : <Headphones size={14} />}人工接管</button> : <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#067647]"><CheckCircle2 size={14} />已接管</span>}</div>
      <div className="flex flex-wrap gap-2 border-b border-[#e9edf5] px-5 py-3"><Tags size={14} className="text-[#98a2b3]" />{selected.tags.length ? selected.tags.map((tag) => <span key={tag} className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[9px] text-[#475467]">{tag}</span>) : <span className="text-[10px] text-[#98a2b3]">暂无标签</span>}</div>
      <div className="flex-1 space-y-4 overflow-y-auto p-5">{selected.messages.map((message) => <div key={message.id} className={`flex ${message.role === "USER" ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 text-[11px] leading-5 ${message.role === "USER" ? "rounded-br-md bg-[#0b4fd8] text-white" : "rounded-bl-md bg-[#f1f5f9] text-[#344054]"}`}><p className="whitespace-pre-line">{message.content}</p>{message.modelName ? <p className="mt-2 text-[8px] opacity-55">{message.modelName}</p> : null}</div></div>)}</div>
    </Card> : null}
  </div>;
}

function HandoffWorkspace({ handoffs, conversations, onTakeover, working }: { handoffs: Handoff[]; conversations: Conversation[]; onTakeover: (id: string) => void; working: string }) {
  if (!handoffs.length) return <Empty text="暂时没有人工接管请求" />;
  return <div className="mt-5 space-y-3">{handoffs.map((item) => { const conversation = conversations.find((entry) => entry.id === item.conversationId); return <Card key={item.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h3 className="text-[13px] font-semibold text-[#172033]">{item.customerName || "待补充姓名"}</h3><span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${item.status === "PENDING" ? "bg-[#fff3e8] text-[#b04a00]" : "bg-[#e6f9f0] text-[#067647]"}`}>{item.status === "PENDING" ? "待接管" : "已接管"}</span></div><p className="mt-1 text-[10px] text-[#667085]">联系方式：{item.contact || "待补充"} · {new Date(item.createdAt).toLocaleString("zh-CN", { hour12: false })}</p></div>{item.status === "PENDING" ? <button type="button" onClick={() => onTakeover(item.conversationId)} disabled={working === item.conversationId} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0b4fd8] px-3 text-[11px] font-semibold text-white">{working === item.conversationId ? <LoaderCircle className="animate-spin" size={14} /> : <UsersRound size={14} />}接管客户</button> : null}</div><pre className="mt-4 whitespace-pre-wrap rounded-xl bg-[#f7f9fc] p-4 font-sans text-[10px] leading-5 text-[#475467]">{item.summary}</pre>{conversation?.handoffReason ? <p className="mt-3 text-[10px] text-[#b04a00]">触发原因：{conversation.handoffReason}</p> : null}</Card>; })}</div>;
}

function KnowledgeWorkspace({ items, action, working }: { items: Knowledge[]; action: (body: Record<string, unknown>, key: string) => Promise<boolean>; working: string }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "DESTINATION", title: "", city: "", content: "", keywords: "" });
  async function create() { const ok = await action({ action: "knowledge.create", ...form, keywords: form.keywords.split(/[，,]/).map((item) => item.trim()).filter(Boolean) }, "create"); if (ok) { setShowForm(false); setForm({ category: "DESTINATION", title: "", city: "", content: "", keywords: "" }); } }
  return <div className="mt-5"><div className="flex justify-end"><button type="button" onClick={() => setShowForm((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0b4fd8] px-3 text-[11px] font-semibold text-white"><Plus size={14} />添加知识</button></div>{showForm ? <Card className="mt-3 p-5"><div className="grid gap-3 sm:grid-cols-3"><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="min-h-11 rounded-xl border border-[#dce4ed] bg-white px-3 text-[12px]"><option value="DESTINATION">目的地</option><option value="HOTEL">酒店</option><option value="ITINERARY">旅行方案</option><option value="FAQ">FAQ</option></select><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="知识标题" className="min-h-11 rounded-xl border border-[#dce4ed] px-3 text-[12px] sm:col-span-2" /><input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="城市（选填）" className="min-h-11 rounded-xl border border-[#dce4ed] px-3 text-[12px]" /><input value={form.keywords} onChange={(event) => setForm({ ...form, keywords: event.target.value })} placeholder="关键词，用逗号分隔" className="min-h-11 rounded-xl border border-[#dce4ed] px-3 text-[12px] sm:col-span-2" /><textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={4} placeholder="填写经过核实的知识内容" className="rounded-xl border border-[#dce4ed] px-3 py-3 text-[12px] sm:col-span-3" /></div><button type="button" onClick={create} disabled={working === "create"} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0b4fd8] px-4 text-[11px] font-semibold text-white disabled:opacity-60">{working === "create" ? <LoaderCircle className="animate-spin" size={14} /> : <BookOpen size={14} />}保存并启用</button></Card> : null}<div className="mt-3 overflow-hidden rounded-2xl border border-[#e4e9f0] bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[11px]"><thead className="bg-[#f7f9fc] text-[#667085]"><tr><th className="px-4 py-3 font-medium">分类</th><th className="px-4 py-3 font-medium">标题</th><th className="px-4 py-3 font-medium">内容摘要</th><th className="px-4 py-3 font-medium">更新</th><th className="px-4 py-3 font-medium">状态</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t border-[#eef2f6]"><td className="px-4 py-3"><span className="rounded-full bg-[#eaf1ff] px-2 py-1 text-[9px] text-[#0b4fd8]">{CATEGORY_LABEL[item.category]}</span></td><td className="px-4 py-3 font-medium text-[#172033]">{item.title}{item.city ? <small className="ml-1 text-[#98a2b3]">· {item.city}</small> : null}</td><td className="max-w-[340px] truncate px-4 py-3 text-[#667085]">{item.content}</td><td className="px-4 py-3 text-[#98a2b3]">{new Date(item.updatedAt).toLocaleDateString("zh-CN")}</td><td className="px-4 py-3"><button type="button" onClick={() => action({ action: "knowledge.toggle", documentId: item.id, enabled: !item.enabled }, item.id)} className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${item.enabled ? "bg-[#e6f9f0] text-[#067647]" : "bg-[#f1f5f9] text-[#667085]"}`}>{working === item.id ? "处理中" : item.enabled ? "已启用" : "已停用"}</button></td></tr>)}</tbody></table></div>{!items.length ? <div className="p-8 text-center text-[11px] text-[#98a2b3]">当前使用内置知识库，可在这里添加旅途自有资料。</div> : null}</div></div>;
}

function ModelWorkspace({ items }: { items: ModelCall[] }) {
  return <div className="mt-5 overflow-hidden rounded-2xl border border-[#e4e9f0] bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[11px]"><thead className="bg-[#f7f9fc] text-[#667085]"><tr><th className="px-4 py-3 font-medium">时间</th><th className="px-4 py-3 font-medium">任务</th><th className="px-4 py-3 font-medium">模型</th><th className="px-4 py-3 font-medium">服务</th><th className="px-4 py-3 font-medium">耗时</th><th className="px-4 py-3 font-medium">Tokens</th><th className="px-4 py-3 font-medium">结果</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t border-[#eef2f6]"><td className="px-4 py-3 text-[#667085]">{new Date(item.createdAt).toLocaleString("zh-CN", { hour12: false })}</td><td className="px-4 py-3"><span className="rounded-full bg-[#eef2f6] px-2 py-1 text-[9px] text-[#475467]">{item.taskType}</span></td><td className="px-4 py-3 font-medium text-[#172033]">{item.modelName}</td><td className="px-4 py-3 text-[#667085]">{item.provider}</td><td className="px-4 py-3 text-[#667085]">{item.latencyMs} ms</td><td className="px-4 py-3 text-[#667085]">{(item.inputTokens || 0) + (item.outputTokens || 0) || "—"}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${item.success ? "bg-[#e6f9f0] text-[#067647]" : "bg-[#fef3f2] text-[#b42318]"}`}>{item.success ? "成功" : "失败"}</span></td></tr>)}</tbody></table></div>{!items.length ? <div className="p-8 text-center text-[11px] text-[#98a2b3]">暂无模型调用记录。</div> : null}</div>;
}

function Empty({ text }: { text: string }) { return <Card className="mt-5 p-12 text-center"><Bot className="mx-auto text-[#b3c0ce]" size={24} /><p className="mt-3 text-[12px] text-[#667085]">{text}</p></Card>; }
function LoadingState() { return <div className="grid min-h-[360px] place-items-center"><div className="text-center text-[12px] text-[#667085]"><LoaderCircle className="mx-auto mb-3 animate-spin text-[#0b4fd8]" size={24} />正在加载AI顾问数据</div></div>; }
