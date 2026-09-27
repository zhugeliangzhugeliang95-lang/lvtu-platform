import { AdminShell } from "@/components/hotel-admin/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { MembershipPaymentsClient } from "./ui";

export default async function AdminMembershipPaymentsPage() { await requireAdmin("/admin/membership-payments"); return <AdminShell title="会员付款审核" subtitle="人工确认到账后，会员才会正式开通或续期"><MembershipPaymentsClient /></AdminShell>; }
