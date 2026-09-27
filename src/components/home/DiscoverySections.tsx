import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/home/SectionHeader";
import { TravelImage } from "@/components/travel/TravelImage";
import type { Destination, TravelInspiration } from "@/lib/types/travel";

export function SeasonalDestinations({ destinations }: { destinations: Destination[] }) {
  return (
    <section className="home-section" aria-labelledby="destinations-title">
      <SectionHeader title="最近适合去" subtitle="根据季节发现下一站" action="探索" href="/destinations" />
      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-5 pb-1">
        {destinations.map((destination) => (
          <Link key={destination.id} href={`/hotels?q=${encodeURIComponent(destination.name)}`} className="group relative h-[214px] w-[158px] shrink-0 snap-start overflow-hidden rounded-[20px] bg-[#d9e4ed] active:scale-[0.985]">
            <TravelImage src={destination.image} alt={`${destination.name}${destination.subtitle}`} className="absolute inset-0" imageClassName="transition-transform duration-500 group-hover:scale-[1.035]" sizes="158px" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#10213a]/75 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <h3 className="text-[19px] font-semibold">{destination.name}</h3>
              <p className="mt-1 text-[11px] text-white/78">{destination.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function TravelInspirationSection({ items }: { items: TravelInspiration[] }) {
  return (
    <section className="home-section px-5" aria-labelledby="inspiration-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 id="inspiration-title" className="font-serif text-[24px] font-semibold text-[var(--ink-navy)]">旅行灵感</h2>
        <Link href="/discover?tab=routes" className="inline-flex min-h-11 items-center gap-1 text-[12px] text-[var(--slate)]">更多<ArrowRight size={14} /></Link>
      </div>
      <div className="space-y-6">
        {items.map((item, index) => (
          <Link key={item.id} href={item.href} className="group grid grid-cols-[124px_minmax(0,1fr)] gap-4 active:scale-[0.99]">
            <TravelImage src={item.image} alt={item.title} className="aspect-[4/3] rounded-[16px]" imageClassName="transition-transform duration-500 group-hover:scale-[1.025]" sizes="124px" />
            <div className="flex min-w-0 flex-col justify-center border-b border-[#e7ecf2] pb-4">
              <p className={`text-[10px] font-semibold ${item.type === "平台实测" ? "text-[var(--sage-travel)]" : item.type === "AI整理" ? "text-[#6e69d9]" : "text-[var(--sunset-gold)]"}`}>{item.type}</p>
              <h3 className="mt-1.5 text-[15px] font-semibold leading-[1.45] text-[var(--ink-navy)]">{item.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-[11px] leading-[1.7] text-[var(--slate)]">{item.summary}</p>
              {index === items.length - 1 ? null : <span className="sr-only">阅读攻略</span>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
