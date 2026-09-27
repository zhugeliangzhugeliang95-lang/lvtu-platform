import type { ReactNode } from "react";
import { AppBottomNav } from "@/components/AppBottomNav";
import { AppHeader } from "@/components/AppHeader";

export function AppShell({
  active,
  children,
  header = true,
  compact = false,
}: {
  active: string;
  children: ReactNode;
  header?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`min-h-screen text-[#111827] ${compact ? "bg-[#eaf3ff]" : "bg-[#eef2f6]"}`}>
      {header ? <AppHeader /> : null}
      <main className={`mx-auto min-h-screen w-full pb-[calc(92px+env(safe-area-inset-bottom))] sm:shadow-[0_0_45px_rgba(18,79,171,0.10)] ${compact ? "max-w-[520px] bg-white" : "max-w-[600px] bg-[#f7f9fc]"}`}>
        {children}
      </main>
      <AppBottomNav active={active} compact={compact} />
    </div>
  );
}
