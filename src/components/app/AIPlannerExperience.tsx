"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp, BedDouble, Check, ChevronDown, Clock3, Compass, Headphones, LoaderCircle,
  MapPin, RotateCcw, SlidersHorizontal, Sparkles, UsersRound, Wallet, X,
} from "lucide-react";

import { AppTopBar, TravelAppShell } from "@/components/app/TravelAppShell";
import { AdvisorHandoffSheet } from "@/components/app/AdvisorHandoffSheet";
import type { AdvisorEstimateCard, KnowledgeSource, TravelProfile } from "@/lib/ai-advisor/types";

type ChatMessage = { role: "assistant" | "user"; content: string; sources?: KnowledgeSource[]; estimateCard?: AdvisorEstimateCard };
type AdvisorResponse = {
  message: string;
  profile: TravelProfile;
  handoffSuggested: boolean;
  handoffReason?: string;
  sources: KnowledgeSource[];
  quickReplies: string[];
  estimateCard?: AdvisorEstimateCard;
};

const WELCOME: ChatMessage = {
  role: "assistant",
  content: "你好，我是旅途 AI 旅行顾问。\n\n我可以查询现在已上架的旅行团、梳理你的行程需求，也能根据酒店或其他非标服务的公开原价，稳定生成 70%～80% 预估区间。旅行团名额、库存、退改规则和最终确认价仍由人工顾问核实。\n\n你可以直接说：“现在有哪些旅行团？”或“三亚酒店公开原价5000元，2个人住2晚，帮我预估。”",
};

const STARTERS = [
  "看看现在有哪些旅行团",
  "帮我选一个适合放松的海边目的地",
  "一家三口从广州出发，国庆想轻松玩5天",
  "夫妻从广州出发，国庆7天预算10000，想住好一点",
  "帮我整理一份酒店住宿需求",
  "酒店公开原价5000元，帮我做低价预估",
];

const REQUIRED_FIELDS = [
  { key: "origin", label: "出发地", icon: Compass },
  { key: "destination", label: "目的地", icon: MapPin },
  { key: "travelTime", label: "时间", icon: Clock3 },
  { key: "travelers", label: "人数", icon: UsersRound },
  { key: "budget", label: "预算", icon: Wallet },
] as const;

