import { AdminShell } from "@/components/hotel-admin/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { MembershipsClient } from "./ui";
export default async function AdminMembershipsPage() { await requireAdmin("/admin/memberships"); return <AdminShell title="会员管理" subtitle="按手机号查询会员有效期与状态"><MembershipsClient /></AdminShell>; }
