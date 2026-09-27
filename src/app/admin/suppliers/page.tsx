import Link from "next/link";
import { FileSearch, Plus, Upload } from "lucide-react";
import { requireAdmin } from "@/lib/adminAuth";
import { AdminShell } from "@/components/hotel-admin/AdminShell";
import { SupplierListClient } from "@/components/suppliers/SupplierListClient";

export default async function SuppliersPage() {
  await requireAdmin("/admin/suppliers");
  return <AdminShell title="供应商中心" subtitle="研究候选、人工核验、联系记录与发布门槛" headerExtra={<div className="flex gap-2"><Link href="/admin/suppliers/review" className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dfe5ee] bg-white px-3 text-sm"><FileSearch className="h-4 w-4"/>待审核</Link><Link href="/admin/suppliers/import" className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dfe5ee] bg-white px-3 text-sm"><Upload className="h-4 w-4"/>导入</Link><Link href="/admin/suppliers/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1769e0] px-3 text-sm font-semibold text-white"><Plus className="h-4 w-4"/>新建</Link></div>}><SupplierListClient/></AdminShell>;
}

