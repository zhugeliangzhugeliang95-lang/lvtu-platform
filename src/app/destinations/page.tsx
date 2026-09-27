import Link from "next/link";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { AppBottomNav } from "@/components/AppBottomNav";
import { BrandMark } from "@/components/BrandMark";
import { Container } from "@/components/Container";
import { destinations } from "@/lib/siteData";

export default function DestinationsPage() {
  return (
    <main className="min-h-screen bg-[#f0f4f8] pb-28 text-[#0f172a]">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/20 bg-white/80 px-4 pt-[max(10px,env(safe-area-inset-top))] shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[56px] max-w-5xl items-center justify-between">
          <BrandMark compact />
          <Link href="/inquiry?mode=undecided" className="rounded-full bg-[#0b4fd8] px-4 py-1.5 text-xs font-bold text-white shadow-sm active:scale-95">
            帮我推荐
          </Link>
        </div>
      </header>

      <Container>
        <div className="pt-[72px]">
          {/* Hero — 虚化图片背景 */}
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0c1e3a] to-[#1a3a6e] px-6 py-8 sm:px-8 sm:py-10">
            <div className="absolute inset-0 overflow-hidden">
              <img src="/swimmingpool2.jpg" alt="" className="h-full w-full object-cover opacity-20" style={{ filter: "blur(24px) scale(1.15)" }} />
              <div className="absolute inset-0 bg-gradient-to-br from-[#0c1e3a]/60 to-[#1a3a6e]/60" />
            </div>
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/80">Destinations</p>
              <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">热门目的地</h1>
              <p className="mt-3 text-sm leading-6 text-white/70">
                城市模板保留为“灵感页”：用户可以先看适合几天、预算大概多少，再回到查价流程。
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((d) => (
              <Link
                key={d.slug}
                href={`/destinations/${d.slug}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04] transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={d.imageUrl} alt={d.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/80">
                      <MapPin size={13} />{d.season}
                    </div>
                    <div className="mt-1 text-xl font-bold">{d.name}</div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[14px] font-bold text-[#0f172a]">{d.days}</div>
                      <div className="mt-0.5 text-[12px] text-[#94a3b8]">{d.budget}</div>
                    </div>
                    <ArrowRight size={18} className="shrink-0 text-[#cbd5e1] transition group-hover:text-[#0b4fd8]" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {d.highlights.slice(0, 3).map((x) => (
                      <span key={x} className="inline-flex items-center rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-[11px] font-medium text-[#0b4fd8]">
                        {x}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#0c1e3a] to-[#1a3a6e] p-5 text-center">
            <p className="text-sm font-bold text-white">不知道选哪个城市？</p>
            <p className="mt-1 text-[13px] text-white/60">告诉我们你的预算和时间，顾问帮你推荐</p>
            <Link href="/inquiry?mode=undecided" className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#0b4fd8] px-6 text-[14px] font-bold text-white shadow-[0_8px_20px_-6px_rgba(232,99,46,0.5)] active:scale-[0.97]">
              <Sparkles size={15} className="mr-2" />立即问顾问
            </Link>
          </div>
        </div>
      </Container>
      <AppBottomNav active="services" />
    </main>
  );
}