function createSessionId() {
  return `advisor_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function displayValue(profile: TravelProfile, key: typeof REQUIRED_FIELDS[number]["key"]) {
  if (key === "travelers") return profile.travelers ? `${profile.travelers}人` : "待了解";
  if (key === "travelTime") return profile.travelTime ? `${profile.travelTime}${profile.duration ? ` · ${profile.duration}` : ""}` : "待了解";
  return profile[key] || "待了解";
}

export function AIPlannerExperience({
  initialDestination,
  initialPrompt,
}: {
  initialDestination?: string;
  initialPrompt?: string;
} = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [profile, setProfile] = useState<TravelProfile>({ destination: initialDestination, preferences: [] });
  const [input, setInput] = useState(initialPrompt || (initialDestination ? `我想去${initialDestination}，请帮我规划一次轻松的旅行` : ""));
  const [quickReplies, setQuickReplies] = useState(STARTERS);
  const [loading, setLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffDone, setHandoffDone] = useState(false);
  const [handoffSuggested, setHandoffSuggested] = useState(false);
  const [handoffReason, setHandoffReason] = useState("");
  const sessionRef = useRef(createSessionId());
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const storageKey = "lvtu-advisor-session-v1";
    const stored = window.localStorage.getItem(storageKey) || window.localStorage.getItem("travel-tong-advisor-session");
    if (stored && /^[A-Za-z0-9_-]{8,80}$/.test(stored)) sessionRef.current = stored;
    window.localStorage.setItem(storageKey, sessionRef.current);
    window.localStorage.removeItem("travel-tong-advisor-session");
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, loading]);

  const completed = useMemo(
    () => REQUIRED_FIELDS.filter(({ key }) => displayValue(profile, key) !== "待了解").length,
    [profile],
  );

  async function send(value = input) {
    const content = value.trim();
    if (!content || loading) return;
    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setQuickReplies([]);
    try {
      const response = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionRef.current,
          messages: nextMessages.map(({ role, content: text }) => ({ role, content: text })),
          profile,
        }),
      });
      const data = await response.json() as AdvisorResponse & { message?: string };
      if (!response.ok) throw new Error(data.message || "顾问暂时忙不过来");
      setProfile(data.profile);
      setQuickReplies(data.quickReplies || []);
      setHandoffSuggested(data.handoffSuggested);
      setHandoffReason(data.handoffReason || "");
      setMessages((current) => [...current, { role: "assistant", content: data.message, sources: data.sources, estimateCard: data.estimateCard }]);
    } catch (error) {
      setMessages((current) => [...current, {
        role: "assistant",
        content: `${error instanceof Error ? error.message : "网络有点慢"}。你刚才的需求还在，可以稍后再试一次。`,
      }]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function resetConversation() {
    const nextSession = createSessionId();
    sessionRef.current = nextSession;
    window.localStorage.setItem("lvtu-advisor-session-v1", nextSession);
    setMessages([WELCOME]);
    setProfile({ preferences: [] });
    setInput("");
    setQuickReplies(STARTERS);
    setHandoffSuggested(false);
    setHandoffDone(false);
  }

  return (
    <TravelAppShell active="ai" className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_-5%,#dcefff_0,transparent_34%),linear-gradient(180deg,#f9fcff_0%,#f5f9fc_100%)] pb-[calc(172px+env(safe-area-inset-bottom))]">
      <AppTopBar
        title="AI旅行顾问"
        subtitle="先梳理需求，再交顾问确认"
        action={
          <div className="flex items-center gap-1">
            <button type="button" onClick={resetConversation} className="app-icon-button" aria-label="开始新对话"><RotateCcw size={17} /></button>
            <button type="button" onClick={() => setProfileOpen(true)} className="app-icon-button relative" aria-label="查看旅行画像">
              <SlidersHorizontal size={18} />
              {completed ? <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[var(--app-blue)] text-[8px] font-bold text-white">{completed}</span> : null}
            </button>
          </div>
        }
      />

      <div className="border-b border-[#e6eef6]/80 bg-white/52 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><span className="relative flex size-2"><i className="absolute inline-flex size-full animate-ping rounded-full bg-[#28b783] opacity-40" /><i className="relative inline-flex size-2 rounded-full bg-[#19a876]" /></span><p className="text-[11px] font-semibold text-[#35516e]">旅行顾问在线</p><span className="text-[10px] text-[#8b9aab]">已了解 {completed}/5 项关键信息</span></div>
          <button type="button" onClick={() => setProfileOpen(true)} className="text-[10px] font-semibold text-[var(--app-blue)]">查看画像</button>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#e4edf5]"><motion.div className="h-full rounded-full bg-[var(--app-blue)]" animate={{ width: `${completed * 20}%` }} transition={{ type: "spring", damping: 28, stiffness: 240 }} /></div>
      </div>

      <section className="px-5 pb-5 pt-6" aria-live="polite">
        <div className="space-y-6">
          {messages.map((message, index) => (
            <motion.div key={`${message.role}-${index}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .32, ease: [0.22, 1, 0.36, 1] }} className={`flex items-start gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" ? <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[12px] bg-[var(--app-blue)] text-white shadow-[0_7px_18px_rgba(22,119,255,.2)]"><Sparkles size={15} fill="currentColor" /></span> : null}
              <div className={`max-w-[86%] ${message.role === "user" ? "rounded-[20px_20px_6px_20px] bg-[var(--app-blue)] px-4 py-3 text-white shadow-[0_9px_22px_rgba(22,119,255,.16)]" : "pt-0.5 text-[#405972]"}`}>
                <p className="whitespace-pre-line text-[13px] leading-[1.8]">{message.content}</p>
                {message.estimateCard ? <EstimateResultCard estimate={message.estimateCard} /> : null}
                {message.sources?.length ? (
                  <details className="mt-3 text-[10px] text-[#7b8da1]">
                    <summary className="cursor-pointer list-none select-none font-semibold text-[#4a82b8]">参考旅途知识库 · {message.sources.length}条 <ChevronDown className="ml-0.5 inline" size={11} /></summary>
                    <div className="mt-2 space-y-1.5 border-l border-[#cfe2f3] pl-3">{message.sources.slice(0, 3).map((source) => source.href ? <Link key={source.id} href={source.href} className="block font-medium text-[#3577b5] hover:underline">{source.title} →</Link> : <p key={source.id}>{source.title}</p>)}</div>
                  </details>
                ) : null}
              </div>
            </motion.div>
          ))}

          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5 text-[10px] text-[#8292a4]">
              <span className="grid size-8 place-items-center rounded-[12px] bg-[var(--app-blue)] text-white"><Sparkles size={15} /></span>
              <span className="flex items-center gap-1"><i className="ai-thinking-dot" /><i className="ai-thinking-dot [animation-delay:120ms]" /><i className="ai-thinking-dot [animation-delay:240ms]" /><em className="ml-1 not-italic">正在结合你的偏好思考</em></span>
            </motion.div>
          ) : null}
          <div ref={endRef} />
        </div>

        <AnimatePresence>
          {handoffSuggested && !handoffDone ? (
            <motion.button type="button" onClick={() => setHandoffOpen(true)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex w-full items-center gap-3 rounded-[20px] border border-[#c8e2fb] bg-[#edf7ff]/90 p-4 text-left shadow-[0_10px_28px_rgba(30,91,153,.06)]">
              <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-white text-[var(--app-blue)] shadow-sm"><Headphones size={18} /></span>
              <span className="min-w-0 flex-1"><strong className="block text-[12px] font-semibold text-[#163d66]">人工顾问可以继续接力</strong><small className="mt-1 block truncate text-[10px] text-[#69839d]">{handoffReason || "完整需求会一并发送，无需重复描述"}</small></span>
              <span className="text-[10px] font-semibold text-[var(--app-blue)]">立即转接</span>
            </motion.button>
          ) : null}
        </AnimatePresence>
        {handoffDone ? <div className="mt-6 flex items-center gap-2 rounded-[18px] bg-[#eaf8f3] px-4 py-3 text-[11px] font-medium text-[#087a59]"><Check size={15} />人工顾问已收到你的旅行摘要</div> : null}
      </section>

      <div className="fixed bottom-[82px] left-1/2 z-30 w-full max-w-[520px] -translate-x-1/2 border-t border-white/85 bg-white/82 px-4 pb-3 pt-2.5 backdrop-blur-2xl">
        <AnimatePresence mode="popLayout">
          {quickReplies.length ? <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="no-scrollbar mb-2.5 flex gap-2 overflow-x-auto pb-0.5">{quickReplies.map((reply) => <button key={reply} type="button" onClick={() => send(reply)} className="min-h-9 shrink-0 rounded-full border border-[#d7e6f3] bg-white px-3.5 text-[10px] font-semibold text-[#526c86] shadow-[0_4px_15px_rgba(34,86,146,.04)] active:scale-95">{reply}</button>)}</motion.div> : null}
        </AnimatePresence>
        <div className="flex min-h-[54px] items-end gap-2 rounded-[21px] border border-[#d6e5f2] bg-white p-2 pl-4 shadow-[0_12px_32px_rgba(28,78,135,.11)] focus-within:border-[#8fc5f8]">
          <textarea ref={textareaRef} value={input} onChange={(event) => { setInput(event.target.value); event.currentTarget.style.height = "auto"; event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 104)}px`; }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} rows={1} placeholder="说说想去哪里、几个人、什么时间…" className="max-h-[104px] min-h-10 min-w-0 flex-1 resize-none bg-transparent py-2 text-[13px] leading-6 outline-none placeholder:text-[#9aa9ba]" />
          <button type="button" disabled={!input.trim() || loading} onClick={() => send()} className="grid size-10 shrink-0 place-items-center rounded-[15px] bg-[var(--app-blue)] text-white transition active:scale-95 disabled:bg-[#d9e4ed]" aria-label="发送">{loading ? <LoaderCircle className="animate-spin" size={16} /> : <ArrowUp size={17} strokeWidth={2.5} />}</button>
        </div>
        <p className="mt-1.5 text-center text-[9px] text-[#97a5b5]">实时价格、库存与服务规则由人工顾问核实</p>
      </div>

      <AnimatePresence>
        {profileOpen ? (
          <motion.div className="fixed inset-0 z-50 bg-[#071e3e]/34 backdrop-blur-[6px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProfileOpen(false)}>
            <motion.aside className="absolute inset-x-0 bottom-0 mx-auto max-h-[84svh] w-full max-w-[520px] overflow-y-auto rounded-t-[28px] bg-[#f9fcff] px-6 pb-[max(30px,env(safe-area-inset-bottom))] pt-4 shadow-[0_-28px_70px_rgba(8,43,93,.2)]" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 29, stiffness: 320 }} onClick={(event) => event.stopPropagation()}>
              <div className="mx-auto h-1 w-9 rounded-full bg-[#d4e0ea]" />
              <div className="mt-5 flex items-start justify-between"><div><p className="text-[10px] font-bold tracking-[.12em] text-[var(--app-blue)]">实时整理</p><h2 className="mt-1 text-[20px] font-semibold tracking-[-.03em]">你的旅行画像</h2><p className="mt-1 text-[10px] text-[var(--app-muted)]">边聊边补充，不需要填写长表单</p></div><button type="button" onClick={() => setProfileOpen(false)} className="grid size-10 place-items-center rounded-full bg-white text-[#6f8092] shadow-sm"><X size={17} /></button></div>
              <TravelProfilePanel profile={profile} completed={completed} />
              <button type="button" onClick={() => { setProfileOpen(false); setHandoffOpen(true); }} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-[17px] bg-[var(--app-blue)] text-[12px] font-semibold text-white shadow-[0_10px_24px_rgba(22,119,255,.2)]"><Headphones size={16} />转人工旅行顾问</button>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AdvisorHandoffSheet open={handoffOpen} onClose={() => setHandoffOpen(false)} sessionId={sessionRef.current} profile={profile} onSubmitted={() => setHandoffDone(true)} />
    </TravelAppShell>
  );
}

