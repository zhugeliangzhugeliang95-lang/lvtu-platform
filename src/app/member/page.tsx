import Link from "next/link";
import { Bell, ChevronRight, CircleHelp, ClipboardList, Clock3, Gift, Headphones, Heart, MapPin, PackageCheck, Settings, ShieldCheck, TicketCheck, UserRound, WalletCards } from "lucide-react";

import { TravelAppShell } from "@/components/app/TravelAppShell";
import { prisma } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/userAuth";

export default async function MemberPage() {
  const userId = await getUserIdFromCookie();
  const data = userId
    ? await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { nickname: true, email: true, mobile: true, avatar: true } }),
        prisma.order.count({ where: { userId } }),
        prisma.favorite.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, isRead: false } }),
      ])
    : [null, 0, 0, 0] as const;

  const [user, orderCount, favoriteCount, unreadCount] = data;
  const displayName = user?.nickname?.trim() || "旅行者";
  const account = user?.mobile || user?.email || "登录后同步全部旅行服务";

  const orderEntries = [
    { icon: Clock3, label: "待确认", href: "/member/orders", count: 0 },
    { icon: WalletCards, label: "待付款", href: "/member/orders", count: 0 },
    { icon: TicketCheck, label: "待出发", href: "/orders", count: Number(orderCount) },
    { icon: PackageCheck, label: "已完成", href: "/member/orders", count: 0 },
  ];

  const menu = [
    { icon: ClipboardList, label: "我的需求", note: "查看顾问确认与处理进度", href: "/member/requests", tone: "bg-[#eef8ff] text-[#1677ff]" },
    { icon: Heart, label: "我的收藏", note: `${favoriteCount} 个收藏`, href: "/member/favorites", tone: "bg-[#fff0f3] text-[#e35772]" },
    { icon: Gift, label: "我的报价", note: "查看顾问报价与确认状态", href: "/member/quotes", tone: "bg-[#eef5ff] text-[#1677ff]" },
    { icon: Gift, label: "旅途会员", note: "会员状态与平台服务费权益", href: "/profile/membership", tone: "bg-[#fff7e7] text-[#d28a17]" },
    { icon: Headphones, label: "联系客服", note: "旅行顾问与售后", href: "/contact", tone: "bg-[#eaf5ff] text-[#1677ff]" },
    { icon: Settings, label: "设置", note: "账号、通知与隐私", href: "/settings", tone: "bg-[#eef1f5] text-[#53677e]" },
  ];

  return (
    <TravelAppShell active="member">
      <header className="flex items-center justify-between px-5 pb-3 pt-[max(16px,env(safe-area-inset-top))]">
        <div><p className="text-[10px] font-bold text-[var(--app-blue)]">MY LVTU</p><h1 className="mt-1 text-[24px] font-semibold">我的</h1></div>
        <Link href="/member/messages" className="app-icon-button relative" aria-label="消息"><Bell size={19} />{Number(unreadCount) > 0 ? <span className="absolute right-1.5 top-1 grid min-w-4 place-items-center rounded-full bg-[#ff625c] px-1 text-[8px] font-bold text-white">{String(unreadCount)}</span> : null}</Link>
      </header>

      <section className="px-5 pt-3">
        <div className="relative overflow-hidden rounded-[24px] bg-[#0d315d] p-5 text-white shadow-[0_18px_38px_rgba(7,45,91,.22)]">
          <div className="absolute -right-12 -top-16 size-48 rounded-full border-[28px] border-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="grid size-[68px] shrink-0 place-items-center overflow-hidden rounded-[22px] border border-white/20 bg-white/12">
              {user?.avatar ? <img src={user.avatar} alt={displayName} className="h-full w-full object-cover" /> : <UserRound size={30} />}
            </div>
            <div className="min-w-0 flex-1"><p className="truncate text-[20px] font-semibold">你好，{displayName}</p><p className="mt-1 truncate text-[10px] text-white/58">{account}</p><div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#9ed0ff]"><ShieldCheck size={13} /> 旅游服务档案已保护</div></div>
            <ChevronRight size={18} className="text-white/58" />
          </div>
          {!userId ? <div className="relative mt-5 flex gap-2"><Link href="/login?next=/member" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[17px] bg-white text-[12px] font-semibold text-[#0759b8]">登录 / 注册</Link><Link href="/contact" className="inline-flex min-h-11 items-center justify-center rounded-[17px] border border-white/18 px-4 text-[12px] font-semibold">联系客服</Link></div> : null}
        </div>
      </section>

      <section className="mt-7 px-5">
        <div className="flex items-center justify-between"><h2 className="text-[19px] font-semibold">旅行档案</h2><Link href="/member/profile" className="text-[11px] font-semibold text-[var(--app-blue)]">编辑</Link></div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {["海岛度假", "城市漫游", "节奏轻松", "景观酒店"].map((tag, index) => <span key={tag} className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[10px] font-semibold ${index === 0 ? "bg-[var(--app-blue)] text-white" : "border border-[#dce8f4] bg-white text-[#607286]"}`}>{index === 0 ? <MapPin size={12} /> : null}{tag}</span>)}
        </div>
      </section>

      <section className="mt-8 px-5">
        <div className="flex items-center justify-between"><h2 className="text-[19px] font-semibold">我的订单</h2><Link href="/member/orders" className="inline-flex items-center text-[11px] font-semibold text-[var(--app-blue)]">全部订单 <ChevronRight size={14} /></Link></div>
        <div className="mt-4 grid grid-cols-4 rounded-[22px] border border-[#dce8f4] bg-white px-2 py-4 shadow-[0_8px_24px_rgba(28,78,135,.06)]">
          {orderEntries.map(({ icon: Icon, label, href, count }) => <Link key={label} href={href} className="relative flex min-h-[58px] flex-col items-center justify-center text-center"><span className="relative grid size-9 place-items-center text-[var(--app-blue)]"><Icon size={20} />{count > 0 ? <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#ff625c] text-[8px] font-bold text-white">{count}</span> : null}</span><span className="mt-1.5 text-[10px] font-medium text-[#53677e]">{label}</span></Link>)}
        </div>
      </section>

      <section className="mt-8 px-5">
        <div className="divide-y divide-[#e8eff6] rounded-[22px] border border-[#dce8f4] bg-white px-4 shadow-[0_8px_24px_rgba(28,78,135,.05)]">
          {menu.map(({ icon: Icon, label, note, href, tone }) => <Link key={label} href={href} className="flex min-h-[72px] items-center gap-3 py-3"><span className={`grid size-10 shrink-0 place-items-center rounded-[15px] ${tone}`}><Icon size={18} /></span><div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">{label}</p><p className="mt-1 text-[10px] text-[var(--app-muted)]">{note}</p></div><ChevronRight size={16} className="text-[#a5b1be]" /></Link>)}
        </div>
      </section>

      <section className="mt-6 px-5 pb-5">
        <Link href="/contact" className="flex items-center gap-3 rounded-[20px] bg-[var(--app-blue-soft)] p-4"><span className="grid size-10 place-items-center rounded-[14px] bg-white text-[var(--app-blue)]"><CircleHelp size={18} /></span><div className="min-w-0 flex-1"><p className="text-[12px] font-semibold">需要帮助？</p><p className="mt-1 text-[10px] text-[var(--app-muted)]">查看常见问题或联系旅行顾问</p></div><ChevronRight size={16} className="text-[var(--app-blue)]" /></Link>
        {userId ? <form action="/api/auth/logout" method="post" className="mt-4"><button type="submit" className="min-h-11 w-full text-center text-[12px] font-medium text-[#d45252]">退出登录</button></form> : null}
      </section>
    </TravelAppShell>
  );
}
