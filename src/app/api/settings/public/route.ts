import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* =============================================================================
 * 旅途酒店 CRM · 公开前台配置
 *  GET /api/settings/public
 *
 *  返回：客服微信号、二维码 URL、首页主标题、隐私文案
 *  仅返回 hotel.* 命名空间下的安全设置，其它配置不暴露。
 * ============================================================================*/

const PUBLIC_KEYS = [
  "hotel.wechatId",
  "hotel.qrUrl",
  "hotel.heroTitle",
  "hotel.privacyText",
  "wechat_qrcode",
] as const;

export const dynamic = "force-dynamic";

function cleanPublicContact(value: string | undefined) {
  if (!value) return "";
  return /^(traveltong_001|your[_-]?wechat|demo)$/i.test(value.trim()) ? "" : value.trim();
}

export async function GET() {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: [...PUBLIC_KEYS] } },
  });

  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  return NextResponse.json({
    wechatId: cleanPublicContact(map["hotel.wechatId"]),
    // 兼容旧版后台上传到 wechat_qrcode 的二维码配置
    qrUrl: map["hotel.qrUrl"] || map["wechat_qrcode"] || "",
    heroTitle:
      map["hotel.heroTitle"] || "旅行出发前，先让旅途帮你查一版更划算的方案",
    privacyText:
      map["hotel.privacyText"] ||
      "提交后仅用于酒店询价和客服沟通，不会公开你的个人信息。",
  });
}
