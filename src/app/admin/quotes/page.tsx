import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { AdminQuotesClient } from "./ui";

export default async function AdminQuotesPage() {
  await requireAdmin("/admin/quotes");
  const requirements = await prisma.requirement.findMany({ orderBy: { createdAt: "desc" }, include: { user: { select: { nickname: true, mobile: true, email: true } }, quotes: { orderBy: { createdAt: "desc" } } }, take: 100 });
  return <AdminQuotesClient requirements={requirements.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), quotes: r.quotes.map((q) => ({ ...q, createdAt: q.createdAt.toISOString(), updatedAt: q.updatedAt.toISOString(), expireAt: q.expireAt?.toISOString() || null })) }))} />;
}
