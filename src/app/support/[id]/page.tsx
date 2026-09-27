import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock3, Headphones, MessageSquareText, ReceiptText } from "lucide-react";

import { PlatformFrame } from "@/components/platform/Catalog";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/userAuth";

const statusMeta: Record<string, { label: string; note: string; className: string }> = {
  SUBMITTED: { label: "已提交", note: "我们已经收到问题，顾问将尽快查看。", className: "bg-blue-50 text-[#1677ff]" },
  PROCESSING: { label: "处理中", note: "顾问正在核对订单与服务信息。", className: "bg-amber-50 text-amber-700" },
  WAITING_USER: { label: "等待你补充", note: "请联系顾问补充处理所需的信息。", className: "bg-orange-50 text-orange-700" },
  WAITING_SUPPLIER: { label: "等待服务商", note: "已联系相关服务商，正在等待处理结果。", className: "bg-violet-50 text-violet-700" },
  RESOLVED: { label: "已解决", note: "本次售后已处理完成。", className: "bg-emerald-50 text-emerald-700" },
  CLOSED: { label: "已关闭", note: "本次售后服务已经关闭。", className: "bg-slate-100 text-slate-600" },
};

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(value);
}

export default async function SupportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUser(`/support/${id}`);
  const ticket = await prisma.supportTicket.findFirst({ where: { id, userId } });
  if (!ticket) notFound();
  const meta = statusMeta[ticket.status] ?? statusMeta.SUBMITTED;

  return (
    <PlatformFrame title="售后详情" subtitle={ticket.ticketNo} back="/support" active="member">
      <section className="px-5 pt-6">
        <div className="app-card overflow-hidden">
          <div className="bg-[#0d315d] px-5 py-6 text-white">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] text-white/60">当前处理状态</p><h2 className="mt-2 text-[23px] font-semibold">{meta.label}</h2><p className="mt-2 text-[11px] leading-5 text-white/68">{meta.note}</p></div><div className="grid size-12 place-items-center rounded-[16px] bg-white/10"><Clock3 size={22}/></div></div>
          </div>
          <div className="p-5">
            <span className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-semibold ${meta.className}`}>{meta.label}</span>
            <div className="mt-5 space-y-4 border-l-2 border-[#dbe9f7] pl-5">
              <div className="relative"><span className="absolute -left-[27px] top-0 grid size-3 rounded-full border-[3px] border-white bg-[var(--app-blue)]"/><p className="text-[12px] font-semibold">售后已提交</p><p className="mt-1 text-[10px] text-[var(--app-muted)]">{formatTime(ticket.createdAt)}</p></div>
              {ticket.status !== "SUBMITTED" ? <div className="relative"><span className="absolute -left-[27px] top-0 grid size-3 rounded-full border-[3px] border-white bg-[var(--app-blue)]"/><p className="text-[12px] font-semibold">服务进度已更新</p><p className="mt-1 text-[10px] text-[var(--app-muted)]">{formatTime(ticket.updatedAt)}</p></div> : null}
            </div>
          </div>
        </div>
      </section>

      {ticket.reply ? <section className="px-5 pt-4"><div className="rounded-[20px] border border-[#cfe5fa] bg-[#eef7ff] p-5"><div className="flex items-center gap-2 text-[12px] font-semibold text-[#0d579e]"><MessageSquareText size={16}/>顾问回复</div><p className="mt-3 whitespace-pre-wrap text-[12px] leading-6 text-[#315a7f]">{ticket.reply}</p></div></section> : null}

      <section className="px-5 pt-6">
        <h2 className="text-[16px] font-semibold">问题信息</h2>
        <div className="app-card mt-3 divide-y divide-[#edf3f8] px-4">
          <div className="flex gap-4 py-4"><span className="w-20 shrink-0 text-[11px] text-[var(--app-muted)]">问题类型</span><span className="text-[12px] font-medium">{ticket.category}</span></div>
          <div className="flex gap-4 py-4"><span className="w-20 shrink-0 text-[11px] text-[var(--app-muted)]">售后编号</span><span className="text-[12px] font-medium">{ticket.ticketNo}</span></div>
          {ticket.orderNo ? <div className="flex gap-4 py-4"><span className="w-20 shrink-0 text-[11px] text-[var(--app-muted)]">关联订单</span><span className="text-[12px] font-medium">{ticket.orderNo}</span></div> : null}
          <div className="py-4"><span className="text-[11px] text-[var(--app-muted)]">问题说明</span><p className="mt-2 whitespace-pre-wrap text-[12px] leading-6">{ticket.description}</p></div>
          {ticket.attachment ? <div className="py-4"><span className="text-[11px] text-[var(--app-muted)]">附件 / 凭证</span><p className="mt-2 break-all text-[12px] leading-5 text-[var(--app-blue)]">{ticket.attachment}</p></div> : null}
        </div>
      </section>

      <section className="px-5 pt-5">
        <Link href="/contact" className="flex min-h-14 items-center gap-3 rounded-[18px] bg-[var(--app-blue)] px-4 text-white"><Headphones size={20}/><div className="min-w-0 flex-1"><p className="text-[12px] font-semibold">联系旅行顾问</p><p className="mt-0.5 text-[10px] text-white/70">补充信息或咨询处理进度</p></div><ArrowRight size={16}/></Link>
        <Link href="/support/new" className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-[16px] border border-[#dce8f4] bg-white text-[12px] font-semibold"><ReceiptText size={16}/>提交另一个问题</Link>
        {ticket.status === "RESOLVED" ? <p className="mt-4 flex items-center justify-center gap-1 text-[10px] text-emerald-700"><CheckCircle2 size={13}/>此问题已处理完成</p> : null}
      </section>
    </PlatformFrame>
  );
}
