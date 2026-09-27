import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { AppBottomNav } from "@/components/AppBottomNav";
import { MessageBell } from "@/components/app/MessageBell";

export function TravelAppShell({
  active,
  children,
  className = "",
  bottomNav = true,
}: {
  active: "home" | "discover" | "ai" | "trips" | "member";
  children: ReactNode;
  className?: string;
  bottomNav?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#eaf2fb] text-[var(--app-ink)]">
      <main
        className={`app-screen mx-auto min-h-screen w-full max-w-[520px] bg-[var(--app-bg)] ${
          bottomNav ? "pb-[calc(94px+env(safe-area-inset-bottom))]" : ""
        } ${className}`}
      >
        {children}
      </main>
      {bottomNav ? <AppBottomNav active={active} compact /> : null}
    </div>
  );
}

export function AppTopBar({
  title,
  subtitle,
  backHref,
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/82 px-5 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-2xl">
      <div className="flex min-h-11 items-center gap-3">
        {backHref ? (
          <Link href={backHref} className="app-icon-button" aria-label="返回">
            <ArrowLeft size={20} />
          </Link>
        ) : (
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5">
            <Image
              src="/logo-mark.png"
              alt="旅途"
              width={30}
              height={30}
              className="size-[30px] shrink-0 object-contain"
              priority
            />
            <span className="min-w-0">
              <span className="block text-[9px] font-bold leading-none text-[var(--app-blue)]">LVTU</span>
              <span className="mt-1 block truncate text-[19px] font-semibold leading-none text-[var(--app-ink)]">{title}</span>
            </span>
          </Link>
        )}
        {backHref ? (
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-center text-[17px] font-semibold">{title}</h1>
            {subtitle ? <p className="mt-0.5 truncate text-center text-[10px] text-[var(--app-muted)]">{subtitle}</p> : null}
          </div>
        ) : subtitle ? (
          <p className="hidden text-xs text-[var(--app-muted)] sm:block">{subtitle}</p>
        ) : null}
        {action ?? (
          <MessageBell className="app-icon-button" iconSize={19} />
        )}
      </div>
    </header>
  );
}

export function SectionHeading({
  title,
  note,
  href,
  action = "查看全部",
}: {
  title: string;
  note?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[21px] font-semibold leading-tight text-[var(--app-ink)]">{title}</h2>
        {note ? <p className="mt-1 text-[12px] leading-5 text-[var(--app-muted)]">{note}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="inline-flex min-h-9 shrink-0 items-center gap-0.5 text-[12px] font-semibold text-[var(--app-blue)]">
          {action} <ChevronRight size={14} />
        </Link>
      ) : null}
    </div>
  );
}
