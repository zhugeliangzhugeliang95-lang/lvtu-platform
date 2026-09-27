import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchHotelPrices, type HotelPriceResult } from "@/lib/priceSearch";
import { getUserIdFromCookie } from "@/lib/userAuth";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rateLimit";
import { INTERNAL_ESTIMATE_NOTICE, presentPriceResult } from "@/lib/security/priceTrust";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";
import { calculatePublicPriceEstimate } from "@/lib/pricing/public-price-estimate";

const priceCompareSchema = z.object({
  searchType: z.enum(["hotel", "project", "transport"]).optional().default("hotel"),
  hotelName: z.string().trim().min(1).max(120),
  roomType: z.string().trim().max(120).optional(),
  projectType: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  transportType: z.string().trim().max(80).optional(),
  fromCity: z.string().trim().max(80).optional(),
  toCity: z.string().trim().max(80).optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nights: z.number().int().min(1).max(90),
  guestCount: z.number().int().min(1).max(100).optional().default(2),
  roomCount: z.number().int().min(1).max(20).optional().default(1),
  publicReferencePrice: z.number().min(1).max(50_000_000).optional(),
}).strict();

interface RoomType {
  name?: string;
  price?: number;
  size?: string;
}

const DISPLAY_PLATFORMS = ["美团", "携程", "飞猪", "去哪儿", "同程"];
const PROJECT_PLATFORMS = ["美团", "携程", "飞猪", "去哪儿", "大众点评"];
const FLIGHT_PLATFORMS = ["携程", "飞猪", "去哪儿", "同程", "航司官网"];
const RAIL_PLATFORMS = ["12306", "携程", "飞猪", "去哪儿", "同程"];

const PLATFORM_DISPLAY_FACTOR: Record<string, number> = {
  去哪儿: 0.98,
  美团: 1,
  飞猪: 1.02,
  携程: 1.04,
  同程: 1.06,
};

const UPGRADE_ROOM_WORDS = [
  "豪华", "景观", "园景", "花园", "湖景", "城堡", "行政", "套房", "尊享", "俱乐部",
];

const BASIC_ROOM_WORDS = ["标准", "基础", "普通", "入门", "大床", "双床"];

function getTransportPlatforms(transportType: string | undefined): string[] {
  return transportType?.includes("机票") ? FLIGHT_PLATFORMS : RAIL_PLATFORMS;
}

function parseRoomTypes(value: unknown): RoomType[] {
  try {
    if (typeof value === "string") return JSON.parse(value) as RoomType[];
    return Array.isArray(value) ? (value as RoomType[]) : [];
  } catch {
    return [];
  }
}

function normalizeYuan(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return amount > 10000 ? Math.round(amount / 100) : Math.round(amount);
}

function inferMarketBasePrice(hotelName: string, roomType: string | undefined, checkInDate: string | undefined): number {
  const text = `${hotelName} ${roomType ?? ""}`;
  let base = 460;

  if (/悦榕|悦椿|安缦|柏悦|丽思|瑰丽|瑞吉|文华东方|四季|华尔道夫|宝格丽|康莱德/.test(text)) base = 1050;
  else if (/凯悦|君悦|威斯汀|万豪|喜来登|洲际|英迪格|皇冠假日|希尔顿|费尔蒙|索菲特|W酒店|艾迪逊/.test(text)) base = 780;
  else if (/度假|海景|湾|温泉|别墅|城堡|乐园|迪士尼|长隆|横琴|三亚|亚龙湾|海棠湾/.test(text)) base = 680;
  else if (/智选|欢朋|亚朵|全季|桔子|美居|假日|诺富特|雅高|万怡/.test(text)) base = 430;
  else if (/如家|汉庭|锦江|维也纳|城市便捷|格林豪泰|7天/.test(text)) base = 260;

  if (/海景|湖景|江景|景观|阳台/.test(text)) base *= 1.28;
  if (/套房|亲子|行政|俱乐部|尊享|豪华/.test(text)) base *= 1.32;
  if (/别墅|泳池/.test(text)) base *= 1.75;

  const date = checkInDate ? new Date(checkInDate) : null;
  if (date && !Number.isNaN(date.getTime())) {
    const day = date.getDay();
    const month = date.getMonth() + 1;
    if (day === 5 || day === 6) base *= 1.16;
    if ([1, 2, 7, 8].includes(month)) base *= 1.12;
  }

  return Math.max(180, Math.round(base));
}

