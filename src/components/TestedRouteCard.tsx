import Link from "next/link";
import { ArrowRight, CalendarCheck2, ShieldCheck } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import type { TestedRoute } from "@/lib/travelData";

export function TestedRouteCard({ route, featured = false }: { route: TestedRoute; featured?: boolean }) {
  return (
    <article className={`overflow-hidden rounded-[18px] border border-[#dce4ef] bg-white ${featured ? "sm:grid sm:grid-cols-[1.1fr_.9fr]" : ""}`}>
      <div className={`relative overflow-hidden ${featured ? "h-56 sm:h-full" : "h-40"}`}>
        <SafeImage src={route.image} alt={route.title} className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071a33]/55 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg bg-[#071a33]/88 px-2.5 py-1.5 text-[10px] font-bold text-white">
          <ShieldCheck size={12} className="text-[#83b8ff]" />旅行通实测
        </span>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 text-[11px] font-medium text-[#8d98a8]">
          <CalendarCheck2 size={13} />实测 {route.testedAt} · 更新 {route.updatedAt}
        </div>
        <h3 className="mt-2 text-[17px] font-bold leading-6 text-[#172033]">{route.title}</h3>
        <p className="mt-2 text-xs leading-5 text-[#667085]">{route.keyExperience}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#667085]">
          <span>{route.days}</span><span>{route.audience}</span><span>{route.budget}</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-[#edf0f5] pt-3">
          <span className="text-[10px] font-semibold text-[#8d98a8]">真实体验内容</span>
          <Link href={`/inquiry?service=combo&subject=${encodeURIComponent(route.title)}`} className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-[#1769e0]">按路线询价<ArrowRight size={14} /></Link>
        </div>
      </div>
    </article>
  );
}
