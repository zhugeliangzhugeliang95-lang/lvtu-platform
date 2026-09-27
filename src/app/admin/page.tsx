import Link from "next/link";
import { ArrowRight, Banknote, ClipboardList, FileCheck2, PlaneTakeoff, ReceiptText, Route, WalletCards } from "lucide-react";
import { AdminShell } from "@/components/hotel-admin/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  await requireAdmin("/admin");
  const start=new Date();start.setHours(0,0,0,0);
  const [todayNew,inquiryCount,waitingQuote,finalQuoted,paymentReview,fulfilling,tours]=await Promise.all([
    prisma.requirement.count({where:{createdAt:{gte:start}}}),prisma.requirement.count({where:{status:"INQUIRING"}}),prisma.requirement.count({where:{status:"WAITING_FINAL_QUOTE"}}),prisma.requirement.count({where:{status:"FINAL_QUOTED"}}),prisma.payment.count({where:{status:"SUBMITTED"}}),prisma.order.count({where:{orderStatus:"FULFILLING"}}),prisma.tourProduct.count({where:{status:"ONLINE"}}),
  ]);
  const items=[
    {label:"今日新需求",value:todayNew,icon:ClipboardList,href:"/admin/requirements?status=SUBMITTED",tone:"bg-blue-50 text-blue-700"},
    {label:"待询价",value:inquiryCount,icon:Route,href:"/admin/requirements?status=INQUIRING",tone:"bg-amber-50 text-amber-700"},
    {label:"待报价",value:waitingQuote,icon:ReceiptText,href:"/admin/requirements?status=WAITING_FINAL_QUOTE",tone:"bg-violet-50 text-violet-700"},
    {label:"待用户确认",value:finalQuoted,icon:FileCheck2,href:"/admin/requirements?status=FINAL_QUOTED",tone:"bg-cyan-50 text-cyan-700"},
    {label:"待付款审核",value:paymentReview,icon:WalletCards,href:"/admin/payments",tone:"bg-orange-50 text-orange-700"},
    {label:"履约中订单",value:fulfilling,icon:PlaneTakeoff,href:"/admin/orders",tone:"bg-emerald-50 text-emerald-700"},
    {label:"已发布旅行团",value:tours,icon:Banknote,href:"/admin/tours",tone:"bg-slate-100 text-slate-700"},
  ];
  return <AdminShell title="运营总览" subtitle="先处理需求、报价、付款和履约中的待办事项"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map(({label,value,icon:Icon,href,tone})=><Link key={label} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"><div className="flex items-center justify-between"><span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon size={18}/></span><ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500"/></div><p className="mt-5 text-[30px] font-semibold text-slate-900">{value}</p><p className="mt-1 text-xs font-medium text-slate-500">{label}</p></Link>)}</div><section className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-[#0d315d] to-[#155ea7] p-6 text-white"><p className="text-[11px] font-semibold tracking-[.18em] text-blue-200">LVTU OPERATIONS</p><h2 className="mt-3 text-xl font-semibold">预估只是起点，最终成交依靠清晰的人工确认。</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">公开价格、规则、渠道询价、最终报价、付款审核和履约信息现在都留在同一条业务链路中。</p><Link href="/admin/requirements" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-[#0d315d]">进入需求工作台 <ArrowRight size={14}/></Link></section></AdminShell>;
}
