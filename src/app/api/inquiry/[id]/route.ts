import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeInquiryRequirements } from "@/lib/openai";
import { searchHotelPrices, type HotelPriceResult } from "@/lib/priceSearch";
import { inquiryUpdateSchema } from "@/lib/inquirySchemas";
import { enforceRateLimit } from "@/lib/rateLimit";
import { inquiryAccessWhere, inquiryNotFound } from "@/lib/security/inquiryAccess";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";

type Params = { params: Promise<{ id: string }> };

function isVerifiedPrice(result: HotelPriceResult): boolean {
  return result.confidence === "high" && /^https?:\/\//i.test(result.bookingUrl ?? "");
}

/** GET /api/inquiry/[id] — 获取询价单详情 */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const order = await prisma.inquiryOrder.findFirst({
      where: inquiryAccessWhere(req, id),
      include: {
        priceReferences: { orderBy: { pricePerNight: "asc" } },
        statusLogs: { orderBy: { createdAt: "asc" }, take: 20 },
      },
    });
    if (!order) return NextResponse.json(inquiryNotFound, { status: 404 });
    return NextResponse.json({ success: true, order });
  } catch (e) {
    console.error("[GET /api/inquiry/[id]]", e);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

/** PUT /api/inquiry/[id] — 更新需求字段 / 追问回答 */
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const originError = requireTrustedOrigin(req);
    if (originError) return originError;
    const limited = enforceRateLimit(req, "inquiry:update", { limit: 20, windowMs: 10 * 60_000 });
    if (limited) return limited;
    const json = await readLimitedJson(req, 32 * 1024);
    if (!json.ok) return json.response;
    const parsed = inquiryUpdateSchema.safeParse(json.data);
    if (!parsed.success) return validationError();
    const body = parsed.data;
    const {
      destination, checkInDate, checkOutDate, nights,
      roomCount, guestCount, budget, hotelPreference,
      breakfastIncluded, cancellable, needInvoice, notes,
      rawInput, // 用户回答追问的文字
    } = body;

    const existing = await prisma.inquiryOrder.findFirst({ where: inquiryAccessWhere(req, id) });
    if (!existing) return NextResponse.json(inquiryNotFound, { status: 404 });

    // 合并当前已有数据
    const currentData = {
      destination: destination ?? existing.destination,
      checkInDate: checkInDate ?? existing.checkInDate?.toISOString().slice(0, 10),
      checkOutDate: checkOutDate ?? existing.checkOutDate?.toISOString().slice(0, 10),
      nights: nights ?? existing.nights ?? undefined,
      roomCount: roomCount ?? existing.roomCount,
      guestCount: guestCount ?? existing.guestCount,
      budget: budget ?? existing.budget ?? undefined,
      hotelPreference: hotelPreference ?? existing.hotelPreference ?? undefined,
      breakfastIncluded: breakfastIncluded ?? existing.breakfastIncluded ?? undefined,
      cancellable: cancellable ?? existing.cancellable ?? undefined,
      needInvoice: needInvoice ?? existing.needInvoice,
      notes: notes ?? existing.notes ?? undefined,
    };

    // 重新跑 AI 分析
    const analysis = await analyzeInquiryRequirements({
      rawInput: rawInput ?? "",
      currentData,
    });

    const newStatus = analysis.isComplete ? "PRICE_REFERENCE_READY" : "AI_COLLECTING";
    const prevStatus = existing.status;

    const updated = await prisma.inquiryOrder.update({
      where: { id },
      data: {
        destination: analysis.structuredData.destination ?? currentData.destination,
        checkInDate: analysis.structuredData.checkInDate
          ? new Date(analysis.structuredData.checkInDate)
          : (currentData.checkInDate ? new Date(currentData.checkInDate) : null),
        checkOutDate: analysis.structuredData.checkOutDate
          ? new Date(analysis.structuredData.checkOutDate)
          : (currentData.checkOutDate ? new Date(currentData.checkOutDate) : null),
        nights: analysis.structuredData.nights ?? currentData.nights ?? null,
        roomCount: analysis.structuredData.roomCount ?? currentData.roomCount,
        guestCount: analysis.structuredData.guestCount ?? currentData.guestCount,
        budget: analysis.structuredData.budget ?? currentData.budget ?? null,
        hotelPreference: analysis.structuredData.hotelPreference ?? currentData.hotelPreference ?? null,
        breakfastIncluded: analysis.structuredData.breakfastIncluded ?? currentData.breakfastIncluded ?? null,
        cancellable: analysis.structuredData.cancellable ?? currentData.cancellable ?? null,
        needInvoice: analysis.structuredData.needInvoice ?? currentData.needInvoice,
        notes: currentData.notes ?? null,
        aiStructuredJson: JSON.stringify(analysis.structuredData),
        aiMissingFields: JSON.stringify(analysis.missingFields),
        aiFollowUpQuestion: analysis.followUpQuestion,
        status: newStatus,
      },
      include: { priceReferences: true },
    });

    // 状态变更日志
    if (prevStatus !== newStatus) {
      await prisma.inquiryOrderStatusLog.create({
        data: {
          orderId: id,
          fromStatus: prevStatus,
          toStatus: newStatus,
          remark: "用户补充信息后 AI 重新分析",
        },
      });
    }

    // 如果信息已完整，用 AI 真实查价
    if (analysis.isComplete) {
      const existingPrices = await prisma.inquiryPriceReference.count({ where: { orderId: id } });
      if (existingPrices === 0) {
        const dest = updated.destination ?? "";
        const nights = updated.nights ?? 1;
        try {
          const { results, errors } = await searchHotelPrices({
            destination: dest,
            checkInDate: updated.checkInDate?.toISOString().slice(0, 10) ?? "",
            checkOutDate: updated.checkOutDate?.toISOString().slice(0, 10) ?? "",
            nights,
            guestCount: updated.guestCount ?? 2,
            roomCount: updated.roomCount ?? 1,
            budget: updated.budget ?? undefined,
          });

          const verifiedResults = results.filter(isVerifiedPrice);

          if (verifiedResults.length > 0) {
            await prisma.inquiryPriceReference.createMany({
              data: verifiedResults.slice(0, 8).map((r) => ({
                orderId: id,
                platform: r.platform,
                hotelName: r.hotelName,
                roomType: r.roomType,
                pricePerNight: Math.round(r.pricePerNight * 100), // 存分
                totalPrice: Math.round(r.totalPrice * 100),
                breakfastIncluded: r.breakfastIncluded,
                cancellable: r.cancellable,
                sourceUrl: r.bookingUrl || null,
                isMock: false,
              })),
            });
          } else {
            if (errors.length) console.error("[priceSearch no verified source]", errors);
          }
        } catch (e) {
          console.error("[priceSearch error, no verified price saved]", e);
        }
      }
    }

    return NextResponse.json({ success: true, order: updated, analysis });
  } catch (e) {
    console.error("[PUT /api/inquiry/[id]]", e);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
