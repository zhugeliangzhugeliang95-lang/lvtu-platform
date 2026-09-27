import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-[#edf4fb] px-5 text-[#0d315d]"><section className="w-full max-w-[460px] rounded-[28px] border border-white/80 bg-white/92 p-7 text-center shadow-[0_24px_70px_rgba(13,49,93,.12)]"><span className="mx-auto grid size-14 place-items-center rounded-[18px] bg-[#eef6ff] text-[#1769e0]"><Compass size={26}/></span><p className="mt-5 text-[11px] font-semibold tracking-[.16em] text-[#1769e0]">404 · LOST ROUTE</p><h1 className="mt-2 text-[25px] font-semibold">这段旅程暂时找不到</h1><p className="mt-3 text-[12px] leading-6 text-[#667085]">页面可能已经更新、下架，或者地址输入有误。你可以返回首页重新探索。</p><div className="mt-6 grid grid-cols-2 gap-3"><Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[15px] bg-[#1769e0] px-4 text-[12px] font-semibold text-white"><Home size={15}/>返回首页</Link><Link href="/explore" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[15px] border border-[#d7e3ef] bg-white px-4 text-[12px] font-semibold"><Search size={15}/>继续探索</Link></div></section></main>;
}
