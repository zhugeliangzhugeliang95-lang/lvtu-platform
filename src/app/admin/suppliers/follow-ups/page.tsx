import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { AdminShell } from "@/components/hotel-admin/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
export default async function FollowUpsPage() { await requireAdmin("/admin/suppliers/follow-ups"); const items = await prisma.travelSupplier.findMany({ where: { nextFollowUpAt: { not: null }, status: { notIn: ["REJECTED","EXPIRED"] } }, orderBy: { nextFollowUpAt: "asc" }, take: 100 }); return <AdminShell title="供应商跟进" subtitle="按下次跟进时间排序"><div className="overflow-hidden rounded-lg border bg-white">{items.length ? items.map((item) => <Link key={item.id} href={`/admin/suppliers/${item.id}`} className="grid gap-2 border-b p-4 last:border-0 sm:grid-cols-[1fr_180px]"><div><strong className="text-sm">{item.brandName}</strong><p className="mt-1 text-xs text-[#667085]">{item.legalEntityName}</p></div><span className="inline-flex items-center gap-2 text-xs text-[#475467]"><CalendarClock className="h-4 w-4"/>{item.nextFollowUpAt ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(item.nextFollowUpAt) : ""}</span></Link>) : <div className="p-12 text-center text-sm text-[#667085]">暂无已设置的跟进任务</div>}</div></AdminShell>; }

