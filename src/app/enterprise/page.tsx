import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, FileText, Headphones, ReceiptText, ShieldCheck, UsersRound } from "lucide-react";
import { PlatformFrame } from "@/components/platform/Catalog";

const capabilities = [
  { title: "统一提交", desc: "集中收集员工、日期、路线、预算与发票要求，减少来回补充信息。", icon: UsersRound },
  { title: "人工确认", desc: "复杂交通、酒店和多人行程由顾问核实价格、库存与退改规则。", icon: Headphones },
  { title: "过程留痕", desc: "需求、报价、确认与订单状态统一记录，便于后续核对。", icon: FileText },
  { title: "结算资料", desc: "按最终订单与实际履约情况整理对账和开票所需资料。", icon: ReceiptText },
];

export default function EnterprisePage() {
  return (
    <PlatformFrame title="企业差旅" subtitle="多人出行与商务需求" back="/" active="discover">
      <section className="px-5 py-6">
        <div className="relative overflow-hidden rounded-[26px] bg-[#0d315d] p-6 text-white shadow-[0_20px_50px_rgba(13,49,93,.18)]">
          <div className="absolute -right-12 -top-12 size-40 rounded-full bg-[#1683ff]/25 blur-2xl" />
          <div className="relative">
            <span className="grid size-13 place-items-center rounded-[17px] bg-white/12"><Building2 size={25} /></span>
            <p className="mt-5 text-[10px] font-semibold tracking-[.16em] text-[#9ed0ff]">LVTU FOR BUSINESS</p>
            <h1 className="mt-2 text-[25px] font-semibold leading-tight">把差旅需求说清楚，<br />再稳妥完成每一步。</h1>
            <p className="mt-3 max-w-xl text-[12px] leading-6 text-white/72">适合团队出行、会议差旅、奖励旅游和多城市行程。旅途先整理需求，再由顾问人工确认实际可订方案。</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["企业酒店", "多人交通", "会议用车", "团队行程"].map((item) => <span key={item} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] text-white/85">{item}</span>)}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {capabilities.map(({ title, desc, icon: Icon }) => (
            <div key={title} className="app-card p-5">
              <span className="grid size-11 place-items-center rounded-[15px] bg-[var(--app-blue-soft)] text-[var(--app-blue)]"><Icon size={20} /></span>
              <h2 className="mt-4 text-[15px] font-semibold">{title}</h2>
              <p className="mt-2 text-[11px] leading-5 text-[var(--app-muted)]">{desc}</p>
            </div>
          ))}
        </div>

        <div className="app-card mt-6 p-5">
          <div className="flex items-center gap-2 text-[14px] font-semibold"><ShieldCheck size={18} className="text-[var(--app-blue)]" />服务流程</div>
          <div className="mt-4 space-y-4">
            {["提交企业名称、联系人与出行需求", "顾问核实价格、库存、服务范围与规则", "企业确认方案后进入付款和履约", "订单完成后按约整理对账与售后资料"].map((item, index) => (
              <div key={item} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--app-blue)] text-[10px] font-semibold text-white">{index + 1}</span>
                <p className="pt-1 text-[12px] leading-5 text-[#53677e]">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[17px] bg-[#f4f8fc] p-4 text-[10px] leading-5 text-[var(--app-muted)]"><CheckCircle2 size={14} className="mr-1 inline text-emerald-500" />具体账期、发票、审批和结算方式需结合企业资质与合作协议人工确认，页面不作默认承诺。</div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link href="/contact?topic=企业差旅咨询" className="inline-flex min-h-12 items-center justify-center rounded-[17px] border border-[#d6e5f5] bg-white text-[12px] font-semibold text-[#0d315d]">联系顾问</Link>
          <Link href="/inquiry?service=combo&subject=企业差旅需求" className="inline-flex min-h-12 items-center justify-center gap-1 rounded-[17px] bg-[var(--app-blue)] text-[12px] font-semibold text-white">提交需求 <ArrowRight size={14} /></Link>
        </div>
      </section>
    </PlatformFrame>
  );
}
