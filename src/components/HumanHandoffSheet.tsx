"use client";

import Link from "next/link";
import { FileText, Headphones, X } from "lucide-react";

export function HumanHandoffSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#071a33]/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
    <div className="w-full max-w-md rounded-t-[24px] bg-white p-5 pb-[max(24px,env(safe-area-inset-bottom))] sm:rounded-[24px]" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between"><div><p className="text-xs font-bold text-[#1769e0]">需要更快解决？</p><h2 className="mt-1 text-xl font-bold">转给人工顾问</h2></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl bg-[#f5f7fb] text-[#667085]" aria-label="关闭"><X size={18} /></button></div>
      <p className="mt-3 text-sm leading-6 text-[#667085]">复杂行程、临时改签或需要解释退改规则时，顾问会看到你的需求上下文并继续处理。</p>
      <div className="mt-5 space-y-2">
        <Link href="/contact?topic=AI旅行顾问转人工" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1769e0] text-sm font-bold text-white"><Headphones size={17} />查看客服联系方式</Link>
        <Link href="/inquiry?service=combo&subject=AI规划后转人工确认" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#d8e1ed] text-sm font-semibold text-[#475467]"><FileText size={17} />提交完整旅行需求</Link>
      </div>
    </div>
  </div>;
}
