import { AdminShell } from "@/components/hotel-admin/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { NewTourForm } from "./NewTourForm";

export default async function NewTourPage() {
  await requireAdmin("/admin/tours/new");
  return (
    <AdminShell title="新建旅行团" subtitle="先保存基础产品，再维护独立班期和每日行程。">
      <NewTourForm />
    </AdminShell>
  );
}
