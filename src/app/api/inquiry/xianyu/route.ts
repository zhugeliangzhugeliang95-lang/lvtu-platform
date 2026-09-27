import { NextRequest, NextResponse } from "next/server";
import type { XianYuTaskStatus } from "@prisma/client";
import { requireAdminApi } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rateLimit";
import { inquiryAccessWhere, inquiryNotFound } from "@/lib/security/inquiryAccess";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";

const createTaskSchema = z.object({
  inquiryId: z.string().min(8).max(80),
  hotelName: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(80),
  roomType: z.string().trim().max(120).optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nights: z.number().int().min(1).max(90),
  guestCount: z.number().int().min(1).max(100).optional().default(2),
  roomCount: z.number().int().min(1).max(20).optional().default(1),
}).strict();

type TaskListItem = {
  id: string;
  inquiryId: string;
  hotelName: string;
  city: string;
  roomType: string | null;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestCount: number;
  roomCount: number;
  status: XianYuTaskStatus;
  sentCount: number;
  aiSummary: string | null;
  createdAt: Date;
  updatedAt: Date;
  quoteCount: number;
  messageCount: number;
  minPricePerNight: number | null;
  minTotalPrice: number | null;
  lvyoutongPrice: number | null;
};

function parseLvyoutongPrice(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      minPricePerNight?: unknown;
      priceRange?: { min?: unknown };
      lvyoutongPrice?: unknown;
    };
    if (typeof parsed.minPricePerNight === "number") return parsed.minPricePerNight;
    if (typeof parsed.priceRange?.min === "number") return parsed.priceRange.min;
    return typeof parsed.lvyoutongPrice === "number" ? parsed.lvyoutongPrice : null;
  } catch {
    return null;
  }
}

// GET /api/inquiry/xianyu
// 后台调用：返回闲鱼询价任务列表
export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const allowedStatuses: XianYuTaskStatus[] = [
      "PENDING",
      "SEARCHING",
      "MESSAGING",
      "WAITING_REPLIES",
      "AUTO_FOLLOWUP",
      "COLLECTING",
      "AI_ANALYZING",
      "QUOTED",
      "WAITING_HUMAN_CONFIRM",
      "NEEDS_HUMAN",
      "FAILED",
    ];
    const whereStatus =
      status && allowedStatuses.includes(status as XianYuTaskStatus)
        ? (status as XianYuTaskStatus)
        : undefined;

    const tasks = await prisma.xianYuTask.findMany({
      where: whereStatus ? { status: whereStatus } : undefined,
      include: {
        _count: { select: { messages: true, quotes: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const taskIds = tasks.map((task) => task.id);
    const lowestQuotes =
      taskIds.length > 0
        ? await prisma.xianYuQuote.groupBy({
            by: ["taskId"],
            _min: { pricePerNight: true, totalPrice: true },
            where: { taskId: { in: taskIds }, pricePerNight: { gt: 0 } },
          })
        : [];
    const lowestMap = new Map(lowestQuotes.map((quote) => [quote.taskId, quote._min]));

    const items: TaskListItem[] = tasks.map((task) => {
      const lowest = lowestMap.get(task.id);
      return {
        id: task.id,
        inquiryId: task.inquiryId,
        hotelName: task.hotelName,
        city: task.city,
        roomType: task.roomType,
        checkInDate: task.checkInDate,
        checkOutDate: task.checkOutDate,
        nights: task.nights,
        guestCount: task.guestCount,
        roomCount: task.roomCount,
        status: task.status,
        sentCount: task.sentCount,
        aiSummary: task.aiSummary,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        quoteCount: task._count.quotes,
        messageCount: task._count.messages,
        minPricePerNight: lowest?.pricePerNight ?? null,
        minTotalPrice: lowest?.totalPrice ?? null,
        lvyoutongPrice: parseLvyoutongPrice(task.aiSummary),
      };
    });

    return NextResponse.json({ items });
  } catch (e) {
    console.error("[xianyu] list tasks error:", e);
    return NextResponse.json({ error: "服务异常" }, { status: 500 });
  }
}

// POST /api/inquiry/xianyu
// 前台调用：根据询价单创建闲鱼询价任务
export async function POST(req: NextRequest) {
  try {
    const originError = requireTrustedOrigin(req);
    if (originError) return originError;
    const limited = enforceRateLimit(req, "inquiry:xianyu-create", { limit: 5, windowMs: 10 * 60_000 });
    if (limited) return limited;
    const json = await readLimitedJson(req, 16 * 1024);
    if (!json.ok) return json.response;
    const parsed = createTaskSchema.safeParse(json.data);
    if (!parsed.success) return validationError();
    const body = parsed.data;
    const {
      inquiryId,
      hotelName,
      city,
      roomType,
      checkInDate,
      checkOutDate,
      nights,
      guestCount = 2,
      roomCount = 1,
    } = body;

    const inquiry = await prisma.inquiryOrder.findFirst({ where: inquiryAccessWhere(req, inquiryId), select: { id: true } });
    if (!inquiry) return NextResponse.json(inquiryNotFound, { status: 404 });

    // 同一询价单不重复创建
    const existing = await prisma.xianYuTask.findFirst({
      where: {
        inquiryId,
        status: { not: "FAILED" },
      },
    });
    if (existing) {
      return NextResponse.json({ taskId: existing.id, existed: true });
    }

    const task = await prisma.xianYuTask.create({
      data: {
        inquiryId,
        hotelName,
        city,
        roomType: roomType || null,
        checkInDate,
        checkOutDate,
        nights,
        guestCount,
        roomCount,
        status: "PENDING",
      },
    });

    return NextResponse.json({ taskId: task.id });
  } catch (e) {
    console.error("[xianyu] create task error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "服务异常" },
      { status: 500 }
    );
  }
}
