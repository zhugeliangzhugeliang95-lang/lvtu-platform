import type { TourDepartureStatus } from "@prisma/client";

import { tours as fallbackTours, type Tour } from "@/data/mock/platform";
import { prisma } from "@/lib/prisma";

type TourRecord = Awaited<ReturnType<typeof loadTourRecord>>;
const demoCatalogEnabled = process.env.ENABLE_DEMO_CATALOG === "true";

function isDemoRecord(record: NonNullable<TourRecord>) {
  return /开发测试|测试数据|演示数据/i.test(`${record.name} ${record.summary || ""}`);
}

function parseTags(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {}
  return value.split(/[，,、]/).map((item) => item.trim()).filter(Boolean);
}

function departureLabel(status: TourDepartureStatus) {
  return {
    OPEN: "可报名",
    ALMOST_FULL: "名额紧张",
    SOLD_OUT: "售罄",
    CLOSED: "已截止",
    PENDING_CONFIRMATION: "待确认",
  }[status];
}

async function loadTourRecord(slug: string) {
  return prisma.tourProduct.findFirst({
    where: { slug, status: "ONLINE" },
    include: {
      departures: { orderBy: { departureDate: "asc" } },
      itinerary: { orderBy: { day: "asc" } },
    },
  });
}

export function mapTourRecord(record: NonNullable<TourRecord>): Tour {
  const departures = record.departures.map((item) => ({
    date: item.departureDate.toISOString().slice(0, 10),
    price: item.adultPrice,
    status: departureLabel(item.status),
  }));
  const lowestPrice = departures.length ? Math.min(...departures.map((item) => item.price)) : 0;
  return {
    slug: record.slug,
    name: record.name,
    destination: record.destination,
    departure: record.departureCity || "目的地集合",
    days: record.days,
    type: record.tourType,
    tags: parseTags(record.tags),
    audience: record.audience || "适合希望由顾问协助安排行程的旅行者",
    image: record.coverImage || "/travel-home/hero-coast.jpg",
    price: lowestPrice,
    priceState: departures.length ? "REFERENCE" : "PENDING_CONFIRMATION",
    summary: record.summary || "班期、价格与服务内容由合作旅行社及旅途顾问共同确认。",
    departures,
    itinerary: record.itinerary.map((item) => ({
      day: `Day ${item.day}`,
      title: item.title,
      city: item.city || record.destination,
      detail: [item.detail, item.attractions ? `景点：${item.attractions}` : "", item.transport ? `交通：${item.transport}` : "", item.meals ? `餐食：${item.meals}` : "", item.hotel ? `住宿：${item.hotel}` : ""].filter(Boolean).join("\n"),
    })),
  };
}

export async function getPublicTours() {
  try {
    const records = await prisma.tourProduct.findMany({
      where: { status: "ONLINE" },
      orderBy: [{ recommended: "desc" }, { updatedAt: "desc" }],
      include: {
        departures: { orderBy: { departureDate: "asc" } },
        itinerary: { orderBy: { day: "asc" } },
      },
    });
    const publicRecords = records.filter((record) => !isDemoRecord(record));
    return publicRecords.length ? publicRecords.map(mapTourRecord) : demoCatalogEnabled ? fallbackTours : [];
  } catch (error) {
    console.error("[tour catalog] failed to load database products", error);
    return demoCatalogEnabled ? fallbackTours : [];
  }
}

export async function getPublicTour(slug: string) {
  try {
    const record = await loadTourRecord(slug);
    if (record && !isDemoRecord(record)) return mapTourRecord(record);
  } catch (error) {
    console.error("[tour catalog] failed to load product", error);
  }
  return demoCatalogEnabled ? fallbackTours.find((item) => item.slug === slug) || null : null;
}

export { parseTags };
