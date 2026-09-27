"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, Headphones, Send, Sparkles, UserRound } from "lucide-react";
import { HumanHandoffSheet } from "@/components/HumanHandoffSheet";

type ChatMessage = { role: "assistant" | "user"; text: string };
const prompts = ["帮我安排四天三晚旅行", "帮我找一家更划算的酒店", "推荐一个适合学生的旅行团", "我需要酒店、门票和包车"];

function buildReply(input: string) {
  const destination = ["三亚", "重庆", "云南", "香港", "成都", "杭州"].find((city) => input.includes(city)) || "目的地待确定";
  const group = input.includes("旅行团") || input.includes("跟团");
  const plan = input.includes("安排") || input.includes("规划");
  return { text: group ? `好的，我会先按“${destination}、旅行团、出发日期和预算”来筛选。团期、库存和价格需旅行顾问最终确认。` : plan ? `可以。我先把“${destination}”的天数、预算和节奏理清，再把酒店、交通和门票组成一张需求卡。` : `收到。我先记下“${destination}”和你的需求，可以继续补充日期、人数和预算。`, destination };
}

export function AITravelAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", text: "你好，我是旅途 AI 助手。你可以直接说目的地、预算或想订的服务，我只会追问当前最必要的信息。" }]);
  const [input, setInput] = useState("");
  const [handoffOpen, setHandoffOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const send = (value = input) => { const trimmed = value.trim(); if (!trimmed) return; setInput(""); setMessages((current) => [...current, { role: "user", text: trimmed }, { role: "assistant", text: buildReply(trimmed).text }]); };
  const latestUser = [...messages].reverse().find((item) => item.role === "user");
  const destination = latestUser ? buildReply(latestUser.text).destination : "";
  return <>
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <div className="animate-rise-in flex items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.12em] text-[#1769e0]">TRAVEL TONG AI</p><h1 className="mt-2 text-[28px] font-bold tracking-[-0.035em]">你说需求，我帮你整理</h1><p className="mt-2 text-sm leading-6 text-[#667085]">从模糊想法到可提交的询价单，一步一步来。</p></div><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#dcebff] text-[#1769e0]"><Sparkles size={22} /></span></div>
      <div className="mt-6 flex flex-wrap gap-2">{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => send(prompt)} className="min-h-10 rounded-xl border border-[#dce4ef] bg-white px-3 text-xs font-medium text-[#475467] transition hover:border-[#1769e0] hover:text-[#1769e0] active:scale-95">{prompt}</button>)}</div>
      <div className="mt-6 space-y-4" aria-live="polite">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${message.role === "user" ? "order-2 bg-[#172033] text-white" : "bg-[#dcebff] text-[#1769e0]"}`}>{message.role === "user" ? <UserRound size={15} /> : <Bot size={15} />}</span><div className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "rounded-br-md bg-[#1769e0] text-white" : "rounded-bl-md border border-[#e3e9f1] bg-white text-[#475467]"}`}>{message.text}</div></div>)}<div ref={endRef} /></div>
      {latestUser ? <div className="mt-5 rounded-[18px] border border-[#bad4f8] bg-[#eff6ff] p-4"><div className="flex items-center gap-2 text-xs font-bold text-[#104da6]"><CheckCircle2 size={15} />已提取一张需求确认卡</div><div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[#667085]"><div><span className="block text-[10px] text-[#8d98a8]">目的地</span><strong className="mt-1 block text-sm text-[#172033]">{destination}</strong></div><div><span className="block text-[10px] text-[#8d98a8]">当前状态</span><strong className="mt-1 block text-sm text-[#172033]">待补充日期与预算</strong></div></div><div className="mt-4 flex flex-wrap gap-2"><Link href={`/inquiry?service=combo&subject=${encodeURIComponent(latestUser.text)}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#1769e0] px-4 text-xs font-bold text-white">补充需求并询价<ArrowRight size={14} /></Link><button type="button" onClick={() => setHandoffOpen(true)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#bad4f8] bg-white px-4 text-xs font-bold text-[#104da6]"><Headphones size={14} />转人工</button></div></div> : null}
      <div className="fixed inset-x-0 bottom-[calc(78px+env(safe-area-inset-bottom))] z-30 px-4 sm:static sm:mt-6 sm:px-0"><div className="mx-auto flex max-w-2xl items-center gap-2 rounded-2xl border border-[#d8e1ed] bg-white p-2 shadow-[0_10px_30px_rgba(7,26,51,0.12)] sm:shadow-sm"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") send(); }} placeholder="例如：广州出发，国庆去三亚，2个人" className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" aria-label="输入旅行需求" /><button type="button" onClick={() => send()} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#1769e0] text-white transition hover:bg-[#104da6] active:scale-95" aria-label="发送"><Send size={17} /></button></div></div>
      <p className="mt-24 text-center text-[11px] text-[#8d98a8] sm:mt-4">提交需求后由 AI 整理信息、人工顾问核实价格与库存，不会自动编造实时结果。</p>
    </div>
    <HumanHandoffSheet open={handoffOpen} onClose={() => setHandoffOpen(false)} />
  </>;
}
