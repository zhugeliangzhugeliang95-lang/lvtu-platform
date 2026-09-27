import Link from "next/link";
import { CalendarDays, MapPinned } from "lucide-react";
import { PriceTypeBadge } from "@/components/PriceTypeBadge";
import { SafeImage } from "@/components/SafeImage";
import type { TourGroup } from "@/lib/travelData";

export function GroupTourCard({ tour, compact = false }: { tour: TourGroup; compact?: boolean }) {
  return (
    <article className={`overflow-hidden rounded-[18px] border border-[#e3e9f1] bg-white ${compact ? "w-[286px] shrink-0" : "w-full"}`}>
      <div className={`relative overflow-hidden ${compact ? "h-36" : "h-44"}`}>
        <SafeImage src={tour.image} alt={tour.title} className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071a33]/65 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-md bg-white/92 px-2 py-1 text-[10px] font-bold text-[#104da6]">参考行程</span>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-semibold text-white">
          <span>{tour.type}</span>
          <span>{tour.days}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-6 text-[#172033]">{tour.title}</h3>
        <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-[#667085]"><MapPinned size={14} className="mt-0.5 shrink-0 text-[#1769e0]" />{tour.route}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-[#8d98a8]"><CalendarDays size={14} />{tour.nextDate}</p>
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#edf0f5] pt-3">
          <div>
            <PriceTypeBadge type={tour.priceType} />
            <p className="mt-1 text-base font-bold text-[#172033]">{tour.price}</p>
          </div>
          <Link href={`/inquiry?service=group&subject=${encodeURIComponent(tour.title)}`} className="inline-flex min-h-11 items-center rounded-xl bg-[#1769e0] px-4 text-xs font-bold text-white transition hover:bg-[#104da6] active:scale-95">咨询团期</Link>
        </div>
      </div>
    </article>
  );
}
