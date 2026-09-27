import Link from "next/link";
import { CalendarDays, Home, MapPin, Sparkles, UserRound } from "lucide-react";

const navItems = [
  { key: "home", label: "首页", href: "/", icon: Home },
  { key: "discover", label: "探索", href: "/explore", icon: MapPin },
  { key: "ai", label: "AI规划", href: "/ai", icon: Sparkles, featured: true },
  { key: "trips", label: "行程", href: "/trips", icon: CalendarDays },
  { key: "member", label: "我的", href: "/profile", icon: UserRound },
];

export function AppBottomNav({ active = "home", compact = false }: { active?: string; compact?: boolean }) {
  return (
    <nav
      aria-label="主导航"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(8px,env(safe-area-inset-bottom))]"
    >
      <div className={`pointer-events-auto mx-auto grid grid-cols-5 rounded-[24px] border border-white/80 bg-white/88 px-1 shadow-[0_12px_36px_rgba(14,70,145,.16)] backdrop-blur-2xl ${compact ? "max-w-[500px]" : "max-w-[580px]"}`}>
        {navItems.map(({ key, label, href, icon: Icon, featured }) => {
          const selected = key === active;
          return (
            <Link
              key={key}
              href={href}
              aria-current={selected ? "page" : undefined}
              className={`relative flex min-h-[66px] flex-col items-center justify-center gap-1 text-[10px] font-semibold transition duration-200 active:scale-95 ${
                selected ? "text-[#1677ff]" : "text-[#7c8da3]"
              }`}
            >
              <span
                className={`grid place-items-center transition ${
                  featured
                    ? `h-[42px] w-[54px] -translate-y-1 rounded-[18px] text-white ${selected ? "bg-[#0759b8]" : "bg-[#1677ff]"} shadow-[0_8px_20px_rgba(22,119,255,.28)]`
                    : selected
                      ? "h-8 w-11 rounded-[14px] bg-[#eaf5ff]"
                      : "h-7 w-10"
                }`}
              >
                <Icon size={featured ? 19 : 18} strokeWidth={selected || featured ? 2.35 : 2} />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
