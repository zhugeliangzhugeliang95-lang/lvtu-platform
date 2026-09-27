import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQuoteMessage } from "@/lib/openai";
import { requireAdminApi } from "@/lib/adminAuth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { requireTrustedOrigin } from "@/lib/security/request";

// POST /api/robot/leads/[id]/quote
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const limited = enforceRateLimit(req, "admin:robot-lead-quote", { limit: 20, windowMs: 10 * 60_000, identity: auth.session.adminId });
  if (limited) return limited;
  const { id } = await params;

  const lead = await prisma.robotLead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const { hotelName, hotelPrice, roomType, totalPrice, includes, notes } = body;

  // 调用 OpenAI 生成报价话术
  let quoteMessage: string | null = null;
  try {
    quoteMessage = await generateQuoteMessage({
      name: lead.name,
      destination: lead.destination,
      travelDate: lead.travelDate ?? undefined,
      peopleCount: lead.peopleCount,
      hotelName,
      hotelPrice,
      roomType,
      totalPrice,
      includes,
      notes,
    });
  } catch (err) {
    console.error("[robot/leads/quote] OpenAI error:", err);
  }

  // 更新线索状态为 QUOTED
  await prisma.robotLead.update({
    where: { id },
    data: { status: "QUOTED" },
  });

  // 自动创建 send_quote_message 任务
  await prisma.robotTask.create({
    data: {
      leadId: id,
      taskType: "send_quote_message",
      status: "pending",
      payloadJson: JSON.stringify({
        message: quoteMessage,
        quoteDetails: { hotelName, hotelPrice, roomType, totalPrice, includes, notes },
      }),
    },
  });

  return NextResponse.json({ ok: true, quoteMessage });
}
