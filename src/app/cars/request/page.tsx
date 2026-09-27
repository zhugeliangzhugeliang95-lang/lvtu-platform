import Link from "next/link";
import { Car, ChevronRight, MapPinned } from "lucide-react";
import { InquiryFlowNotice } from "@/components/InquiryFlowNotice";
import { PlatformFrame } from "@/components/platform/Catalog";

export default function CarRequestPage() {
  return (
    <PlatformFrame title="接送 / 包车询价" subtitle="提交路线与时间，等待车辆报价" back="/">
      <section className="px-5 py-6">
        <div className="rounded-[22px] bg-[#0d315d] p-5 text-white"><Car size={24} /><h1 className="mt-3 text-[23px] font-semibold">先说明用车需求</h1><p className="mt-2 text-[11px] leading-5 text-white/70">填写路线、时间、人数和行李信息，旅行顾问会人工确认可用车型、实际价格和服务范围。</p></div>
        <div className="mt-5"><InquiryFlowNotice compact /></div>
        <div className="mt-5 space-y-3">
          <Link href="/inquiry?service=transfer&subject=接送机服务" className="app-card app-press flex min-h-[92px] items-center gap-4 p-4"><span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-[var(--app-blue-soft)] text-[var(--app-blue)]"><MapPinned size={21} /></span><span className="min-w-0 flex-1"><strong className="block text-[15px]">接送机 / 接送站</strong><span className="mt-1 block text-[11px] leading-5 text-[var(--app-muted)]">填写起终点、到达时间、人数与行李</span></span><ChevronRight size={17} className="text-[#9aa9ba]" /></Link>
          <Link href="/inquiry?service=charter&subject=包车服务" className="app-card app-press flex min-h-[92px] items-center gap-4 p-4"><span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-[var(--app-blue-soft)] text-[var(--app-blue)]"><Car size={21} /></span><span className="min-w-0 flex-1"><strong className="block text-[15px]">按天包车 / 多段用车</strong><span className="mt-1 block text-[11px] leading-5 text-[var(--app-muted)]">填写行程范围、时长、人数与车型偏好</span></span><ChevronRight size={17} className="text-[#9aa9ba]" /></Link>
        </div>
      </section>
    </PlatformFrame>
  );
}
