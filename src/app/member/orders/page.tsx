import Link from "next/link";
import { CalendarDays, ChevronRight, Headphones, ReceiptText, WalletCards } from "lucide-react";

import { AppTopBar, TravelAppShell } from "@/components/app/TravelAppShell";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/userAuth";

const ORDER_STATUS: Record<string, { label: string; tone: string }> = {
  PENDING_CONFIRM: { label: "待确认", tone: "bg-amber-50 text-amber-700" },
  PENDING_PAYMENT: { label: "待付款", tone: "bg-orange-50 text-orange-700" },
  PAID: { label: "已付款", tone: "bg-blue-50 text-blue-700" },
  PROCESSING: { label: "服务处理中", tone: "bg-blue-50 text-blue-700" },
  COMPLETED: { label: "已完成", tone: "bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "已取消", tone: "bg-slate-100 text-slate-500" },
  AFTERSALE: { label: "售后处理中", tone: "bg-violet-50 text-violet-700" },
  REFUNDED: { label: "已退款", tone: "bg-slate-100 text-slate-500" },
};

const tabs = [
  { key: "all", label: "全部" },
  { key: "pay", label: "待付款" },
  { key: "service", label: "服务中" },
  { key: "done", label: "已完成" },
] as const;

export default async function MemberOrdersPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const userId = await requireUser("/orders");
  const status = (await searchParams)?.status || "all";
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const visible = orders.filter((order) => {
    if (status === "pay") return order.orderStatus === "PENDING_PAYMENT";
    if (status === "service") return ["PENDING_CONFIRM", "PAID", "PROCESSING", "AFTERSALE"].includes(order.orderStatus);
    if (status === "done") return ["COMPLETED", "CANCELLED", "REFUNDED"].includes(order.orderStatus);
    return true;
  });

  return (
    <TravelAppShell active="member">
      <AppTopBar title="我的订单" subtitle="查看付款、确认与服务进度" backHref="/member" />

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1 pt-5">
        {tabs.map((tab) => <Link key={tab.key} href={tab.key === "all" ? "/orders" : `/orders?status=${tab.key}`} className={`inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-[12px] font-semibold ${status === tab.key ? "bg-[#0d315d] text-white" : "border border-[#dce8f4] bg-white text-[#607286]"}`}>{tab.label}</Link>)}
      </div>

      <section className="space-y-3 px-5 pt-6">
        {visible.map((order) => {
          const meta = ORDER_STATUS[order.orderStatus] || { label: order.orderStatus, tone: "bg-slate-100 text-slate-600" };
          return (
            <Link key={order.id} href={`/orders/${order.id}`} className="app-card app-press block p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-[#eef6ff] text-[#1677ff]"><ReceiptText size={19} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2"><h2 className="truncate text-[14px] font-semibold">{order.productName || "旅游服务订单"}</h2><span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-semibold ${meta.tone}`}>{meta.label}</span></div>
                  <p className="mt-1 text-[10px] text-[var(--app-muted)]">订单号 {order.orderNo}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#edf2f7] pt-4">
                <div className="flex items-center gap-2"><CalendarDays size={15} className="text-[#7b8da2]" /><div><p className="text-[9px] text-[var(--app-muted)]">下单时间</p><p className="mt-0.5 text-[11px] font-medium">{new Date(order.createdAt).toLocaleDateString("zh-CN")}</p></div></div>
                <div className="flex items-center gap-2"><WalletCards size={15} className="text-[#7b8da2]" /><div><p className="text-[9px] text-[var(--app-muted)]">订单金额</p><p className="mt-0.5 text-[12px] font-semibold text-[#0d315d]">{typeof order.amount === "number" ? `¥${order.amount.toLocaleString()}` : "待确认"}</p></div></div>
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-[#1677ff]"><span>查看订单详情</span><ChevronRight size={15} /></div>
            </Link>
          );
        })}

        {!visible.length ? <div className="app-card px-6 py-10 text-center"><span className="mx-auto grid size-14 place-items-center rounded-[20px] bg-[#eef6ff] text-[#1677ff]"><ReceiptText size={24} /></span><h2 className="mt-4 text-[17px] font-semibold">{orders.length ? "这个分类暂无订单" : "还没有订单"}</h2><p className="mt-2 text-[11px] leading-5 text-[var(--app-muted)]">{orders.length ? "切换其他状态查看订单。" : "提交需求并确认顾问报价后，订单会出现在这里。"}</p><Link href="/request" className="mt-5 inline-flex min-h-11 items-center rounded-[15px] bg-[#1677ff] px-5 text-[12px] font-semibold text-white">提交旅行需求</Link></div> : null}
      </section>

      <section className="px-5 pb-5 pt-6"><Link href="/contact" className="flex min-h-[68px] items-center gap-3 rounded-[20px] bg-[#eef7ff] px-4"><span className="grid size-10 place-items-center rounded-[14px] bg-white text-[#1677ff]"><Headphones size={18} /></span><div className="min-w-0 flex-1"><p className="text-[12px] font-semibold">订单问题</p><p className="mt-1 text-[10px] text-[var(--app-muted)]">联系旅行顾问或申请售后</p></div><ChevronRight size={16} className="text-[#1677ff]" /></Link></section>
    </TravelAppShell>
  );
}
