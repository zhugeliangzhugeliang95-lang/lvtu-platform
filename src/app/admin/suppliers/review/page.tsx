import { AdminShell } from "@/components/hotel-admin/AdminShell";
import { SupplierListClient } from "@/components/suppliers/SupplierListClient";
import { requireAdmin } from "@/lib/adminAuth";
export default async function SupplierReviewPage() { await requireAdmin("/admin/suppliers/review"); return <AdminShell title="待人工审核" subtitle="公开信息已整理，等待核对主体、许可证与联系方式"><SupplierListClient initialStatus="RESEARCHED"/></AdminShell>; }

