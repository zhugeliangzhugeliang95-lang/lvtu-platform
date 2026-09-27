import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSupplierBotApi } from "@/lib/supplierBotAuth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { readLimitedJson } from "@/lib/security/request";

// POST /api/robot/tasks/update
// body: { id: string, status: "done" | "failed" }
export async function POST(req: NextRequest) {
  const auth = requireSupplierBotApi(req);
  if (!auth.ok) return auth.response;
  const limited = enforceRateLimit(req, "worker:robot-task-update", { limit: 120, windowMs: 60_000, identity: "supplier-worker" });
  if (limited) return limited;
  const parsed = await readLimitedJson(req, 4 * 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as { id?: unknown; status?: unknown } | null;
  if (!body || typeof body.id !== "string" || !body.id || typeof body.status !== "string" || !body.status) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const { id, status } = body;
  if (status !== "done" && status !== "failed") {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  }

  const task = await prisma.robotTask.update({
    where: { id },
    data: {
      status,
      doneAt: status === "done" ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true, task });
}
