import { AdminShell } from "@/components/hotel-admin/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { PricingAdmin } from "./ui";

export default async function AdminPricingPage(){await requireAdmin("/admin/pricing");const [rules,snapshots]=await Promise.all([prisma.estimateRule.findMany({orderBy:{updatedAt:"desc"},take:100}),prisma.marketPriceSnapshot.findMany({orderBy:{capturedAt:"desc"},take:100})]);return <AdminShell title="价格体系" subtitle="配置各业务预估规则，维护可追溯的公开市场价格快照"><PricingAdmin rules={rules.map(item=>({...item,validFrom:item.validFrom?.toISOString()||null,validTo:item.validTo?.toISOString()||null,createdAt:item.createdAt.toISOString(),updatedAt:item.updatedAt.toISOString()}))} snapshots={snapshots.map(item=>({...item,capturedAt:item.capturedAt.toISOString(),expiresAt:item.expiresAt?.toISOString()||null,createdAt:item.createdAt.toISOString()}))}/></AdminShell>}
