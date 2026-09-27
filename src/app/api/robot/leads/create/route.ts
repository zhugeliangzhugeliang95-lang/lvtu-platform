import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateFriendRequestNote, generateOpeningMessage } from "@/lib/openai";
import { requireAdminApi } from "@/lib/adminAuth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { requireTrustedOrigin } from "@/lib/security/request";

// POST /api/robot/leads/create
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const limited = enforceRateLimit(req, "admin:robot-lead-create", { limit: 10, windowMs: 10 * 60_000, identity: auth.session.adminId });
  if (limited) return limited;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const { name, wechat, destination, travelDate, peopleCount, budget, notes } = body;

  if (!name || !wechat || !destination) {
    return NextResponse.json(
      { error: "MISSING_FIELDS", message: "name、wechat、destination 为必填项" },
      { status: 400 }
    );
  }

  const count = typeof peopleCount === "number" ? peopleCount : parseInt(peopleCount ?? "1", 10) || 1;

  // 调用 OpenAI 生成加好友备注和开场白（失败不阻断主流程）
  let aiRequestNote: string | null = null;
  let aiOpening: string | null = null;

  try {
    [aiRequestNote, aiOpening] = await Promise.all([
      generateFriendRequestNote({ name, destination, travelDate, peopleCount: count }),
      generateOpeningMessage({ name, destination, travelDate, peopleCount: count, budget, notes }),
    ]);
  } catch (err) {
    console.error("[robot/leads/create] OpenAI error:", err);
  }

  const lead = await prisma.robotLead.create({
    data: {
      name,
      wechat,
      destination,
      travelDate: travelDate ?? null,
      peopleCount: count,
      budget: budget ?? null,
      notes: notes ?? null,
      aiRequestNote,
      aiOpening,
      status: "NEW",
    },
  });

  // 自动创建 add_friend 任务
  await prisma.robotTask.create({
    data: {
      leadId: lead.id,
      taskType: "add_friend",
      status: "pending",
      payloadJson: JSON.stringify({ aiRequestNote }),
    },
  });

  return NextResponse.json({ ok: true, id: lead.id });
}
