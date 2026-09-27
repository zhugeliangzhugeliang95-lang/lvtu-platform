import Link from "next/link";
import { BellRing, ChevronRight, CircleHelp, Crown, Info, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { PlatformFrame } from "@/components/platform/Catalog";
import { getUserIdFromCookie } from "@/lib/userAuth";

const entries = [
  { label: "账号信息", note: "昵称、邮箱与联系方式", href: "/member/profile", icon: UserRound },
  { label: "通知设置", note: "服务提醒与活动消息", href: "/settings/notifications", icon: BellRing },
  { label: "会员服务协议", note: "会员开通、续费与权益说明", href: "/settings/membership-terms", icon: Crown },
  { label: "隐私与安全", note: "了解数据使用与账号保护", href: "/settings/privacy", icon: ShieldCheck },
  { label: "关于旅途", note: "平台介绍、服务方式与版本", href: "/settings/about", icon: Info },
];

export default async function SettingsPage() {
  const userId = await getUserIdFromCookie();
  return <PlatformFrame title="设置" subtitle="账号、通知与隐私" back="/member" active="member"><section className="mt-5 px-5"><div className="app-card divide-y divide-[#edf3f8] px-4">{entries.map(({ label, note, href, icon: Icon }) => <Link key={label} href={href} className="flex min-h-[72px] items-center gap-3 py-3"><span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-[var(--app-blue-soft)] text-[var(--app-blue)]"><Icon size={18}/></span><div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">{label}</p><p className="mt-1 text-[10px] text-[var(--app-muted)]">{note}</p></div><ChevronRight size={16} className="text-[#a5b1be]"/></Link>)}</div><Link href="/contact" className="mt-4 flex min-h-14 items-center gap-3 rounded-[18px] bg-[#eef7ff] px-4"><CircleHelp size={18} className="text-[var(--app-blue)]"/><div className="flex-1"><p className="text-[12px] font-semibold">帮助与客服</p><p className="mt-1 text-[10px] text-[var(--app-muted)]">使用问题、投诉与建议</p></div><ChevronRight size={16} className="text-[var(--app-blue)]"/></Link>{userId ? <form action="/api/auth/logout" method="post" className="mt-4"><button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[17px] border border-red-100 bg-white text-[12px] font-semibold text-red-600"><LogOut size={15}/>退出当前账号</button></form> : <Link href="/login?next=/settings" className="mt-4 flex min-h-12 items-center justify-center rounded-[17px] bg-[var(--app-blue)] text-[12px] font-semibold text-white">登录账号</Link>}<p className="mt-6 text-center text-[9px] text-[var(--app-muted)]">旅途 LVTU · 当前平台版本 V1</p></section></PlatformFrame>;
}
