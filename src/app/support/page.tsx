import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  CarFront,
  CircleHelp,
  Clock3,
  Headphones,
  Hotel,
  MessageSquareText,
  ReceiptText,
  ShieldCheck,
  TicketCheck,
  UsersRound,
} from "lucide-react";

import { PlatformFrame } from "@/components/platform/Catalog";
import { prisma } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/userAuth";

const issueTypes = [
  { label: "订单异常", note: "状态、金额或信息有误", icon: ReceiptText },
  { label: "入住问题", note: "酒店入住与房间协助", icon: Hotel },
  { label: "日期修改", note: "调整出发或入住日期", icon: Clock3 },
  { label: "取消 / 退款", note: "申请取消与退款评估", icon: ShieldCheck },
  { label: "旅行团问题", note: "班期、集合与服务问题", icon: UsersRound },
  { label: "车辆问题", note: "接送机与包车服务", icon: CarFront },
];

const statusMeta: Record<string, { label: string; className: string }> = {
  SUBMITTED: { label: "已提交", className: "bg-blue-50 text-[#1677ff]" },
  PROCESSING: { label: "处理中", className: "bg-amber-50 text-amber-700" },
  WAITING_USER: { label: "等待你补充", className: "bg-orange-50 text-orange-700" },
  WAITING_SUPPLIER: { label: "等待服务商", className: "bg-violet-50 text-violet-700" },
  RESOLVED: { label: "已解决", className: "bg-emerald-50 text-emerald-700" },
  CLOSED: { label: "已关闭", className: "bg-slate-100 text-slate-600" },
};

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(value);
}

export default async function SupportPage() {
  const userId = await getUserIdFromCookie();
  const tickets = userId
    ? await prisma.supportTicket.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 })
    : [];

  return (
    <PlatformFrame title="售后与帮助" subtitle="订单问题全程可追踪" back="/member" active="member">
      <section className="mx-5 mt-5 overflow-hidden rounded-[26px] bg-[#0d315d] px-5 py-6 text-white shadow-[0_18px_38px_rgba(7,45,91,.2)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[.18em] text-[#9ed0ff]">TRAVELGO CARE</p>
            <h2 className="mt-2 text-[24px] font-semibold">有问题，我们持续跟进</h2>
            <p className="mt-2 max-w-[310px] text-[11px] leading-5 text-white/70">提交问题后会生成专属售后编号，处理进度、顾问回复和结果都可以在这里查看。</p>
          </div>
          <div className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-white/10"><Headphones size={23} /></div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link href="/support/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-white text-[12px] font-semibold text-[#0d315d]">
            <MessageSquareText size={15} />提交售后
          </Link>
          <Link href="/contact" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] border border-white/20 bg-white/10 text-[12px] font-semibold text-white">
            联系顾问<ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <section className="px-5 pt-7">
        <div className="flex items-end justify-between">
          <div><p className="text-[10px] font-semibold tracking-[.14em] text-[var(--app-blue)]">QUICK HELP</p><h2 className="mt-1 text-[18px] font-semibold">选择问题类型</h2></div>
          <Link href="/support/new?type=%E5%85%B6%E4%BB%96" className="text-[11px] font-semibold text-[var(--app-blue)]">其他问题</Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {issueTypes.map(({ label, note, icon: Icon }) => (
            <Link key={label} href={`/support/new?type=${encodeURIComponent(label)}`} className="app-card app-press p-4">
              <div className="grid size-10 place-items-center rounded-[13px] bg-[var(--app-blue-soft)] text-[var(--app-blue)]"><Icon size={18} /></div>
              <h3 className="mt-3 text-[13px] font-semibold">{label}</h3>
              <p className="mt-1 text-[10px] leading-4 text-[var(--app-muted)]">{note}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 pt-8">
        <div className="flex items-center justify-between"><h2 className="text-[18px] font-semibold">我的售后</h2>{userId ? <span className="text-[10px] text-[var(--app-muted)]">共 {tickets.length} 条记录</span> : null}</div>
        {!userId ? (
          <div className="app-card mt-4 px-5 py-7 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--app-blue-soft)] text-[var(--app-blue)]"><TicketCheck size={22} /></div>
            <h3 className="mt-3 text-[15px] font-semibold">登录后查看售后进度</h3>
            <p className="mt-2 text-[11px] leading-5 text-[var(--app-muted)]">你的提交记录、处理状态和顾问回复会统一保存在账户中。</p>
            <Link href={`/login?next=${encodeURIComponent("/support")}&reason=${encodeURIComponent("查看售后进度")}`} className="mt-5 inline-flex min-h-11 items-center rounded-[14px] bg-[var(--app-blue)] px-5 text-[12px] font-semibold text-white">登录查看</Link>
          </div>
        ) : tickets.length ? (
          <div className="mt-4 space-y-3">
            {tickets.map((ticket) => {
              const meta = statusMeta[ticket.status] ?? statusMeta.SUBMITTED;
              return (
                <Link key={ticket.id} href={`/support/${ticket.id}`} className="app-card app-press block p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="text-[14px] font-semibold">{ticket.category}</p><p className="mt-1 truncate text-[10px] text-[var(--app-muted)]">{ticket.description}</p></div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${meta.className}`}>{meta.label}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#edf3f8] pt-3 text-[10px] text-[var(--app-muted)]">
                    <span>{ticket.ticketNo}{ticket.orderNo ? ` · ${ticket.orderNo}` : ""}</span>
                    <span>{formatTime(ticket.createdAt)} <ArrowRight size={12} className="ml-1 inline" /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="app-card mt-4 px-5 py-8 text-center"><CircleHelp size={24} className="mx-auto text-[var(--app-blue)]"/><h3 className="mt-3 text-[14px] font-semibold">暂无售后记录</h3><p className="mt-2 text-[11px] text-[var(--app-muted)]">遇到订单、入住或出行问题，可随时提交。</p></div>
        )}
      </section>

      <section className="mx-5 mt-6 rounded-[20px] border border-[#dce8f4] bg-white px-4 py-4">
        <div className="flex items-center gap-3"><BedDouble size={18} className="text-[var(--app-blue)]"/><div className="min-w-0 flex-1"><p className="text-[12px] font-semibold">紧急出行问题</p><p className="mt-1 text-[10px] text-[var(--app-muted)]">临近入住、出发或已在行程中，建议直接联系顾问。</p></div><Link href="/contact" className="text-[11px] font-semibold text-[var(--app-blue)]">立即联系</Link></div>
      </section>
    </PlatformFrame>
  );
}
