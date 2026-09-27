import { AdminShell } from "@/components/hotel-admin/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { MembershipSettingsClient } from "./ui";
export default async function AdminMembershipSettingsPage() { await requireAdmin("/admin/settings/membership"); return <AdminShell title="会员配置" subtitle="配置会员价格、有效天数和付款说明"><MembershipSettingsClient /></AdminShell>; }
