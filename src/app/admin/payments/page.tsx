import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { PaymentReview } from "./ui";
export default async function AdminPaymentsPage() {
  await requireAdmin("/admin/payments");
  const payments = await prisma.payment.findMany({
    where: { status: "SUBMITTED" },
    orderBy: { createdAt: "asc" },
    include: { order: { select: { orderNo: true, productName: true, amount: true, userId: true } } },
  });
  return <PaymentReview payments={payments.map((p) => ({ ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(), reviewedAt: p.reviewedAt?.toISOString() || null }))} />;
}