function EstimateResultCard({ estimate }: { estimate: AdvisorEstimateCard }) {
  const money = (value: number | null) => value == null ? "待确认" : `¥${value.toLocaleString("zh-CN")}`;
  return <div className="mt-3 overflow-hidden rounded-[18px] border border-[#cfe3f6] bg-white shadow-[0_8px_24px_rgba(28,78,135,.07)]"><div className="bg-[#0d315d] px-4 py-4 text-white"><div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-[.12em] text-[#9ed0ff]">旅途价格状态</span><span className="rounded-full bg-white/12 px-2.5 py-1 text-[9px] font-semibold">{estimate.priceStatus === "ESTIMATED" ? "预估价" : "待确认"}</span></div><div className="mt-4 grid grid-cols-2 gap-3"><div><p className="text-[9px] text-white/55">公开原价</p><p className="mt-1 text-[16px] font-semibold">{money(estimate.publicReferencePrice)}</p></div><div><p className="text-[9px] text-[#9ed0ff]">旅途预估</p><p className="mt-1 text-[16px] font-semibold">{estimate.estimatedMinPrice == null ? "待确认" : `${money(estimate.estimatedMinPrice)}～${money(estimate.estimatedMaxPrice)}`}</p></div></div></div><div className="px-4 py-3 text-[10px] leading-5 text-[#607890]">{estimate.memberFeeWaived ? "有效会员 · 绑定手机号预订免平台服务费" : estimate.serviceFeeMin == null ? "最终价格和服务费待客服确认" : `普通用户服务费估算 ${money(estimate.serviceFeeMin)}～${money(estimate.serviceFeeMax)}，最终按实际节省的35%计算`}</div></div>;
}

function TravelProfilePanel({ profile, completed }: { profile: TravelProfile; completed: number }) {
  const tags = [profile.travelType, profile.hotelLevel ? `${profile.hotelLevel}酒店` : undefined, ...profile.preferences].filter(Boolean) as string[];
  return <>
    <div className="mt-5 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e0ebf4]"><motion.div className="h-full rounded-full bg-[var(--app-blue)]" animate={{ width: `${completed * 20}%` }} /></div><span className="text-[11px] font-semibold text-[var(--app-blue)]">{completed}/5</span></div>
    <div className="mt-4 divide-y divide-[#e4edf5] rounded-[20px] bg-white px-4 shadow-[0_8px_28px_rgba(34,86,146,.06)]">{REQUIRED_FIELDS.map(({ key, label, icon: Icon }) => { const value = displayValue(profile, key); const known = value !== "待了解"; return <motion.div layout key={key} className="flex min-h-[58px] items-center gap-3"><span className={`grid size-8 place-items-center rounded-[12px] ${known ? "bg-[var(--app-blue-soft)] text-[var(--app-blue)]" : "bg-[#f0f3f6] text-[#a1adba]"}`}><Icon size={15} /></span><div className="min-w-0 flex-1"><p className="text-[9px] text-[#94a1b0]">{label}</p><p className={`mt-0.5 truncate text-[12px] font-semibold ${known ? "text-[#29435e]" : "text-[#a2adba]"}`}>{value}</p></div>{known ? <Check size={14} className="text-[#24a879]" /> : null}</motion.div>; })}</div>
    {tags.length ? <div className="mt-5"><p className="text-[9px] font-bold tracking-[.12em] text-[#8d9aaa]">偏好标签</p><div className="mt-2 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag} className="rounded-full border border-[#d9e7f3] bg-white px-3 py-1.5 text-[10px] font-medium text-[#4e6d8a]">{tag}</span>)}</div></div> : null}
    <div className="mt-5 flex items-start gap-2 rounded-[16px] bg-[#edf7ff] p-3 text-[10px] leading-5 text-[#5f7c98]"><BedDouble size={15} className="mt-0.5 shrink-0 text-[var(--app-blue)]" />酒店建议按行程动线、出行人群和偏好生成，不展示未经核实的实时价格。</div>
  </>;
}
