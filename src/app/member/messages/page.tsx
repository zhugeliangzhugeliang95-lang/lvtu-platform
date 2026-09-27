import { Bell, CheckCircle2, MessageSquareText } from "lucide-react";
import { PlatformFrame } from "@/components/platform/Catalog";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/userAuth";
import { MarkAllRead } from "./ui";

function formatTime(value: Date) { return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(value); }

export default async function MemberMessagesPage() {
  const userId = await requireUser("/notifications");
  const items = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 80 });
  const unread = items.filter((item) => !item.isRead).length;
  return <PlatformFrame title="通知中心" subtitle="订单、行程与顾问消息" back="/member" active="member"><section className="px-5 pt-5"><div className="flex items-center justify-between rounded-[20px] bg-[#eef7ff] px-4 py-3"><div><p className="text-[12px] font-semibold">{unread ? `${unread} 条未读消息` : "消息已全部读完"}</p><p className="mt-1 text-[10px] text-[var(--app-muted)]">重要服务进度会保留在这里</p></div><MarkAllRead disabled={!unread}/></div></section><section className="space-y-3 px-5 py-5">{items.map((item) => <article key={item.id} className={`app-card flex gap-3 p-4 ${item.isRead ? "opacity-75" : "ring-1 ring-[#cfe5fa]"}`}><span className={`relative grid size-10 shrink-0 place-items-center rounded-[14px] ${item.type === "SYSTEM" ? "bg-[#eef1f5] text-[#607286]" : "bg-[var(--app-blue-soft)] text-[var(--app-blue)]"}`}>{item.type === "SYSTEM" ? <Bell size={18}/> : <MessageSquareText size={18}/>} {!item.isRead ? <i className="absolute right-0 top-0 size-2 rounded-full bg-[#ff625c]"/> : null}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 className="text-[14px] font-semibold">{item.title}</h2><time className="shrink-0 text-[9px] text-[var(--app-muted)]">{formatTime(item.createdAt)}</time></div><p className="mt-2 whitespace-pre-wrap text-[11px] leading-5 text-[#53677e]">{item.content}</p></div></article>)}{!items.length ? <div className="app-card px-6 py-12 text-center"><CheckCircle2 size={28} className="mx-auto text-emerald-500"/><h2 className="mt-3 text-[15px] font-semibold">暂无新消息</h2><p className="mt-2 text-[11px] text-[var(--app-muted)]">订单、报价和行程进度会在这里通知你。</p></div> : null}</section></PlatformFrame>;
}
