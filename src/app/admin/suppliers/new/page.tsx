import { AdminShell } from "@/components/hotel-admin/AdminShell";
import { NewSupplierForm } from "@/components/suppliers/NewSupplierForm";
import { requireAdmin } from "@/lib/adminAuth";
export default async function NewSupplierPage() { await requireAdmin("/admin/suppliers/new"); return <AdminShell title="新建供应商候选" subtitle="先建主体，再补来源、许可证和业务能力"><NewSupplierForm/></AdminShell>; }

