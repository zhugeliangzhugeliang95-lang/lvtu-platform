import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rateLimit";
import { verifiedSupplierSearchSchema } from "@/lib/supplierSchemas";
import { findSuppliersByRequirement } from "@/lib/supplierService";
import { requireAdminApi } from "@/lib/adminAuth";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const limited = enforceRateLimit(request, "ai-suppliers", { limit: 30, windowMs: 60000 });
  if (limited) return limited;
  const parsed = verifiedSupplierSearchSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message }, { status: 400 });
  const items = await findSuppliersByRequirement(parsed.data);
  return NextResponse.json({ items, policy: { verifiedOnly: true, pricesIncluded: false, inventoryIncluded: false, requiresHumanConfirmation: true } });
}
