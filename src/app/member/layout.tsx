"use client";

import { usePathname } from "next/navigation";

import { AppBottomNav } from "@/components/AppBottomNav";

export default function MemberLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const legacyPageNeedsNav = ["/member/feedback", "/member/inquiries", "/member/searches"].some((prefix) => pathname.startsWith(prefix));

  return (
    <div className={legacyPageNeedsNav ? "min-h-screen pb-[calc(84px+env(safe-area-inset-bottom))]" : "min-h-screen"}>
      {children}
      {legacyPageNeedsNav ? <AppBottomNav active="member" /> : null}
    </div>
  );
}
