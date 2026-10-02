"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Clock3, FileSearch, Headphones, Home } from "lucide-react";
import { AppBottomNav } from "@/components/AppBottomNav";
import { SupplierQuoteProgress } from "@/components/SupplierQuoteProgress";

export default function SuccessPage() {
  const { id } = useParams<{ id: string }>();
  return <main className="min-h-screen bg-[#f5f7fb] px-4 pb-[calc(94px+env(safe-area-inset-bottom))] pt-[max(34px,env(safe-area-inset-top))] text-[#172033]">
    <div className="mx-auto max-w-lg">
      <div className="animate-rise-in rounded-[22px] border border-[#bad4f8] bg-white p-6 shadow-[0_16px_45px_rgba(7,26,51,0.07)]">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e7f7f0] text-[#168f67]"><Check size={26} strokeWidth={2.5} /></div>
        <p className="mt-5 text-xs font-bold tracking-[0.12em] text-[#168f67]">REQUIREMENT RECEIVED</p>
        <h1 className="mt-2 text-[26px] font-bold tracking-[-0.03em]">需求已提交，正在向供应商询价</h1>
        <p className="mt-3 text-sm leading-6 text-[#667085]">旅途会先整理你的重点需求，再由供应商机器人收集报价，客服核实后把最终确认价发给你。</p>
        <div className="mt-5 rounded-xl bg-[#f5f7fb] px-4 py-3"><p className="text-[10px] font-semibold text-[#8d98a8]">询价编号</p><p className="mt-1 break-all font-mono text-xs font-bold text-[#475467]">{id}</p></div>
      </div>
      <SupplierQuoteProgress inquiryId={id} />
      <section className="mt-4 rounded-[18px] border border-[#e3e9f1] bg-white p-5"><h2 className="text-sm font-bold">接下来会发生什么？</h2><div className="mt-5 space-y-4">{[{ icon: FileSearch, title: "AI整理需求", desc: "提取目的地、日期、人数和服务组合" }, { icon: Headphones, title: "人工核价", desc: "需要确认的价格和库存由顾问继续处理" }, { icon: Clock3, title: "等待你确认", desc: "报价会标明时间、取消规则和是否需二次确认" }].map(({ icon: Icon, title, desc }, index) => <div key={title} className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eff6ff] text-[#1769e0]"><Icon size={17} /></span><div><p className="text-sm font-bold">{index + 1}. {title}</p><p className="mt-1 text-xs leading-5 text-[#667085]">{desc}</p></div></div>)}</div></section>
      <div className="mt-4 grid grid-cols-2 gap-3"><Link href="/member" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1769e0] text-sm font-bold text-white">查看进度 <ArrowRight size={16} /></Link><Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d8e1ed] bg-white text-sm font-semibold text-[#475467]"><Home size={16} />返回首页</Link></div>
      <p className="mt-5 text-center text-[11px] leading-5 text-[#8d98a8]">价格与库存以最终确认为准，未确认前不会自动付款或出票。</p>
    </div>
    <AppBottomNav active="low-price" />
  </main>;
}
