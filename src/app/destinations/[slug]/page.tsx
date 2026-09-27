import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Hotel, MapPin, Train } from "lucide-react";

import { AppBottomNav } from "@/components/AppBottomNav";
import { BrandMark } from "@/components/BrandMark";
import { Container } from "@/components/Container";
import { destinations, type DestinationSlug } from "@/lib/siteData";

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: DestinationSlug }>;
}) {
  const { slug } = await params;
  const dest = destinations.find((x) => x.slug === slug);
  if (!dest) notFound();

  return (
    <main className="min-h-screen bg-[#f4f7fb] pb-28 text-[#172033]">
      <Container>
        <div className="py-6">
          <header className="flex items-center justify-between">
            <BrandMark compact />
            <Link href="/destinations" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2f7df6]">
              <ArrowLeft size={16} />
              城市
            </Link>
          </header>

          <section className="mt-8 overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/[0.04]">
            <div className="relative h-64">
              <Image src={dest.imageUrl} alt={dest.name} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <div className="flex items-center gap-1.5 text-sm font-medium text-white/85">
                  <MapPin size={16} />
                  {dest.season}
                </div>
                <h1 className="mt-2 text-4xl font-semibold">{dest.name}</h1>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              <div className="rounded-2xl bg-[#f8fafc] p-3">
                <CalendarDays size={17} className="text-[#2f7df6]" />
                <div className="mt-2 text-sm font-semibold text-[#0f172a]">{dest.days}</div>
                <div className="mt-1 text-xs text-[#64748b]">建议天数</div>
              </div>
              <div className="rounded-2xl bg-[#f8fafc] p-3">
                <Hotel size={17} className="text-[#ff6a00]" />
                <div className="mt-2 text-sm font-semibold text-[#0f172a]">{dest.budget}</div>
                <div className="mt-1 text-xs text-[#64748b]">参考预算</div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
                <Train size={18} className="text-[#2f7df6]" />
                交通建议
              </div>
              <div className="mt-4 grid gap-3">
                {dest.transport.map((x) => (
                  <div key={x} className="rounded-xl bg-[#f8fafc] px-4 py-3 text-sm leading-6 text-[#64748b]">
                    {x}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
                <Hotel size={18} className="text-[#ff6a00]" />
                酒店方向
              </div>
              <div className="mt-4 grid gap-3">
                {dest.hotelTips.map((x) => (
                  <div key={x} className="rounded-xl bg-[#f8fafc] px-4 py-3 text-sm leading-6 text-[#64748b]">
                    {x}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04] lg:col-span-2">
              <div className="text-sm font-semibold text-[#0f172a]">玩法亮点</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {dest.highlights.map((x) => (
                  <span key={x} className="rounded-full bg-[#eef5ff] px-3 py-1.5 text-xs font-medium text-[#2f7df6]">
                    {x}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-[#64748b]">
                如果想要更省体力、更出片、更偏美食或更适合多人同行，可以把偏好写进需求里，我们按偏好继续给方案。
              </p>
            </div>
          </section>

          <section className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href={`/inquiry?service=combo&subject=${encodeURIComponent(`${dest.name}旅行服务`)}`} className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#bad4f8] bg-white px-5 text-sm font-semibold text-[#1769e0] sm:col-span-2">
              咨询{dest.name}旅行服务
            </Link>
            <Link href="/inquiry?mode=undecided" className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#2f7df6] px-5 text-sm font-semibold text-white">
              让我推荐方案
            </Link>
            <Link href={`/inquiry?service=combo&subject=${encodeURIComponent(dest.name)}`} className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#ff6a00] px-5 text-sm font-semibold text-white">
              提交目的地，查看预估
            </Link>
          </section>
        </div>
      </Container>
      <AppBottomNav active="services" />
    </main>
  );
}
