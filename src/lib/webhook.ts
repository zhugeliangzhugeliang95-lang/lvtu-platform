import { prisma } from "./prisma";

/**
 * 旅途酒店 CRM · 新线索通知
 * 支持：企业微信群机器人 / 飞书群机器人 / 任意 JSON Webhook
 *
 * 设置项 key：hotel.webhookUrl
 *  - 不配置时静默跳过
 *  - 失败不影响主流程
 *
 * 自动识别：
 *  URL 里包含 `qyapi.weixin.qq.com` → 企业微信 markdown
 *  URL 里包含 `open.feishu.cn`     → 飞书 text
 *  其他                            → 通用 JSON
 */

export type HotelLeadNotifyPayload = {
  leadNo: string;
  destination: string;
  checkInDate: Date | string;
  checkOutDate: Date | string;
  nights: number;
  roomCount: string;
  guestCount: string;
  budget: string;
  preferences: string[];
  contactType: "WECHAT" | "MOBILE";
  contactValue: string;
  remark?: string | null;
  source?: string | null;
  detailUrl: string;
};

function fmtDate(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().slice(0, 10);
}

function buildWeworkPayload(p: HotelLeadNotifyPayload) {
  const lines = [
    `**🏨 旅途新酒店询价线索**`,
    `> 编号：\`${p.leadNo}\``,
    `> 目的地：<font color="info">${p.destination}</font>`,
    `> 入住：${fmtDate(p.checkInDate)} → ${fmtDate(p.checkOutDate)}（${p.nights} 晚）`,
    `> 房间/人数：${p.roomCount} / ${p.guestCount}`,
    `> 预算：${p.budget}`,
    p.preferences.length ? `> 偏好：${p.preferences.join("、")}` : "",
    `> 联系方式：${p.contactType === "WECHAT" ? "微信" : "手机号"} \`${p.contactValue}\``,
    p.remark ? `> 备注：${p.remark}` : "",
    p.source ? `> 来源：${p.source}` : "",
    "",
    `[查看详情](${p.detailUrl})`,
  ].filter(Boolean);
  return {
    msgtype: "markdown",
    markdown: { content: lines.join("\n") },
  };
}

function buildFeishuPayload(p: HotelLeadNotifyPayload) {
  const text = [
    `🏨 旅途新酒店询价线索`,
    `编号：${p.leadNo}`,
    `目的地：${p.destination}`,
    `入住：${fmtDate(p.checkInDate)} → ${fmtDate(p.checkOutDate)}（${p.nights} 晚）`,
    `房间/人数：${p.roomCount} / ${p.guestCount}`,
    `预算：${p.budget}`,
    p.preferences.length ? `偏好：${p.preferences.join("、")}` : "",
    `联系方式：${p.contactType === "WECHAT" ? "微信" : "手机号"} ${p.contactValue}`,
    p.remark ? `备注：${p.remark}` : "",
    p.source ? `来源：${p.source}` : "",
    `详情：${p.detailUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
  return {
    msg_type: "text",
    content: { text },
  };
}

export async function getHotelWebhookUrl(): Promise<string | null> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { key: "hotel.webhookUrl" },
    });
    const v = row?.value?.trim();
    return v || null;
  } catch {
    return null;
  }
}

export async function notifyNewHotelLead(payload: HotelLeadNotifyPayload): Promise<void> {
  const url = await getHotelWebhookUrl();
  if (!url) return;

  let body: unknown;
  if (url.includes("qyapi.weixin.qq.com")) {
    body = buildWeworkPayload(payload);
  } else if (url.includes("open.feishu.cn") || url.includes("larksuite.com")) {
    body = buildFeishuPayload(payload);
  } else {
    body = { type: "hotel_lead", payload };
  }

  // fire-and-forget；失败不影响主流程
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // 6 秒超时（AbortSignal.timeout 在 Node 18+ / Next runtime 都支持）
    signal: AbortSignal.timeout(6000),
  }).catch((e) => {
    console.warn("[hotel-webhook] notify failed:", e?.message || e);
  });
}
