import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeInquiryRequirements } from "@/lib/openai";
import { InquiryOrderStatus } from "@prisma/client";
import { searchHotelPrices, type HotelPriceResult } from "@/lib/priceSearch";
import { createGuestInquiryCookieValue, getUserIdFromCookie, guestInquiryCookie, parseGuestInquiryIds } from "@/lib/userAuth";
import { inquiryCreateSchema } from "@/lib/inquirySchemas";
import { enforceRateLimit, getHashedClientIp } from "@/lib/rateLimit";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";
import { withIdempotency } from "@/lib/security/idempotency";
import crypto from "crypto";

function isVerifiedPrice(result: HotelPriceResult): boolean {
  return result.confidence === "high" && /^https?:\/\//i.test(result.bookingUrl ?? "");
}

/** 只保存带可核验来源链接的公开平台价格。 */
async function generatePriceReferences(
  orderId: string,
  destination: string,
  nights: number,
  checkInDate: string,
  checkOutDate: string,
  guestCount: number,
  roomCount: number,
  budget?: string | null,
) {
  try {
    const { results, errors } = await searchHotelPrices({
      destination, checkInDate, checkOutDate, nights, guestCount, roomCount,
      budget: budget ?? undefined,
    });

    const verifiedResults = results.filter(isVerifiedPrice);

    if (verifiedResults.length > 0) {
      await prisma.inquiryPriceReference.createMany({
        data: verifiedResults.slice(0, 8).map((r) => ({
          orderId,
          platform: r.platform,
          hotelName: r.hotelName,
          roomType: r.roomType,
          pricePerNight: Math.round(r.pricePerNight * 100),
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

function generateOrderNo(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `IQ${ts}${rand}`;
}

/** POST /api/inquiry — 创建询价单，触发 AI 分析 */
export async function POST(req: NextRequest) {
  try {
    const originError = requireTrustedOrigin(req);
    if (originError) return originError;
    const userId = await getUserIdFromCookie();
    const limited = enforceRateLimit(req, "inquiry:create", { limit: 10, windowMs: 10 * 60_000, identity: userId ?? undefined });
    if (limited) return limited;
    const json = await readLimitedJson(req, 32 * 1024);
    if (!json.ok) return json.response;
    const parsed = inquiryCreateSchema.safeParse(json.data);
    if (!parsed.success) return validationError();
    const body = parsed.data;

    const {
      destination,
      checkInDate,
      checkOutDate,
      nights,
      roomCount,
      guestCount,
      budget,
      hotelPreference,
      breakfastIncluded,
      cancellable,
      needInvoice,
      notes,
      rawInput, // 用户自由文本
    } = body;

    // 创建询价单（先 NEW 状态）
    const rawIdempotencyKey = req.headers.get("idempotency-key")?.trim();
    const validIdempotencyKey = rawIdempotencyKey && /^[A-Za-z0-9._:-]{8,128}$/.test(rawIdempotencyKey) ? rawIdempotencyKey : crypto.randomUUID();
    let createdFresh = false;
    const actor = userId ?? getHashedClientIp(req);
    const order = await withIdempotency(`inquiry:${actor}:${validIdempotencyKey}`, async () => {
      createdFresh = true;
      return prisma.inquiryOrder.create({
      data: {
        userId,
        orderNo: generateOrderNo(),
        destination,
        checkInDate: checkInDate ? new Date(checkInDate) : null,
        checkOutDate: checkOutDate ? new Date(checkOutDate) : null,
        nights: nights ? Number(nights) : null,
        roomCount: roomCount ? Number(roomCount) : 1,
        guestCount: guestCount ? Number(guestCount) : 2,
        budget: budget ?? null,
        hotelPreference: hotelPreference ?? null,
        breakfastIncluded: breakfastIncluded ?? null,
        cancellable: cancellable ?? null,
        needInvoice: needInvoice ?? false,
        notes: notes ?? null,
        source: "移动询价",
        userAgent: req.headers.get("user-agent") ?? undefined,
        ip: getHashedClientIp(req),
        status: "NEW",
        },
      });
    });

    // 触发 AI 分析（非阻塞 — 立即返回订单，后台更新）
    if (createdFresh) void (async () => {
      try {
        // 如果没有 OpenAI key 或 API 不可用，直接跳过 AI，用本地规则判断信息完整性
        const hasApiKey = !!process.env.OPENAI_API_KEY;

        let newStatus: InquiryOrderStatus;
        let followUpQuestion: string | null = null;
        let structuredDest = destination as string;
        let structuredNights = nights ? Number(nights) : null;
        let structuredRoomCount = roomCount ? Number(roomCount) : 1;
        let structuredGuestCount = guestCount ? Number(guestCount) : 2;

        if (hasApiKey) {
          try {
            const analysis = await analyzeInquiryRequirements({
              rawInput: rawInput ?? notes ?? "",
              currentData: {
                destination,
                checkInDate,
                checkOutDate,
                nights: nights ? Number(nights) : undefined,
                roomCount: roomCount ? Number(roomCount) : undefined,
                guestCount: guestCount ? Number(guestCount) : undefined,
                budget: budget ?? undefined,
                hotelPreference: hotelPreference ?? undefined,
                breakfastIncluded: breakfastIncluded ?? undefined,
                cancellable: cancellable ?? undefined,
                needInvoice,
                notes: notes ?? undefined,
              },
            });
            newStatus = analysis.isComplete ? InquiryOrderStatus.PRICE_REFERENCE_READY : InquiryOrderStatus.AI_COLLECTING;
            followUpQuestion = analysis.followUpQuestion;
            structuredDest = analysis.structuredData.destination ?? destination ?? "";
            structuredNights = analysis.structuredData.nights ?? structuredNights;
            structuredRoomCount = analysis.structuredData.roomCount ?? structuredRoomCount;
            structuredGuestCount = analysis.structuredData.guestCount ?? structuredGuestCount;

            await prisma.inquiryOrder.update({
              where: { id: order.id },
              data: {
                aiStructuredJson: JSON.stringify(analysis.structuredData),
                aiMissingFields: JSON.stringify(analysis.missingFields),
                aiFollowUpQuestion: analysis.followUpQuestion,
                status: newStatus,
                destination: structuredDest,
                checkInDate: analysis.structuredData.checkInDate
                  ? new Date(analysis.structuredData.checkInDate)
                  : (checkInDate ? new Date(checkInDate) : null),
                checkOutDate: analysis.structuredData.checkOutDate
                  ? new Date(analysis.structuredData.checkOutDate)
                  : (checkOutDate ? new Date(checkOutDate) : null),
                nights: structuredNights,
                roomCount: structuredRoomCount,
                guestCount: structuredGuestCount,
                budget: analysis.structuredData.budget ?? budget ?? null,
                hotelPreference: analysis.structuredData.hotelPreference ?? hotelPreference ?? null,
              },
            });
          } catch (aiErr) {
            // AI 调用失败（quota、网络等），降级到本地规则
            console.error("[inquiry AI error, falling back to local]", aiErr);
            const isComplete = !!(destination && checkInDate && checkOutDate && guestCount);
            newStatus = isComplete ? InquiryOrderStatus.PRICE_REFERENCE_READY : InquiryOrderStatus.AI_COLLECTING;
            followUpQuestion = isComplete ? null : "请问您想去哪个城市？大概什么时间入住，住几晚，几位旅客？";
            await prisma.inquiryOrder.update({
              where: { id: order.id },
              data: { aiFollowUpQuestion: followUpQuestion, status: newStatus },
            });
          }
        } else {
          // 无 API key：本地判断信息完整性（destination + 日期 + guestCount 都有即为完整）
          const isComplete = !!(destination && checkInDate && checkOutDate && guestCount);
          newStatus = isComplete ? InquiryOrderStatus.PRICE_REFERENCE_READY : InquiryOrderStatus.AI_COLLECTING;
          followUpQuestion = isComplete ? null : "请问您想去哪个城市？大概什么时间入住，住几晚，几位旅客？";

          await prisma.inquiryOrder.update({
            where: { id: order.id },
            data: {
              aiFollowUpQuestion: followUpQuestion,
              status: newStatus,
            },
          });
        }

        // 记录状态变更
        await prisma.inquiryOrderStatusLog.create({
          data: {
            orderId: order.id,
            fromStatus: "NEW",
            toStatus: newStatus,
            remark: hasApiKey ? "AI 初始分析完成" : "本地规则判断完成",
          },
        });

        // 信息完整时立即生成价格参考
        if (newStatus === InquiryOrderStatus.PRICE_REFERENCE_READY) {
          const priceCount = await prisma.inquiryPriceReference.count({ where: { orderId: order.id } });
          if (priceCount === 0) {
            await generatePriceReferences(
              order.id,
              structuredDest ?? "",
              structuredNights ?? 1,
              checkInDate ?? "",
              checkOutDate ?? "",
              structuredGuestCount,
              structuredRoomCount,
              budget,
            );
          }
        }
      } catch (e) {
        console.error("[inquiry AI analyze error]", e);
        // 即使 catch，也尝试用本地规则兜底，保证状态和价格生成
        try {
          const isComplete = !!(destination && checkInDate && checkOutDate && guestCount);
          const fallbackStatus = isComplete ? InquiryOrderStatus.PRICE_REFERENCE_READY : InquiryOrderStatus.AI_COLLECTING;
          await prisma.inquiryOrder.update({
            where: { id: order.id },
            data: { status: fallbackStatus },
          });
          if (isComplete) {
            const priceCount = await prisma.inquiryPriceReference.count({ where: { orderId: order.id } });
            if (priceCount === 0) {
              await generatePriceReferences(
                order.id,
                destination ?? "",
                nights ? Number(nights) : 1,
                checkInDate ?? "",
                checkOutDate ?? "",
                guestCount ? Number(guestCount) : 2,
                roomCount ? Number(roomCount) : 1,
                budget,
              );
            }
          }
        } catch {}
      }
    })();

    const existingGuestIds = parseGuestInquiryIds(req.cookies.get(guestInquiryCookie.name)?.value);
    const res = NextResponse.json({ success: true, orderId: order.id, orderNo: order.orderNo });
    if (!userId) {
      res.cookies.set(guestInquiryCookie.name, createGuestInquiryCookieValue([...existingGuestIds, order.id]), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: guestInquiryCookie.maxAge,
      });
    }
    return res;
  } catch (e) {
    console.error("[POST /api/inquiry]", e);
    return NextResponse.json({ error: "创建询价单失败" }, { status: 500 });
  }
}
