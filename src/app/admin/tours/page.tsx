import Link from "next/link";
import { Plus } from "lucide-react";

import { AdminShell } from "@/components/hotel-admin/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { AdminToursClient } from "./AdminToursClient";

export default async function AdminToursPage() {
  await requireAdmin("/admin/tours");
  const rows = await prisma.tourProduct.findMany({
    orderBy: [{ recommended: "desc" }, { updatedAt: "desc" }],
    include: {
      _count: { select: { departures: true, itinerary: true } },
      departures: { orderBy: { departureDate: "asc" }, take: 1 },
    },
  });

  const items = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    destination: row.destination,
    tourType: row.tourType,
    days: row.days,
    status: row.status,
    recommended: row.recommended,
    updatedAt: row.updatedAt.toISOString(),
    departureCount: row._count.departures,
    itineraryCount: row._count.itinerary,
    nextDeparture: row.departures[0]
      ? {
          date: row.departures[0].departureDate.toISOString(),
          price: row.departures[0].adultPrice,
        }
      : null,
  }));

  return (
    <AdminShell
      title="旅行团产品"
      subtitle="产品、班期与每日行程独立管理；上架后自动展示到前台并进入 AI 知识库。"
      headerExtra={
        <Link href="/admin/tours/new" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1769e0] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f5ecf]">
          <Plus className="h-4 w-4" />
          新建旅行团
        </Link>
      }
    >
      <AdminToursClient initialItems={items} />
    </AdminShell>
  );
}
