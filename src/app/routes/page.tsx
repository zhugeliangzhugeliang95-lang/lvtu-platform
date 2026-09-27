import Link from "next/link";
import { ArrowRight, MapPin, Sparkles, UserRound } from "lucide-react";
import { Container } from "@/components/Container";
import { prisma } from "@/lib/prisma";
import { AppBottomNav } from "@/components/AppBottomNav";
import { BrandMark } from "@/components/BrandMark";

function fmtMoney(v: number | null) {
  if (typeof v !== "number") return "-";
  return `¥${v}`;
}

export default async function RoutesPage({ searchParams }: { searchParams: Promise<{ dest?: string; q?: string }> }) {
  const { dest, q } = await searchParams;
  const destValue = typeof dest === "string" ? dest.trim().slice(0, 20) : "";
  const query = typeof q === "string" ? q.trim().slice(0, 60) : "";

  const where = {
    status: "ONLINE" as const,
    ...(destValue ? { destinationCity: { contains: destValue } } : null),
    ...(query ? { OR: [{ title: { contains: query } }, { subtitle: { contains: query } }, { tags: { contains: query } }, { description: { contains: query } }] } : null),
  };

  const items = await prisma.routePackage.findMany({
    where,
    orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
    take: 60,
  });

  return (
    <main className="min-h-screen bg-[#f0f4f8] pb-24 text-[#0f172a]">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/20 bg-white/80 px-4 pt-[max(10px,env(safe-area-inset-top))] shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[56px] max-w-5xl items-center justify-between">
          <BrandMark compact />
          <Link href="/member" className="grid h-9 w-9 place-items-center rounded-full bg-[#0b4fd8]/10 text-[#0b4fd8] active:scale-95" aria-label="我的">
            <UserRound size={16} />
          </Link>
        </div>
      </header>

      <Container>
        <div className="pt-[72px]">
          {/* Hero — Chongqing.jpg 虚化背景 */}
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#7c2d12] to-[#0b4fd8] px-6 py-8 sm:px-8 sm:py-10">
            <div className="absolute inset-0 overflow-hidden">
              <img src="/Chongqing.jpg" alt="" className="h-full w-full object-cover opacity-20" style={{ filter: "blur(24px) scale(1.15)" }} />
              <div className="absolute inset-0 bg-gradient-to-br from-[#7c2d12]/60 to-[#0b4fd8]/60" />
            </div>
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-200/80">Routes</p>
              <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">热门线路套餐</h1>
              <p className="mt-3 text-sm leading-6 text-white/65">
                按目的地筛选，或直接提交需求让顾问帮你定制行程。
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 rounded-2xl border border-white/60 bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
            <form method="get" className="grid gap-3 sm:grid-cols-2">
              <input name="dest" defaultValue={destValue} placeholder="目的地（可选）" className="h-11 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0f172a] outline-none focus:border-[#0b4fd8] placeholder:text-[#94a3b8]" />
              <input name="q" defaultValue={query} placeholder="搜索：标题 / 标签" className="h-11 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-[#0f172a] outline-none focus:border-[#0b4fd8] placeholder:text-[#94a3b8]" />
              <div className="flex flex-wrap gap-3 sm:col-span-2">
                <button type="submit" className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#0b4fd8] px-5 text-sm font-semibold text-white shadow-sm active:scale-[0.98]">
                  <MapPin size={15} className="mr-2" />筛选
                </button>
                <Link href={`/request?type=CUSTOM_TRIP${destValue ? `&notes=${encodeURIComponent(`目的地：${destValue}`)}` : ""}`} className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[#0b4fd8] bg-white px-5 text-sm font-semibold text-[#0b4fd8] shadow-sm active:scale-[0.98]">
                  <Sparkles size={15} className="mr-2" />顾问帮我选
                </Link>
              </div>
            </form>
          </div>

          {/* Route Cards */}
          <div className="mt-5 grid gap-4">
            {items.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04] transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="relative aspect-[16/8] overflow-hidden bg-[#0f172a]">
                  {p.coverImage ? (
                    <img src={p.coverImage} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7c2d12] to-[#0b4fd8] text-white/30">
                      <MapPin size={40} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[17px] font-bold text-[#0f172a]">{p.title}</div>
                      <div className="mt-1 text-[13px] text-[#64748b]">{p.subtitle ?? "更适合学生预算的轻路线模板"}</div>
                      <div className="mt-2 flex items-center gap-2 text-[12px] text-[#94a3b8]">
                        <MapPin size={13} />
                        {p.departureCity ? `${p.departureCity} → ` : ""}{p.destinationCity}
                        {typeof p.days === "number" ? ` · ${p.days}天` : ""}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {typeof p.discountPrice === "number" && typeof p.price === "number" ? (
                        <div className="text-[11px] text-[#94a3b8] line-through">{fmtMoney(p.price)}</div>
                      ) : null}
                      <div className="text-[20px] font-bold text-[#0b4fd8]">{fmtMoney(p.discountPrice ?? p.price)}</div>
                    </div>
                  </div>
                  {p.tags ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.tags.split(/[,\n]/g).map((t) => t.trim()).filter(Boolean).slice(0, 6).map((tag) => (
                        <span key={tag} className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-medium text-orange-600">{tag}</span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-4">
                    <Link
                      href={`/request?type=CUSTOM_TRIP&notes=${encodeURIComponent(`${p.departureCity ? `出发：${p.departureCity}，` : ""}目的地：${p.destinationCity}，想看：${p.title}`)}`}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0b4fd8] px-5 text-[13px] font-semibold text-white shadow-sm active:scale-[0.97]"
                    >
                      顾问帮我选
                      <ArrowRight size={14} className="ml-1.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {!items.length ? (
              <div className="rounded-2xl bg-white p-6 text-center text-sm text-[#94a3b8] shadow-sm ring-1 ring-black/[0.04]">
                暂无路线数据，先提交需求让顾问帮你定制。
                <Link href="/request?type=CUSTOM_TRIP" className="ml-2 text-[#0b4fd8]">去提交需求 →</Link>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
      <AppBottomNav active="inquiry" />
    </main>
  );
}
