import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

import { Container } from "@/components/Container";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/userAuth";

type SavedPriceResult = {
  platform?: string;
  roomType?: string;
  totalPrice?: number;
  source?: string;
};

function formatDate(date: Date | null) {
  if (!date) return "未填日期";
  return new Date(date).toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

function parsePriceResults(value: string | null): SavedPriceResult[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => item as SavedPriceResult)
      .filter((item) => Number.isFinite(Number(item.totalPrice)))
      .sort((a, b) => Number(a.totalPrice ?? 0) - Number(b.totalPrice ?? 0))
      .slice(0, 5);
  } catch {
    return [];
  }
}

function recordTypeLabel(roomType: string | null) {
  if (roomType?.startsWith("项目：")) return roomType.replace("项目：", "项目 · ");
  if (roomType?.startsWith("交通：")) return roomType.replace("交通：", "交通 · ");
  return roomType || "参考价";
}

export default async function MemberSearchesPage() {
  const userId = await requireUser("/member/searches");
  const records = await prisma.priceSearchRecord.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <Container>
      <main className="pb-24 pt-6">
        <header className="flex items-center gap-3">
          <Link href="/member" className="grid size-10 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/[0.04]">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-950">我的查价记录</h1>
            <p className="text-xs text-gray-500">查看预估并提交需求后，记录会保存到这里</p>
          </div>
        </header>

        <section className="mt-5 grid gap-3">
          {records.map((record) => {
            const prices = parsePriceResults(record.resultsJson);
            return (
              <div key={record.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-gray-950">{record.hotelName}</div>
                    <div className="mt-1 text-xs leading-5 text-gray-500">
                      {recordTypeLabel(record.roomType)} · {formatDate(record.checkInDate)} - {formatDate(record.checkOutDate)}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      {record.guestCount}人{record.roomType?.startsWith("项目：") || record.roomType?.startsWith("交通：") ? "" : ` · ${record.roomCount}间`} · {new Date(record.createdAt).toLocaleString("zh-CN", { hour12: false })}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-gray-400">最低参考</div>
                    <div className="text-base font-semibold text-orange-600">
                      {record.minTotalPrice ? `¥${record.minTotalPrice}` : "-"}
                    </div>
                  </div>
                </div>
                {prices.length ? (
                  <div className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-xl bg-[#f8fafc]">
                    {prices.map((price, index) => (
                      <div key={`${price.platform}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-blue-600">{price.platform || "平台参考"}</div>
                          <div className="mt-0.5 truncate text-xs text-gray-500">{price.roomType || price.source || "参考价格"}</div>
                        </div>
                        <div className="shrink-0 text-sm font-semibold text-gray-950">
                          ¥{Math.round(Number(price.totalPrice ?? 0))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}

          {!records.length ? (
            <div className="rounded-[28px] bg-white p-6 text-center shadow-sm ring-1 ring-black/[0.04]">
              <Search className="mx-auto text-blue-600" size={28} />
              <div className="mt-3 font-semibold text-gray-950">还没有查价记录</div>
              <p className="mt-2 text-sm text-gray-500">去查一次酒店或项目价格，记录会自动出现在这里。</p>
              <Link
                href="/inquiry"
                className="mt-4 inline-flex rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white"
              >
                去提交问价
              </Link>
            </div>
          ) : null}
        </section>
      </main>
    </Container>
  );
}
