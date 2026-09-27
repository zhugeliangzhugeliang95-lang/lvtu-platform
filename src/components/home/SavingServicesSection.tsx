import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeader } from "@/components/home/SectionHeader";
import { TravelImage } from "@/components/travel/TravelImage";
import type { SavingService } from "@/lib/types/travel";

const toneClass: Record<SavingService["tone"], string> = {
  sky: "bg-[#eef5ff]",
  sage: "bg-[#eef7f2]",
  warm: "bg-[#fff4ec]",
  lilac: "bg-[#f5f1fb]",
};

export function SavingServicesSection({ services }: { services: SavingService[] }) {
  return (
    <section className="home-section" aria-labelledby="saving-title">
      <SectionHeader title="这些服务更容易帮你省钱" action="省钱攻略" href="/discover?tab=routes&topic=saving" />
      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-5 pb-2">
        {services.map((service) => (
          <Link key={service.id} href={service.href} className={`group w-[168px] shrink-0 snap-center overflow-hidden rounded-[20px] ${toneClass[service.tone]} transition duration-200 active:scale-[0.985]`}>
            <div className="flex h-[92px] items-start justify-between gap-2 p-4">
              <div>
                <h3 className="text-[16px] font-semibold text-[var(--ink-navy)]">{service.title}</h3>
                <p className="mt-1.5 text-[12px] leading-5 text-[var(--slate)]">{service.description}</p>
              </div>
              <ArrowUpRight size={16} className="mt-0.5 shrink-0 text-[var(--aegean-navy)]/55 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <TravelImage src={service.image} alt={service.title} className="aspect-[16/10]" sizes="168px" />
          </Link>
        ))}
      </div>
    </section>
  );
}
