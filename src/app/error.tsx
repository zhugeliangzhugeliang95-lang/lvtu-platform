"use client";

import Link from "next/link";
import { AlertCircle, Headphones, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => { console.error("Lvtu route error", error); }, [error]);
  return <main className="grid min-h-screen place-items-center bg-[#edf4fb] px-5 text-[#0d315d]"><section className="w-full max-w-[460px] rounded-[28px] border border-white/80 bg-white/92 p-7 text-center shadow-[0_24px_70px_rgba(13,49,93,.12)] backdrop-blur-xl"><span className="mx-auto grid size-14 place-items-center rounded-[18px] bg-[#eef6ff] text-[#1769e0]"><AlertCircle size={25}/></span><p className="mt-5 text-[11px] font-semibold tracking-[.16em] text-[#1769e0]">LVTU SERVICE</p><h1 className="mt-2 text-[24px] font-semibold">页面暂时没有加载成功</h1><p className="mt-3 text-[12px] leading-6 text-[#667085]">你的需求和订单不会因此丢失。可以重新加载页面，或联系旅行顾问协助处理。</p>{error.digest?<p className="mt-3 text-[10px] text-[#98a2b3]">问题编号：{error.digest}</p>:null}<div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={() => unstable_retry()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[15px] bg-[#1769e0] px-4 text-[12px] font-semibold text-white"><RefreshCw size={15}/>重新加载</button><Link href="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[15px] border border-[#d7e3ef] bg-white px-4 text-[12px] font-semibold"><Headphones size={15}/>联系客服</Link></div><Link href="/" className="mt-5 inline-block text-[11px] font-semibold text-[#1769e0]">返回旅途首页</Link></section></main>;
}