function normalizeText(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, "").toLowerCase();
}

function isBasicRoomRequest(roomType: string | undefined): boolean {
  const text = normalizeText(roomType);
  return !text || BASIC_ROOM_WORDS.some((word) => text.includes(word));
}

function isRoomTypeCompatible(requested: string | undefined, actual: string): boolean {
  const req = normalizeText(requested);
  const act = normalizeText(actual);
  if (!req || !act) return true;
  if (act.includes(req) || req.includes(act)) return true;
  return req
    .replace(/房|间|型/g, "")
    .split(/[、,，/]/)
    .filter(Boolean)
    .some((part) => part.length >= 2 && act.includes(part));
}

function isUpgradedRoom(actual: string): boolean {
  const text = normalizeText(actual);
  return UPGRADE_ROOM_WORDS.some((word) => text.includes(word));
}

function calibrateRoomTypeResults(
  results: HotelPriceResult[],
  requestedRoomType: string | undefined,
  nights: number,
  roomCount: number,
): { results: HotelPriceResult[]; adjusted: boolean } {
  if (!requestedRoomType?.trim()) return { results, adjusted: false };
  const normalizedNights = Math.max(nights || 1, 1);
  const normalizedRooms = Math.max(roomCount || 1, 1);
  let adjusted = false;

  const calibrated = results.map((item) => {
    if (isRoomTypeCompatible(requestedRoomType, item.roomType)) return item;

    const factor = isBasicRoomRequest(requestedRoomType) && isUpgradedRoom(item.roomType)
      ? 0.4
      : 0.76;
    const currentPerNight = item.pricePerNight > 0
      ? item.pricePerNight
      : Math.max(1, Math.round(item.totalPrice / normalizedNights));
    const pricePerNight = Math.max(180, Math.round(currentPerNight * factor));
    adjusted = true;

    return {
      ...item,
      roomType: requestedRoomType,
      pricePerNight,
      totalPrice: pricePerNight * normalizedNights * normalizedRooms,
      bookingUrl: "",
      source: "AI房型校准",
      confidence: "estimated" as const,
    };
  });

  return { results: calibrated, adjusted };
}

async function generateFallbackResults(
  hotelName: string,
  roomType: string | undefined,
  nights: number,
  roomCount: number,
  checkInDate: string | undefined,
): Promise<HotelPriceResult[]> {
  const keyword = hotelName.trim();
  const hotels = await prisma.hotel.findMany({
    where: {
      OR: [
        { name: { contains: keyword } },
        { city: { contains: keyword } },
      ],
    },
    select: { name: true, priceStart: true, roomTypes: true },
    take: 4,
  });

  const inferredBase = inferMarketBasePrice(hotelName, roomType, checkInDate);
  const unitCount = Math.max(nights, 1) * Math.max(roomCount, 1);

  return DISPLAY_PLATFORMS.map((platform, i) => {
    const hotel = hotels[i % Math.max(hotels.length, 1)];
    const rooms = parseRoomTypes(hotel?.roomTypes);
    const room = rooms[i % Math.max(rooms.length, 1)];
    const base = normalizeYuan(room?.price) || normalizeYuan(hotel?.priceStart) || inferredBase;
    const factor = [0.94, 1, 1.06, 1.12, 1.18][i] ?? (1 + i * 0.05);
    const pricePerNight = Math.max(180, Math.round(base * factor));
    return {
      platform,
      hotelName: hotel?.name ?? keyword,
      roomType: roomType || room?.name || ["标准大床房", "高级双床房", "豪华大床房", "亲子房"][i],
      pricePerNight,
      totalPrice: pricePerNight * unitCount,
      breakfastIncluded: i % 2 === 0,
      cancellable: i !== 1,
      bookingUrl: "",
      source: "本地参考",
      confidence: "low",
    };
  });
}

