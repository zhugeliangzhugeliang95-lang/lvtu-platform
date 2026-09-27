import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { AdminShell } from "@/components/hotel-admin/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { TourScheduleManager } from "./TourScheduleManager";

export default async function DeparturesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/tours/${id}/departures`);
  const product = await prisma.tourProduct.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      departures: { orderBy: { departureDate: "asc" } },
      itinerary: { orderBy: { day: "asc" } },
    },
  });
  if (!product) notFound();

  return (
    <AdminShell
      title={product.name}
      subtitle="维护班期、价格、名额与每日行程；上架产品后，内容会自动同步到前台和 AI。"
      headerExtra={
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/tours" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe5ee] bg-white px-3 text-sm text-[#475467]"><ArrowLeft className="h-4 w-4" />产品列表</Link>
          {product.status === "ONLINE" ? <Link href={`/tours/${product.slug}`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1769e0] px-3 text-sm font-semibold text-white"><ExternalLink className="h-4 w-4" />预览前台</Link> : null}
        </div>
      }
    >
      <TourScheduleManager
        product={{ id: product.id, name: product.name, days: product.days, status: product.status }}
        initialDepartures={product.departures.map((item) => ({
          id: item.id,
          departureDate: item.departureDate.toISOString(),
          adultPrice: item.adultPrice,
          childPrice: item.childPrice,
          singleRoomDiff: item.singleRoomDiff,
          capacity: item.capacity,
          booked: item.booked,
          status: item.status,
          cutoffAt: item.cutoffAt?.toISOString() || null,
          note: item.note,
        }))}
        initialItinerary={product.itinerary.map((item) => ({
          id: item.id,
          day: item.day,
          title: item.title,
          city: item.city,
          attractions: item.attractions,
          transport: item.transport,
          meals: item.meals,
          hotel: item.hotel,
          detail: item.detail,
        }))}
      />
    </AdminShell>
  );
}
