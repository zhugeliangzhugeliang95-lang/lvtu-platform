import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Globe2, MapPin, ShieldAlert } from "lucide-react";
import { AdminShell } from "@/components/hotel-admin/AdminShell";
import { SupplierDetailActions } from "@/components/suppliers/SupplierDetailActions";
import { SupplierStatusBadge } from "@/components/suppliers/SupplierStatusBadge";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; await requireAdmin(`/admin/suppliers/${id}`);
  const item = await prisma.travelSupplier.findUnique({ where: { id }, include: { brands: true, licenses: true, services: true, destinations: true, contacts: true, sources: { orderBy: { queriedAt: "desc" } }, risks: { orderBy: { createdAt: "desc" } }, interactions: { orderBy: { contactedAt: "desc" } }, contracts: true, publications: { orderBy: { createdAt: "desc" } }, auditLogs: { orderBy: { createdAt: "desc" }, take: 50 } } });
  if (!item) notFound();
  return <AdminShell title={item.brandName} subtitle={item.legalEntityName} headerExtra={<Link href="/admin/suppliers" className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dfe5ee] bg-white px-3 text-sm"><ArrowLeft className="h-4 w-4"/>返回列表</Link>}>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]">
      <div className="space-y-7 rounded-lg border border-[#dfe5ee] bg-white p-5">
        <section><div className="flex flex-wrap items-center gap-2"><SupplierStatusBadge status={item.status}/><span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${item.isPublic ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.isPublic ? "前台已发布" : "仅后台可见"}</span></div><p className="mt-4 text-sm leading-7 text-[#475467]">{item.summary || "暂无机构简介，等待人工补充。"}</p><div className="mt-4 flex flex-wrap gap-4 text-xs text-[#667085]"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5"/>{[item.province,item.city].filter(Boolean).join(" ") || "地区待补充"}</span>{item.website && <a href={item.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#1769e0]"><Globe2 className="h-3.5 w-3.5"/>官方网站<ExternalLink className="h-3 w-3"/></a>}</div></section>
        <Section title="品牌与经营主体"><Rows rows={item.brands.map((brand) => [brand.name, brand.relationship])}/></Section>
        <Section title="旅行社资质"><Rows empty="许可证未找到，不能以营业执照替代。" rows={item.licenses.map((license) => [license.licenseType, `${license.licenseNumber || "编号待核验"} · ${license.status} · ${license.businessScope || "范围待补充"}`])}/></Section>
        <Section title="业务能力"><Tags items={item.services.map((service) => `${service.name}${service.verified ? " · 已核验" : " · 待核验"}`)}/></Section>
        <Section title="服务目的地"><Tags items={item.destinations.map((destination) => `${destination.name}${destination.verified ? " · 已核验" : ""}`)}/></Section>
        <Section title="公开商务联系方式"><Rows empty="尚未收录可核验的企业商务联系方式。" rows={item.contacts.map((contact) => [contact.label || contact.contactType, contact.value])}/></Section>
        <Section title="联系记录"><Rows empty="尚未人工联系。" rows={item.interactions.map((interaction) => [new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(interaction.contactedAt), `${interaction.channel} · ${interaction.outcome}${interaction.nextStep ? ` · 下一步：${interaction.nextStep}` : ""}`])}/></Section>
        <SupplierDetailActions id={id} currentStatus={item.status} isPublic={item.isPublic} legalEntityName={item.legalEntityName}/>
      </div>
      <aside className="space-y-6">
        <section className="rounded-lg border border-[#dfe5ee] bg-white p-4"><h2 className="text-sm font-semibold">发布门槛</h2><ul className="mt-3 space-y-2 text-xs text-[#667085]"><li>{item.status === "ACTIVE" ? "✓" : "•"} 状态为 ACTIVE</li><li>{item.isVerified ? "✓" : "•"} 人工核验完成</li><li>{item.licenses.some((x) => x.status === "VALID" && !x.needsManualReview) ? "✓" : "•"} 至少一项有效许可证</li><li>{item.publicContentReady ? "✓" : "•"} 公开内容已审核</li></ul></section>
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4"><h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900"><ShieldAlert className="h-4 w-4"/>风险标记 {item.risks.filter((risk) => !risk.resolvedAt).length}</h2><ul className="mt-3 space-y-2 text-xs text-amber-900/80">{item.risks.length ? item.risks.map((risk) => <li key={risk.id}>{risk.label} · {risk.severity}</li>) : <li>暂无未解决风险</li>}</ul></section>
        <section className="rounded-lg border border-[#dfe5ee] bg-white p-4"><h2 className="text-sm font-semibold">原始来源</h2><div className="mt-3 space-y-3">{item.sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="block border-b border-[#eef1f5] pb-3 text-xs last:border-0"><strong className="block text-[#172033]">{source.title}</strong><span className="mt-1 block text-[#667085]">{source.sourceType} · {source.confidence} · {source.manualReviewed ? "已人工复核" : "待复核"}</span><span className="mt-1 block truncate text-[#1769e0]">{source.url}</span></a>)}</div></section>
        <section className="rounded-lg border border-[#dfe5ee] bg-white p-4"><h2 className="text-sm font-semibold">审计日志</h2><div className="mt-3 space-y-3 text-xs text-[#667085]">{item.auditLogs.length ? item.auditLogs.map((log) => <div key={log.id}><strong className="text-[#172033]">{log.action}</strong><span className="ml-2">{new Intl.DateTimeFormat("zh-CN").format(log.createdAt)}</span><p className="mt-1">{log.reason || log.afterValue || "无备注"}</p></div>) : <p>尚无审计记录</p>}</div></section>
      </aside>
    </div>
  </AdminShell>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="border-t border-[#dfe5ee] pt-5"><h2 className="text-base font-semibold">{title}</h2><div className="mt-3">{children}</div></section>; }
function Rows({ rows, empty = "暂无资料" }: { rows: string[][]; empty?: string }) { return rows.length ? <div className="divide-y divide-[#eef1f5]">{rows.map((row, index) => <div key={index} className="grid gap-1 py-3 text-sm sm:grid-cols-[180px_1fr]"><strong>{row[0]}</strong><span className="text-[#667085]">{row[1]}</span></div>)}</div> : <p className="text-sm text-[#667085]">{empty}</p>; }
function Tags({ items }: { items: string[] }) { return items.length ? <div className="flex flex-wrap gap-2">{items.map((item) => <span key={item} className="rounded-md bg-[#f1f5f9] px-2.5 py-1.5 text-xs text-[#475467]">{item}</span>)}</div> : <p className="text-sm text-[#667085]">尚未记录</p>; }