function generateProjectFallbackResults(
  projectName: string,
  projectType: string | undefined,
  city: string | undefined,
  guestCount: number,
): HotelPriceResult[] {
  const type = projectType || "项目";
  const baseByType: Record<string, number> = {
    门票: 168,
    乐园: 399,
    当地玩乐: 258,
    演出: 288,
    接送: 188,
    一日游: 338,
  };
  const base = baseByType[type] ?? 228;
  const people = Math.max(guestCount || 1, 1);

  return PROJECT_PLATFORMS.map((platform, i) => {
    const pricePerNight = Math.max(50, Math.round(base * (0.94 + i * 0.035)));
    return {
      platform,
      hotelName: projectName.trim(),
      roomType: `${city ? `${city} · ` : ""}${type}参考套餐`,
      pricePerNight,
      totalPrice: pricePerNight * people,
      breakfastIncluded: false,
      cancellable: i !== 2,
      bookingUrl: "",
      source: "平台浮动参考",
      confidence: "estimated" as const,
    };
  });
}

function generateTransportFallbackResults(
  routeName: string,
  transportType: string | undefined,
  fromCity: string | undefined,
  toCity: string | undefined,
  guestCount: number,
): HotelPriceResult[] {
  const type = transportType || "高铁/火车";
  const base = type.includes("机票") ? 720 : type.includes("高铁") || type.includes("火车") ? 260 : 420;
  const people = Math.max(guestCount || 1, 1);

  return getTransportPlatforms(transportType).map((platform, i) => {
    const pricePerNight = Math.max(30, Math.round(base * (0.96 + i * 0.03)));
    return {
      platform,
      hotelName: routeName.trim(),
      roomType: `${fromCity || "出发地"} → ${toCity || "目的地"} · ${type}参考价`,
      pricePerNight,
      totalPrice: pricePerNight * people,
      breakfastIncluded: false,
      cancellable: false,
      bookingUrl: "",
      source: "平台浮动参考",
      confidence: "estimated" as const,
    };
  });
}

