import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Price } from "@/components/travel/Price";
import { SectionHeader } from "@/components/home/SectionHeader";
import { TravelImage } from "@/components/travel/TravelImage";
import type { TravelPlan } from "@/lib/types/travel";

export function FeaturedPlansSection({ plans }: { plans: TravelPlan[] }) {
  return (
    <section className="home-section border-y border-[#edf1f5] bg-white py-8" aria-labelledby="featured-plans-title">
      <SectionHeader title="精选旅行方案" action="查看全部" href="/tours" />
      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-5 pb-1">
        {plans.map((plan) => (
          <Link key={plan.id} href={`/tours/${plan.id.includes("sanya") ? "sanya-island-5d" : plan.id.includes("yunnan") ? "xinjiang-north-8d" : "tokyo-hakone-6d"}`} className="group w-[274px] shrink-0 snap-start overflow-hidden rounded-[22px] bg-[var(--pearl-white)] ring-1 ring-[#e7ecf2] transition active:scale-[0.985]">
            <TravelImage src={plan.image} alt={plan.title} className="aspect-[16/10]" imageClassName="transition-transform duration-500 group-hover:scale-[1.025]" sizes="274px" />
            <div className="p-4">
              <p className="flex items-center gap-1 text-[11px] font-medium text-[var(--slate)]"><MapPin size={13} className="text-[var(--voyage-blue)]" />{plan.destination} · {plan.days}</p>
              <h3 className="mt-2 text-[17px] font-semibold text-[var(--ink-navy)]">{plan.title}</h3>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {plan.highlights.slice(0, 3).map((highlight) => <span key={highlight} className="rounded-full bg-[#f1f4f8] px-2.5 py-1 text-[10px] text-[var(--slate)]">{highlight}</span>)}
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div><p className="text-[10px] text-[#8a94a6]">参考预算</p><Price value={plan.estimatedPrice} suffix={`起 / ${plan.priceUnit}`} className="mt-0.5 text-[21px]" /></div>
                <ArrowRight size={17} className="mb-1 text-[var(--voyage-blue)] transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
