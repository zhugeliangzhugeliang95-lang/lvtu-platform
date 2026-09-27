import { NextResponse } from "next/server";
import type { ContactType, HotelLeadStatus, InquiryType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { anyLeadSubmitSchema, formatZodError } from "@/lib/validations";
import { enforceRateLimit, getHashedClientIp } from "@/lib/rateLimit";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";
import { notifyNewHotelLead } from "@/lib/webhook";

/* =============================================================================
 * 旅途 · 公开线索提交
 *  POST /api/leads
 *
 *  接受两种 payload（由 inquiryType 判别）：
 *    - INTENT：首屏轻量问卷
 *        destination / timeframe / guestCount / contactType / contactValue / remark
 *    - HOTEL：酒店板块详细询价
 *        destination / checkInDate / checkOutDate / roomCount / guestCount /
 *        budget / preferences / contactType / contactValue / remark
 *
 *  特性：
 *   - zod 判别式联合校验 + honeypot（website 字段）
 *   - 同 IP 1 分钟最多 5 次；同联系方式 10 分钟最多 3 次
 *   - 写 HotelLead + HotelLeadStatusLog(NEW)
 *   - Webhook 异步通知（失败不影响用户提交）
 * ============================================================================*/

function pad(n: number, width: number) {
  return String(n).padStart(width, "0");
}

function generateLeadNo(now: Date) {
  const ymd = `${now.getFullYear()}${pad(now.getMonth() + 1, 2)}${pad(
    now.getDate(),
    2
  )}`;
  const hms = `${pad(now.getHours(), 2)}${pad(now.getMinutes(), 2)}${pad(
    now.getSeconds(),
    2
  )}`;
  const rand = pad(Math.floor(Math.random() * 1000), 3);
  return `LT${ymd}${hms}${rand}`;
}

function nightsBetween(start: Date, end: Date) {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

export async function POST(req: Request) {
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const json = await readLimitedJson(req, 32 * 1024);
  if (!json.ok) return json.response;
  const raw = json.data;
  if (!raw || typeof raw !== "object") {
    return NextResponse.json(
      { error: "INVALID_JSON", message: "请求体不合法" },
      { status: 400 }
    );
  }

  const parsed = anyLeadSubmitSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }
  const data = parsed.data;

  // honeypot：机器人填了 website 字段 → 假装成功
  if (data.website && data.website.length > 0) {
    return NextResponse.json({ ok: true, leadNo: "MOCK", id: "mock" });
  }

  // 限流
  const ipLimit = enforceRateLimit(req, "hotel-lead:create", { limit: 5, windowMs: 60_000 });
  if (ipLimit) return ipLimit;
  const contactLimit = enforceRateLimit(req, "hotel-lead:contact", { limit: 3, windowMs: 10 * 60_000, identity: data.contactValue });
  if (contactLimit) return contactLimit;

  const now = new Date();
  const leadNo = generateLeadNo(now);
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) || null;

  // 构建 HotelLead 字段（两种问卷共享 destination/guestCount/contact/source 等）
  const baseData = {
    leadNo,
    inquiryType: data.inquiryType as InquiryType,
    destination: data.destination,
    guestCount: data.guestCount,
    contactType: data.contactType as ContactType,
    contactValue: data.contactValue,
    remark: data.remark || null,
    source: data.source || "官网首页",
    utmSource: data.utmSource || null,
    utmMedium: data.utmMedium || null,
    utmCampaign: data.utmCampaign || null,
    referrer: data.referrer || null,
    landingPage: data.landingPage || null,
    userAgent,
    ip: getHashedClientIp(req),
    status: "NEW" as HotelLeadStatus,
  };

  const detailsData =
    data.inquiryType === "HOTEL"
      ? {
          checkInDate: new Date(data.checkInDate),
          checkOutDate: new Date(data.checkOutDate),
          nights: nightsBetween(
            new Date(data.checkInDate),
            new Date(data.checkOutDate)
          ),
          roomCount: data.roomCount,
          budget: data.budget,
          preferences: JSON.stringify(data.preferences || []),
        }
      : {
          timeframe: data.timeframe,
          preferences: "[]",
        };

  const lead = await prisma.hotelLead.create({
    data: { ...baseData, ...detailsData },
    select: {
      id: true,
      leadNo: true,
      destination: true,
      contactValue: true,
      contactType: true,
      inquiryType: true,
    },
  });

  await prisma.hotelLeadStatusLog.create({
    data: { leadId: lead.id, fromStatus: null, toStatus: "NEW" },
  });

  // Webhook（fire-and-forget）
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("host") || "localhost";
  const detailUrl = `${proto}://${host}/admin/hotel/leads/${lead.id}`;

  const notifyPayload =
    data.inquiryType === "HOTEL"
      ? {
          leadNo: lead.leadNo,
          destination: data.destination,
          checkInDate: new Date(data.checkInDate),
          checkOutDate: new Date(data.checkOutDate),
          nights: nightsBetween(
            new Date(data.checkInDate),
            new Date(data.checkOutDate)
          ),
          roomCount: data.roomCount,
          guestCount: data.guestCount,
          budget: data.budget,
          preferences: data.preferences || [],
          contactType: lead.contactType,
          contactValue: lead.contactValue,
          remark: data.remark,
          source: data.source,
          detailUrl,
        }
      : {
          leadNo: lead.leadNo,
          destination: data.destination,
          checkInDate: now,
          checkOutDate: now,
          nights: 0,
          roomCount: "未填（意向单）",
          guestCount: data.guestCount,
          budget: data.timeframe,
          preferences: [],
          contactType: lead.contactType,
          contactValue: lead.contactValue,
          remark: data.remark,
          source: data.source,
          detailUrl,
        };

  void notifyNewHotelLead(notifyPayload).catch(() => {});

  return NextResponse.json({
    ok: true,
    id: lead.id,
    leadNo: lead.leadNo,
    inquiryType: lead.inquiryType,
  });
}
