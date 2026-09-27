import Link from "next/link";
import { ArrowUpRight, Grid2X2 } from "lucide-react";
import { HomeIcon } from "@/components/home/HomeIcon";
import type { HomeCoreService } from "@/lib/types/travel";

const toneClass: Record<HomeCoreService["tone"], string> = {
  blue: "bg-[#eaf1ff] text-[#2f6bff]",
  sky: "bg-[#edf7ff] text-[#4d91d9]",
  coral: "bg-[#fff0eb] text-[#e46d50]",
  sage: "bg-[#edf7f3] text-[#4f9c84]",
  gold: "bg-[#fff6e8] text-[#c38a3d]",
  aurora: "bg-[#f0efff] text-[#6e69d9]",
  navy: "bg-[#edf2f8] text-[#12345b]",
};

export function CoreServiceGrid({ services }: { services: HomeCoreService[] }) {
  return (
    <section aria-labelledby="core-services-title" className="px-4 pt-1">
      <h2 id="core-services-title" className="sr-only">核心旅行服务</h2>
      <div className="rounded-[24px] bg-white px-[18px] py-7 shadow-[var(--shadow-soft)]">
        <div className="grid grid-cols-4 gap-x-2 gap-y-7">
          {services.map((service) => (
            <Link key={service.id} href={service.href} className="group flex min-w-0 flex-col items-center text-center active:scale-[0.975]">
              <span className={`grid size-[52px] place-items-center rounded-[17px] transition-transform duration-200 group-hover:-translate-y-0.5 ${toneClass[service.tone]}`}>
                <HomeIcon name={service.icon} size={23} />
              </span>
              <span className="mt-2.5 text-[13px] font-medium leading-5 text-[var(--ink-navy)]">{service.label}</span>
            </Link>
          ))}
        </div>
        <Link href="/services" className="mt-7 flex min-h-14 items-center justify-between border-t border-[#edf1f5] pt-4 text-[13px] text-[var(--slate)] active:scale-[0.99]">
          <span className="flex items-center gap-2.5"><Grid2X2 size={18} className="text-[var(--aegean-navy)]" />查看全部旅行服务</span>
          <ArrowUpRight size={17} className="text-[var(--voyage-blue)]" />
        </Link>
      </div>
    </section>
  );
}
