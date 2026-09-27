import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/adminAuth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { requireTrustedOrigin } from "@/lib/security/request";

// POST /api/robot/leads/[id]/mark-friend-accepted
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const limited = enforceRateLimit(req, "admin:robot-lead-accepted", { limit: 30, windowMs: 10 * 60_000, identity: auth.session.adminId });
  if (limited) return limited;
  const { id } = await params;

  const lead = await prisma.robotLead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // 更新线索状态
  await prisma.robotLead.update({
    where: { id },
    data: { status: "FRIEND_ACCEPTED" },
  });

  // 自动创建 send_opening_message 任务，payload 放 ai_opening
  await prisma.robotTask.create({
    data: {
      leadId: id,
      taskType: "send_opening_message",
      status: "pending",
      payloadJson: JSON.stringify({ message: lead.aiOpening }),
    },
  });

  return NextResponse.json({ ok: true });
}
