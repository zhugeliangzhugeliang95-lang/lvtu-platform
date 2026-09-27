import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, ClipboardList, Headphones, MapPin, ReceiptText } from "lucide-react";

import { AppTopBar, TravelAppShell } from "@/components/app/TravelAppShell";
import { appImages } from "@/data/appPrototype";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/userAuth";

const statusLabels: Record<string, string> = {
  UPCOMING: "待出行",
  IN_PROGRESS: "旅行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(date);
}

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUser(`/trips/${id}`);
  const trip = await prisma.trip.findFirst({
    where: { id, userId },
    include: {
      order: {
        include: {
          requirement: { select: { content: true, contactName: true, contactPhone: true } },
          payments: { where: { status: "APPROVED" }, select: { id: true }, take: 1 },
        },
      },
    },
  });
  if (!trip) notFound();

  const details = trip.order?.requirement?.content.split("\n").filter(Boolean) ?? [];

  return (
    <TravelAppShell active="trips">
      <AppTopBar title="行程详情" subtitle={trip.order?.orderNo ?? undefined} backHref="/trips" />

      <section className="relative h-[280px] overflow-hidden">
        <img src={appImages.coast} alt={trip.destination} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08274f] via-[#08274f]/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold text-[#0d315d]"><CheckCircle2 size={13} className="text-emerald-600" />{statusLabels[trip.status] ?? trip.status}</span>
          <h1 className="mt-3 text-[28px] font-semibold leading-tight">{trip.title}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-white/76"><MapPin size={14} />{trip.destination}</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 px-5 pt-5">
        <div className="app-card p-4">
          <CalendarDays size={18} className="text-[#1677ff]" />
          <p className="mt-3 text-[9px] text-[var(--app-muted)]">出发日期</p>
          <p className="mt-1 text-[12px] font-semibold">{formatDate(trip.startDate)}</p>
        </div>
        <div className="app-card p-4">
          <CalendarDays size={18} className="text-[#1677ff]" />
          <p className="mt-3 text-[9px] text-[var(--app-muted)]">结束日期</p>
          <p className="mt-1 text-[12px] font-semibold">{formatDate(trip.endDate)}</p>
        </div>
      </section>

      <section className="px-5 pt-7">
        <h2 className="text-[19px] font-semibold">本次旅行需求</h2>
        <div className="app-card mt-3 divide-y divide-[#e8eff6] px-4">
          {details.length ? details.map((detail, index) => (
            <div key={`${detail}-${index}`} className="flex min-h-[58px] items-center gap-3 py-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-[12px] bg-[#eef6ff] text-[#1677ff]"><ClipboardList size={15} /></span>
              <p className="text-[12px] leading-5 text-[#53677e]">{detail}</p>
            </div>
          )) : <p className="py-5 text-[12px] text-[var(--app-muted)]">顾问正在补充详细行程安排。</p>}
        </div>
      </section>

      {trip.order ? (
        <section className="px-5 pt-7">
          <h2 className="text-[19px] font-semibold">服务进度</h2>
          <div className="app-card mt-3 p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-emerald-50 text-emerald-600"><CheckCircle2 size={18} /></span>
              <div className="min-w-0 flex-1"><p className="text-[12px] font-semibold">订单与付款已确认</p><p className="mt-1 text-[10px] leading-5 text-[var(--app-muted)]">旅行顾问将继续确认具体资源，并通过客服渠道同步安排。</p></div>
            </div>
            <Link href={`/member/orders/${trip.order.id}`} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[15px] bg-[#eef6ff] text-[11px] font-semibold text-[#1677ff]"><ReceiptText size={15} />查看关联订单</Link>
          </div>
        </section>
      ) : null}

      <section className="px-5 pb-5 pt-6">
        <Link href="/contact" className="flex min-h-[68px] items-center gap-3 rounded-[20px] bg-[#0d315d] px-4 text-white">
          <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-white/10"><Headphones size={18} /></span>
          <div className="min-w-0 flex-1"><p className="text-[12px] font-semibold">联系旅行顾问</p><p className="mt-1 text-[10px] text-white/58">确认接送、住宿或其他行程细节</p></div>
        </Link>
      </section>
    </TravelAppShell>
  );
}
