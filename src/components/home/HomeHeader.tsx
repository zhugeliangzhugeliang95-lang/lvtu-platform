import Link from "next/link";
import { Headphones, MessageCircle } from "lucide-react";

export function HomeHeader() {
  return (
    <header className="px-5 pt-[env(safe-area-inset-top)]">
      <div className="flex h-[58px] items-center justify-between">
        <Link href="/" aria-label="旅途首页" className="text-[23px] font-semibold text-[var(--aegean-navy)]">
          旅途
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/member/messages" aria-label="消息" className="grid size-11 place-items-center rounded-[14px] text-[var(--aegean-navy)] transition-colors hover:bg-white active:scale-[0.975]">
            <MessageCircle size={20} strokeWidth={1.9} />
          </Link>
          <Link href="/contact" aria-label="联系旅行顾问" className="grid size-11 place-items-center rounded-[14px] text-[var(--aegean-navy)] transition-colors hover:bg-white active:scale-[0.975]">
            <Headphones size={20} strokeWidth={1.9} />
          </Link>
        </div>
      </div>
    </header>
  );
}
