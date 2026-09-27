import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, CircleDot, Headphones, MapPin, ReceiptText, ShieldCheck, WalletCards } from "lucide-react";

import { PlatformFrame } from "@/components/platform/Catalog";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/userAuth";
import { PaymentPanel } from "./PaymentPanel";

const ORDER_STATUS: Record<string, string> = { PENDING_CONFIRM: "待确认", PENDING_PAYMENT: "待付款", PAID: "已付款", PROCESSING: "服务处理中", FULFILLING:"人工预订中", BOOKED:"预订已确认", COMPLETED: "已完成", CANCELLED: "已取消", AFTERSALE: "售后处理中", REFUNDED: "已退款" };
const PAYMENT_STATUS: Record<string, string> = { UNPAID: "未付款", PAID: "已付款", REFUNDED: "已退款" };

export default async function MemberOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUser(`/orders/${id}`);
  const [order, paymentQr] = await Promise.all([prisma.order.findFirst({
    where: { id, userId },
    include: {
      lead: { select: { fromCity: true, toCity: true, departDate: true } },
      requirement: { select: { content: true } },
      feedbacks: { select: { id: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      trips: { select: { id: true, destination: true, startDate: true }, take: 1 },
    },
  }), prisma.siteSetting.findFirst({ where: { key: { in: ["payment.qrUrl", "hotel.qrUrl"] } }, orderBy: { key: "asc" } })]);
  if (!order) notFound();

  const latestPayment = order.payments[0];
  const steps = [
    { label: "订单已创建", done: true },
    { label: "等待付款", done: order.paymentStatus === "PAID" || order.orderStatus !== "PENDING_PAYMENT" },
    { label: "资源确认与服务中", done: ["PROCESSING","FULFILLING","BOOKED", "COMPLETED"].includes(order.orderStatus) },
    { label: "预订已确认", done: ["BOOKED","COMPLETED"].includes(order.orderStatus) },
  ];

  return (
    <PlatformFrame title="订单详情" subtitle={order.orderNo} back="/orders" active="member">
      <section className="px-5 pt-5">
        <div className="relative overflow-hidden rounded-[24px] bg-[#0d315d] p-5 text-white shadow-[0_16px_34px_rgba(7,45,91,.18)]">
          <div className="absolute -right-12 -top-14 size-44 rounded-full border-[26px] border-white/5" />
          <div className="relative"><p className="text-[10px] font-semibold tracking-[.16em] text-[#9ed0ff]">TRAVEL SERVICE ORDER</p><h1 className="mt-3 text-[23px] font-semibold">{order.productName || "旅游服务订单"}</h1><p className="mt-2 text-[11px] text-white/60">创建于 {new Date(order.createdAt).toLocaleString("zh-CN", { hour12: false })}</p><div className="mt-5 flex items-end justify-between gap-3"><div><p className="text-[10px] text-white/55">订单金额</p><p className="mt-1 text-[26px] font-semibold">{typeof order.amount === "number" ? `¥${order.amount.toLocaleString()}` : "待确认"}</p></div><span className="rounded-full bg-white/12 px-3 py-1.5 text-[10px] font-semibold backdrop-blur">{ORDER_STATUS[order.orderStatus] || order.orderStatus}</span></div></div>
        </div>
      </section>

      <section className="px-5 pt-7">
        <h2 className="text-[18px] font-semibold">服务进度</h2>
        <div className="app-card mt-3 px-4 py-2">
          {steps.map((step, index) => <div key={step.label} className="grid grid-cols-[28px_1fr] gap-2"><div className="relative flex justify-center">{index < steps.length - 1 ? <span className={`absolute bottom-0 top-7 w-px ${step.done ? "bg-[#83baff]" : "bg-[#e1e9f2]"}`} /> : null}<span className={`relative mt-4 grid size-5 place-items-center rounded-full ${step.done ? "bg-[#1677ff] text-white" : "bg-[#edf2f7] text-[#a3afbc]"}`}>{step.done ? <CheckCircle2 size={13} /> : <CircleDot size={12} />}</span></div><div className={`border-b border-[#edf2f7] py-4 text-[12px] font-medium last:border-0 ${step.done ? "text-[#16304d]" : "text-[#9aa7b5]"}`}>{step.label}</div></div>)}
        </div>
      </section>

      {order.orderStatus === "PENDING_PAYMENT" ? <section className="px-5 pt-5"><PaymentPanel orderId={order.id} qrUrl={paymentQr?.value || ""} /></section> : null}
      {latestPayment?.status === "SUBMITTED" ? <section className="px-5 pt-5"><div className="flex gap-3 rounded-[18px] bg-amber-50 p-4 text-amber-800"><WalletCards size={18} className="shrink-0" /><div><p className="text-[12px] font-semibold">付款凭证审核中</p><p className="mt-1 text-[10px] leading-5">顾问核对后会更新付款状态，请勿重复提交。</p></div></div></section> : null}

      <section className="px-5 pt-7">
        <h2 className="text-[18px] font-semibold">订单信息</h2>
        <div className="app-card mt-3 divide-y divide-[#edf2f7] px-4">
          {[
            ["订单号", order.orderNo],
            ["订单状态", ORDER_STATUS[order.orderStatus] || order.orderStatus],
            ["支付状态", PAYMENT_STATUS[order.paymentStatus] || order.paymentStatus],
            ["服务日期", order.travelDate ? new Date(order.travelDate).toLocaleDateString("zh-CN") : "顾问确认中"],
            ["确认号", order.confirmationNo || "预订完成后显示"],
            ["履约服务方", order.supplierName || "顾问确认中"],
          ].map(([label, value]) => <div key={label} className="flex min-h-[54px] items-center justify-between gap-4 text-[11px]"><span className="text-[var(--app-muted)]">{label}</span><span className="text-right font-medium text-[#243b55]">{value}</span></div>)}
        </div>
      </section>

      <section className="px-5 pt-7">
        <h2 className="text-[18px] font-semibold">关联需求</h2>
        <div className="app-card mt-3 p-4">
          {order.requirement ? <p className="whitespace-pre-line text-[12px] leading-6 text-[#53677e]">{order.requirement.content}</p> : order.lead ? <p className="flex items-center gap-2 text-[12px] text-[#53677e]"><MapPin size={15} className="text-[#1677ff]" />{order.lead.fromCity} → {order.lead.toCity} · {new Date(order.lead.departDate).toLocaleDateString("zh-CN")}</p> : <p className="text-[12px] text-[var(--app-muted)]">暂无需求说明</p>}
          <Link href="/member/quotes" className="mt-4 inline-flex min-h-10 items-center gap-2 text-[11px] font-semibold text-[#1677ff]"><ReceiptText size={15} />查看报价记录</Link>
        </div>
      </section>

      {order.trips[0] ? <section className="px-5 pt-5"><Link href={`/trips/${order.trips[0].id}`} className="app-card app-press flex min-h-[72px] items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-[14px] bg-[#eef6ff] text-[#1677ff]"><CalendarDays size={18} /></span><div className="min-w-0 flex-1"><p className="text-[12px] font-semibold">查看已生成行程</p><p className="mt-1 text-[10px] text-[var(--app-muted)]">{order.trips[0].destination} · {new Date(order.trips[0].startDate).toLocaleDateString("zh-CN")}</p></div></Link></section> : null}

      <section className="px-5 pb-5 pt-6">
        <div className="flex gap-2"><Link href="/contact" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[16px] border border-[#dce8f4] bg-white text-[11px] font-semibold text-[#53677e]"><Headphones size={15} />联系顾问</Link><Link href={`/support/new?orderId=${encodeURIComponent(order.orderNo)}`} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[16px] bg-[#0d315d] text-[11px] font-semibold text-white"><ShieldCheck size={15} />申请售后</Link></div>
      </section>
    </PlatformFrame>
  );
}
