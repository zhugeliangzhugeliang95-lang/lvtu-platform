import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/adminAuth";

export default async function LegacyAdminPathPage() {
  await requireAdmin("/admin/hotel");
  redirect("/admin/hotel");
}
