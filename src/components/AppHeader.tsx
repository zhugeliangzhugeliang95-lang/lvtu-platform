import Link from "next/link";
import { ChevronDown, Headphones, MapPin, MessageCircle } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

export function AppHeader({ city = "东莞" }: { city?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e3e9f1]/80 bg-white/92 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[600px] items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark compact />
          <Link href="/explore" className="flex min-h-11 items-center gap-1 text-xs font-semibold text-[#667085]" aria-label={`当前出发城市 ${city}，点击选择目的地`}>
            <MapPin size={14} className="text-[#1769e0]" />
            {city}
            <ChevronDown size={13} />
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/member/messages" className="grid h-11 w-11 place-items-center rounded-xl text-[#667085] transition hover:bg-[#eff6ff] hover:text-[#1769e0]" aria-label="消息">
            <MessageCircle size={19} />
          </Link>
          <Link href="/contact" className="grid h-11 w-11 place-items-center rounded-xl text-[#667085] transition hover:bg-[#eff6ff] hover:text-[#1769e0]" aria-label="联系客服">
            <Headphones size={19} />
          </Link>
        </div>
      </div>
    </header>
  );
}
