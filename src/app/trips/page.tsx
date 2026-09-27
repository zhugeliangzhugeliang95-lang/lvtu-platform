import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Headphones,
  Luggage,
  MapPin,
  Plus,
  Route,
} from "lucide-react";

import { AppTopBar, TravelAppShell } from "@/components/app/TravelAppShell";
import { appImages } from "@/data/appPrototype";
import { prisma } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/userAuth";

const tabs = [
  { key: "all", label: "全部" },
  { key: "upcoming", label: "待出行" },
  { key: "active", label: "旅行中" },
  { key: "completed", label: "已完成" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

function effectiveStatus(trip: { status: string; startDate: Date; endDate: Date }, now: Date): TabKey {
  if (trip.status === "CANCELLED") return "completed";
  if (trip.status === "COMPLETED" || trip.endDate < now) return "completed";
  if (trip.status === "IN_PROGRESS" || (trip.startDate <= now && trip.endDate >= now)) return "active";
  return "upcoming";
}

function statusMeta(status: TabKey, cancelled: boolean) {
  if (cancelled) return { label: "已取消", className: "bg-slate-100 text-slate-500", icon: Clock3 };
  if (status === "active") return { label: "旅行中", className: "bg-emerald-50 text-emerald-700", icon: Route };
  if (status === "completed") return { label: "已完成", className: "bg-slate-100 text-slate-600", icon: CheckCircle2 };
  return { label: "待出行", className: "bg-blue-50 text-blue-700", icon: CalendarDays };
}

function tripImage(destination: string) {
  if (/三亚|海南|海口|海岛/.test(destination)) return appImages.sanya;
  if (/京都|大阪/.test(destination)) return appImages.kyoto;
  if (/东京|日本/.test(destination)) return appImages.tokyo;
  if (/新加坡/.test(destination)) return appImages.singapore;
  if (/冰岛|极光/.test(destination)) return appImages.aurora;
  return appImages.coast;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(date);
}

export default async function TripsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const userId = await getUserIdFromCookie();
  const { status } = await searchParams;
  const activeTab: TabKey = tabs.some((tab) => tab.key === status) ? (status as TabKey) : "all";
  const trips = userId
    ? await prisma.trip.findMany({
        where: { userId },
        include: { order: { select: { orderNo: true, productName: true } } },
        orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
      })
    : [];
  const now = new Date();
  const visibleTrips = trips.filter((trip) => activeTab === "all" || effectiveStatus(trip, now) === activeTab);

  return (
    <TravelAppShell active="trips">
      <AppTopBar
        title="行程"
        subtitle="订单确认后的旅行安排会出现在这里"
        action={
          <Link href="/request" className="app-icon-button" aria-label="提交新需求">
            <Plus size={19} />
          </Link>
        }
      />

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1 pt-5">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/trips" : `/trips?status=${tab.key}`}
            className={`inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-[12px] font-semibold ${
              activeTab === tab.key ? "bg-[#0d315d] text-white" : "border border-[#dce8f4] bg-white text-[#607286]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {!userId ? (
        <section className="px-5 pt-8">
          <div className="overflow-hidden rounded-[24px] bg-[#0d315d] text-white shadow-[0_18px_38px_rgba(7,45,91,.2)]">
            <div className="relative h-52">
              <img src={appImages.coast} alt="海岸旅行目的地" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d315d] via-[#0d315d]/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[11px] font-semibold text-white/65">MY TRAVEL PLAN</p>
                <h2 className="mt-2 text-[24px] font-semibold">登录查看你的全部行程</h2>
              </div>
            </div>
            <div className="p-5 pt-3">
              <p className="text-[12px] leading-6 text-white/66">报价确认并完成付款审核后，出发日期、服务订单和顾问安排会同步到这里。</p>
              <Link href="/login?next=/trips" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-[16px] bg-white text-[12px] font-semibold text-[#0d315d]">
                登录 / 注册
              </Link>
            </div>
          </div>
        </section>
      ) : visibleTrips.length ? (
        <section className="space-y-4 px-5 pt-7">
          {visibleTrips.map((trip) => {
            const computedStatus = effectiveStatus(trip, now);
            const meta = statusMeta(computedStatus, trip.status === "CANCELLED");
            const StatusIcon = meta.icon;
            return (
              <Link key={trip.id} href={`/trips/${trip.id}`} className="app-card app-press block overflow-hidden">
                <div className="relative h-44 overflow-hidden">
                  <img src={tripImage(trip.destination)} alt={trip.destination} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/5" />
                  <span className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold shadow-sm ${meta.className}`}>
                    <StatusIcon size={13} /> {meta.label}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <h2 className="text-[21px] font-semibold">{trip.title}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-white/76"><MapPin size={13} />{trip.destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-[#eef6ff] text-[#1677ff]"><CalendarDays size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold">{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
                    <p className="mt-1 truncate text-[10px] text-[var(--app-muted)]">{trip.order?.orderNo ? `关联订单 ${trip.order.orderNo}` : "旅行顾问服务中"}</p>
                  </div>
                  <ChevronRight size={17} className="text-[#9aa9ba]" />
                </div>
              </Link>
            );
          })}
        </section>
      ) : (
        <section className="px-5 pt-8">
          <div className="app-card px-6 py-10 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-[20px] bg-[#eef6ff] text-[#1677ff]"><Luggage size={24} /></span>
            <h2 className="mt-4 text-[18px] font-semibold">{trips.length ? "这个分类暂无行程" : "还没有已确认行程"}</h2>
            <p className="mx-auto mt-2 max-w-[300px] text-[11px] leading-6 text-[var(--app-muted)]">{trips.length ? "可切换上方分类查看其他行程。" : "提交旅行需求并确认报价后，付款审核通过的订单会自动生成行程。"}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Link href="/request" className="inline-flex min-h-11 items-center justify-center rounded-[15px] bg-[#1677ff] px-3 text-[11px] font-semibold text-white">提交旅行需求</Link>
              <Link href="/contact" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[15px] border border-[#dce8f4] bg-white px-3 text-[11px] font-semibold text-[#53677e]"><Headphones size={15} /> 联系顾问</Link>
            </div>
          </div>
        </section>
      )}
    </TravelAppShell>
  );
}
