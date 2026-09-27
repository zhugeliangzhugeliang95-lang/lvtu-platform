import Link from "next/link";
import { BedDouble, Heart, MapPin, Plane, Route, TrainFront } from "lucide-react";

import { PlatformFrame } from "@/components/platform/Catalog";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/userAuth";

const typeMeta = {
  HOTEL: { label: "酒店", icon: BedDouble, href: "/hotels" },
  FLIGHT: { label: "机票", icon: Plane, href: "/flights" },
  TRAIN: { label: "火车", icon: TrainFront, href: "/trains" },
  ROUTE: { label: "旅行路线", icon: Route, href: "/tours" },
} as const;

export default async function MemberFavoritesPage() {
  const userId = await requireUser("/favorites");
  const favorites = await prisma.favorite.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 80 });
  const hotelIds = favorites.filter((item) => item.productType === "HOTEL").map((item) => item.productId);
  const routeIds = favorites.filter((item) => item.productType === "ROUTE").map((item) => item.productId);
  const [hotels, routes] = await Promise.all([
    hotelIds.length ? prisma.hotel.findMany({ where: { id: { in: hotelIds } }, select: { id: true, name: true, city: true, district: true, coverImage: true, priceStart: true } }) : [],
    routeIds.length ? prisma.routePackage.findMany({ where: { id: { in: routeIds } }, select: { id: true, title: true, destinationCity: true, coverImage: true, price: true } }) : [],
  ]);
  const hotelMap = new Map(hotels.map((item) => [item.id, item]));
  const routeMap = new Map(routes.map((item) => [item.id, item]));

  return <PlatformFrame title="我的收藏" subtitle="保存想去的酒店与路线" back="/member" active="member"><section className="px-5 py-6">{favorites.length ? <div className="space-y-3">{favorites.map((favorite) => {
    const meta = typeMeta[favorite.productType]; const Icon = meta.icon;
    const hotel = favorite.productType === "HOTEL" ? hotelMap.get(favorite.productId) : null;
    const route = favorite.productType === "ROUTE" ? routeMap.get(favorite.productId) : null;
    const title = hotel?.name || route?.title || meta.label;
    const location = hotel ? [hotel.city, hotel.district].filter(Boolean).join(" · ") : route?.destinationCity || "已保存到收藏";
    const image = hotel?.coverImage || route?.coverImage;
    const price = hotel?.priceStart || route?.price;
    const href = hotel ? `/hotels/${hotel.id}` : meta.href;
    return <Link key={favorite.id} href={href} className="app-card app-press flex gap-3 overflow-hidden p-3">{image ? <img src={image} alt={title} className="size-[92px] shrink-0 rounded-[16px] object-cover"/> : <span className="grid size-[92px] shrink-0 place-items-center rounded-[16px] bg-[var(--app-blue-soft)] text-[var(--app-blue)]"><Icon size={27}/></span>}<div className="min-w-0 flex-1 py-1"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold text-[var(--app-blue)]">{meta.label}</span><Heart size={15} fill="currentColor" className="text-[#ed6680]"/></div><h2 className="mt-2 truncate text-[14px] font-semibold">{title}</h2><p className="mt-1 flex items-center gap-1 text-[10px] text-[var(--app-muted)]"><MapPin size={11}/>{location}</p>{price ? <p className="mt-3 text-[14px] font-semibold text-[var(--app-blue-deep)]">¥{price.toLocaleString()}<span className="ml-1 text-[9px] font-normal text-[var(--app-muted)]">参考价起</span></p> : null}</div></Link>;
  })}</div> : <div className="app-card px-6 py-12 text-center"><span className="mx-auto grid size-14 place-items-center rounded-full bg-[#fff0f3] text-[#e35772]"><Heart size={24}/></span><h2 className="mt-4 text-[17px] font-semibold">还没有收藏</h2><p className="mt-2 text-[11px] leading-5 text-[var(--app-muted)]">去探索下一段旅行，喜欢的酒店和路线可以先保存下来。</p><Link href="/explore" className="mt-5 inline-flex min-h-11 items-center rounded-[15px] bg-[var(--app-blue)] px-5 text-[12px] font-semibold text-white">去发现</Link></div>}</section></PlatformFrame>;
}
