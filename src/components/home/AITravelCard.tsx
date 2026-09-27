import Link from "next/link";
import { ArrowRight, Bot, Sparkles } from "lucide-react";

export function AITravelCard() {
  return (
    <section className="home-section px-4" aria-labelledby="ai-travel-title">
      <div className="relative min-h-[188px] overflow-hidden rounded-[24px] border border-[#e4e9fb] bg-[var(--pearl-white)] p-5 shadow-[var(--shadow-soft)]">
        <div aria-hidden className="ai-ambient absolute -right-7 -top-10 size-40 rounded-full bg-[radial-gradient(circle,rgba(84,120,255,.20)_0%,rgba(124,109,242,.10)_42%,transparent_72%)]" />
        <div className="relative z-10 max-w-[66%]">
          <div className="flex items-center gap-2">
            <h2 id="ai-travel-title" className="text-[22px] font-semibold text-[var(--ink-navy)]">AI旅行管家</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#edf0ff] px-2 py-1 text-[10px] font-semibold text-[#6867d9]"><Sparkles size={11} />AI</span>
          </div>
          <p className="mt-2 text-[13px] leading-5 text-[var(--slate)]">告诉我目的地、日期、预算和人数</p>
          <p className="mt-1 text-[12px] leading-5 text-[#8791a1]">酒店 + 玩乐 + 交通，一起规划</p>
          <Link href="/ai" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[16px] bg-[var(--voyage-blue)] px-4 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(47,107,255,.18)] transition hover:bg-[#255fe9] active:scale-[0.975]">
            开始规划 <ArrowRight size={15} />
          </Link>
        </div>
        <div className="ai-breathing absolute right-5 top-1/2 grid size-[88px] -translate-y-1/2 place-items-center rounded-full border border-white bg-white/70 text-[#6674dd] shadow-[0_14px_34px_rgba(87,105,200,.15)] backdrop-blur-xl">
          <span aria-hidden className="absolute -left-1 top-4 size-2 rounded-full bg-[#58b5c9]/70" />
          <span aria-hidden className="absolute -right-1 bottom-5 size-2.5 rounded-full bg-[#7c6df2]/55" />
          <Bot size={38} strokeWidth={1.55} />
        </div>
      </div>
    </section>
  );
}