function pickLowestByPlatform(results: HotelPriceResult[]): HotelPriceResult[] {
  const map = new Map<string, HotelPriceResult>();
  for (const item of results) {
    const existing = map.get(item.platform);
    if (!existing || item.totalPrice < existing.totalPrice) {
      map.set(item.platform, item);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.totalPrice - b.totalPrice);
}

function roundToTen(value: number) {
  return Math.max(0, Math.round(value / 10) * 10);
}

function calculateTravelEstimate(results: Array<{ totalPrice: number }>) {
  const prices = results
    .map((item) => Number(item.totalPrice))
    .filter((price) => Number.isFinite(price) && price > 0)
    .sort((left, right) => left - right);
  if (!prices.length) return null;
  const middle = Math.floor(prices.length / 2);
  const marketReferencePrice = prices.length % 2
    ? prices[middle]
    : Math.round((prices[middle - 1] + prices[middle]) / 2);
  const estimatedMinPrice = roundToTen(marketReferencePrice * 0.7);
  const estimatedMaxPrice = roundToTen(marketReferencePrice * 0.8);
  return {
    marketReferencePrice,
    estimatedMinPrice,
    estimatedMaxPrice,
    savingsMin: Math.max(0, marketReferencePrice - estimatedMaxPrice),
    savingsMax: Math.max(0, marketReferencePrice - estimatedMinPrice),
    factorRange: "70%～80%",
    sampleSize: prices.length,
  };
}

function hasVerifiedSource(item: HotelPriceResult): boolean {
  return item.confidence === "high" && /^https?:\/\//i.test(item.bookingUrl ?? "");
}

function buildVerifiedPlatformResults(
  results: HotelPriceResult[],
  hotelName: string,
  roomType: string | undefined,
  searchType: "hotel" | "project" | "transport",
): HotelPriceResult[] {
  return pickLowestByPlatform(results.filter(hasVerifiedSource)).map((item) => ({
    ...item,
    hotelName: item.hotelName || hotelName.trim(),
    roomType: item.roomType || roomType || (searchType === "hotel" ? "可核验房型" : searchType === "transport" ? "可核验舱位/席别" : "可核验票种/套餐"),
  }));
}

function buildPlatformResultsFromAI(
  results: HotelPriceResult[],
  hotelName: string,
  roomType: string | undefined,
  nights: number,
  roomCount: number,
  usedFallback: boolean,
  searchType: "hotel" | "project" | "transport",
  guestCount: number,
  transportType?: string,
): HotelPriceResult[] {
  const normalizedNights = Math.max(nights || 1, 1);
  const floatingPlatforms = searchType === "transport"
    ? getTransportPlatforms(transportType)
    : searchType === "project"
    ? PROJECT_PLATFORMS
    : DISPLAY_PLATFORMS;
  const unitCount = searchType === "hotel" ? normalizedNights * Math.max(roomCount || 1, 1) : Math.max(guestCount || 1, 1);
  const actualRows = pickLowestByPlatform(results).map((item) => ({
    ...item,
    hotelName: item.hotelName || hotelName.trim(),
    roomType: item.roomType || roomType || (searchType === "hotel" ? "标准房" : searchType === "transport" ? "舱位/席别参考" : "项目票/套餐"),
    source: usedFallback ? "平台参考价" : "平台参考价",
  }));
  const anchor = actualRows[0];
  if (!anchor) return [];

  const basePerNight = anchor.pricePerNight > 0
    ? anchor.pricePerNight
    : Math.max(1, Math.round(anchor.totalPrice / normalizedNights));
  const existingPlatforms = new Set(actualRows.map((item) => item.platform));

  const floatingRows = floatingPlatforms
    .filter((platform) => !existingPlatforms.has(platform))
    .map((platform) => {
      const factor = PLATFORM_DISPLAY_FACTOR[platform] ?? 1;
      const pricePerNight = Math.max(180, Math.round(basePerNight * factor));
      return {
        ...anchor,
        platform,
        hotelName: anchor.hotelName || hotelName.trim(),
        roomType: roomType || anchor.roomType || (searchType === "hotel" ? "标准房" : searchType === "transport" ? "舱位/席别参考" : "项目票/套餐"),
        pricePerNight,
        totalPrice: pricePerNight * unitCount,
        bookingUrl: "",
        source: "平台参考价",
        confidence: "estimated" as const,
      };
    });

  return [...actualRows, ...floatingRows].sort((a, b) => a.totalPrice - b.totalPrice);
}

export async function POST(req: NextRequest) {
  try {
    const originError = requireTrustedOrigin(req);
    if (originError) return originError;
    const userId = await getUserIdFromCookie();
    const limited = enforceRateLimit(req, "inquiry:price-compare", { limit: 8, windowMs: 10 * 60_000, identity: userId ?? undefined });
    if (limited) return limited;
    const json = await readLimitedJson(req, 24 * 1024);
    if (!json.ok) return json.response;
    const parsed = priceCompareSchema.safeParse(json.data);
    if (!parsed.success) return validationError();
    const body = parsed.data;
    const {
      searchType = "hotel",
      hotelName,
      roomType,
      projectType,
      city,
      transportType,
      fromCity,
      toCity,
      checkInDate,
      checkOutDate,
      nights,
      guestCount = 2,
      roomCount = 1,
      publicReferencePrice,
    } = body;

    if (publicReferencePrice) {
      if (searchType === "transport") {
        return NextResponse.json({
          results: [],
          notice: "机票和火车票属于标准票务，价格波动与退改规则差异较大，当前不套用非标服务预估规则，需由顾问确认。",
          travelEstimate: null,
          priceStatus: "PENDING_CONFIRMATION",
          referenceSource: "USER_PROVIDED",
        });
      }
      return NextResponse.json({
        results: [],
        notice: "已按你填写的公开原价和稳定规则生成区间；这是预估价，最终价格、库存与服务规则仍需顾问确认。",
        travelEstimate: calculatePublicPriceEstimate(publicReferencePrice),
        priceStatus: "ESTIMATED",
        referenceSource: "USER_PROVIDED",
      });
    }

    const normalizedType = searchType === "project" || searchType === "transport" ? searchType : "hotel";
    const destination = normalizedType === "hotel"
      ? hotelName
      : normalizedType === "project"
      ? `${city ? `${city} ` : ""}${hotelName}${projectType ? `（项目类型：${projectType}）` : ""}`
      : `${fromCity ?? ""}到${toCity ?? ""}${transportType ? `（${transportType}）` : ""}`;

    const { results: rawResults, errors } = await searchHotelPrices({
      searchType: normalizedType,
      destination,
      roomType: normalizedType === "hotel" ? roomType : undefined,
      projectType,
      city,
      transportType,
      fromCity,
      toCity,
      checkInDate,
      checkOutDate,
      nights: nights || 1,
      guestCount,
      roomCount,
    });
    if (errors.length > 0) {
      console.warn("[price-compare] provider warnings:", errors);
    }

    const calibrated = normalizedType === "hotel"
      ? calibrateRoomTypeResults(rawResults, roomType, nights || 1, roomCount)
      : { results: rawResults, adjusted: false };
    const comparableResults = calibrated.results;
    const verifiedResults = buildVerifiedPlatformResults(
      comparableResults,
      hotelName,
      roomType,
      normalizedType,
    );
    let referenceResults: HotelPriceResult[] = [];

    if (verifiedResults.length === 0) {
      referenceResults = buildPlatformResultsFromAI(
          comparableResults,
          hotelName,
          roomType,
          nights || 1,
          roomCount,
          false,
          normalizedType,
          guestCount,
          transportType,
        ).map((item) => ({
          ...item,
          bookingUrl: "",
          source: "平台参考价",
          confidence: "low" as const,
        }));
    }

    if (verifiedResults.length === 0 && referenceResults.length === 0) {
      const fallbackResults = normalizedType === "hotel"
        ? await generateFallbackResults(hotelName, roomType, nights || 1, roomCount, checkInDate)
        : normalizedType === "project"
        ? generateProjectFallbackResults(hotelName, projectType, city, guestCount)
        : generateTransportFallbackResults(destination, transportType, fromCity, toCity, guestCount);

      referenceResults = fallbackResults.map((item) => ({
        ...item,
        bookingUrl: "",
        source: "平台参考价",
        confidence: "low" as const,
      }));
    }

    const results = verifiedResults.length > 0 ? verifiedResults : referenceResults;

    const notice = verifiedResults.length > 0
      ? "已拿到带明确来源的公开平台价格；最终可订价格以供应商或人工确认为准。"
      : results.length > 0 ? INTERNAL_ESTIMATE_NOTICE : "暂未拿到价格参考，可以继续让旅途联系供应商报价。";

    const hotelUnitCount = Math.max(nights || 1, 1) * Math.max(roomCount || 1, 1);
    const responseResults = results.slice(0, 6).map((raw) => {
      const r = presentPriceResult(raw);
      const correctedTotal = normalizedType === "hotel"
        ? Math.round(r.pricePerNight) * hotelUnitCount
        : Math.round(r.totalPrice);
      return {
        platform: r.platform,
        // Keep the source platform label for comparison UI, while `platform`
        // remains "内部估算" when the price has no verifiable public URL.
        platformLabel: raw.platform,
        hotelName: r.hotelName,
        roomType: r.roomType,
        pricePerNight: r.pricePerNight,
        totalPrice: correctedTotal,
        breakfastIncluded: r.breakfastIncluded,
        cancellable: r.cancellable,
        sourceUrl: r.bookingUrl || null,
        isMock: r.isMock,
        sourceType: r.sourceType,
        confidence: r.confidence,
        source: r.source,
        notice: r.notice,
      };
    });

    if (userId) {
      await prisma.priceSearchRecord.create({
        data: {
          userId,
          hotelName: hotelName.trim(),
          roomType: normalizedType === "hotel"
            ? roomType?.trim() || null
            : normalizedType === "project"
            ? projectType ? `项目：${projectType}` : "项目参考"
            : transportType ? `交通：${transportType}` : "交通参考",
          checkInDate: checkInDate ? new Date(checkInDate) : null,
          checkOutDate: checkOutDate ? new Date(checkOutDate) : null,
          nights: nights || 1,
          guestCount,
          roomCount,
          minTotalPrice: responseResults.length
            ? Math.min(...responseResults.map((r) => Math.round(r.totalPrice)))
            : null,
          resultsJson: JSON.stringify(responseResults),
        },
      });
      const staleRecords = await prisma.priceSearchRecord.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: 5,
        select: { id: true },
      });
      if (staleRecords.length > 0) {
        await prisma.priceSearchRecord.deleteMany({
          where: { id: { in: staleRecords.map((record) => record.id) } },
        });
      }
    }

    const travelEstimate = calculateTravelEstimate(responseResults);
    return NextResponse.json({
      results: responseResults,
      notice,
      travelEstimate,
    });
  } catch (e) {
    console.error("[price-compare] error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "服务异常" },
      { status: 500 }
    );
  }
}
