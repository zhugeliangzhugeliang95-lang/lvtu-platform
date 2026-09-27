import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi, isAdminRole } from "@/lib/adminAuth";
import { settingsUpdateSchema, formatZodError } from "@/lib/validations";
import { readLimitedJson, requireTrustedOrigin } from "@/lib/security/request";

/* =============================================================================
 * 系统设置
 *  GET   /api/admin/settings     — 管理员 / 客服都能看（客服需要知道微信号等）
 *  PATCH /api/admin/settings     — 仅管理员可改
 *
 * body 传 Record<string,string>，只会 upsert 白名单内的 key。
 * ============================================================================*/

// 允许通过后台修改的设置 key
const ALLOWED_KEYS = new Set([
  "hotel.wechatId",
  "hotel.qrUrl",
  "hotel.webhookUrl",
  "hotel.heroTitle",
  "hotel.privacyText",
  "hotel.autoAssign", // off / round_robin
  "payment.qrUrl",
  "contact_email",
  "contact_phone",
  "service_hours",
]);

// 关键词表：便于未来 UI 上渲染为结构化表单
const KEY_META: Record<string, { label: string; description?: string }> = {
  "hotel.wechatId": { label: "客服微信号" },
  "hotel.qrUrl": { label: "客服二维码图片 URL" },
  "hotel.webhookUrl": {
    label: "新线索 Webhook",
    description: "企业微信机器人 / 飞书机器人 URL，留空关闭通知",
  },
  "hotel.heroTitle": { label: "首页主标题" },
  "hotel.privacyText": { label: "表单底部隐私提示" },
  "hotel.autoAssign": {
    label: "新线索自动分配",
    description: "off=关闭 / round_robin=轮流分配到可用客服",
  },
  "payment.qrUrl": { label: "收款二维码图片 URL", description: "用户订单付款页展示的运营收款二维码" },
  contact_email: { label: "客服邮箱" },
  contact_phone: { label: "客服电话" },
  service_hours: { label: "客服服务时段" },
};

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: Array.from(ALLOWED_KEYS) } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  const items = Array.from(ALLOWED_KEYS).map((key) => ({
    key,
    value: map[key] ?? "",
    label: KEY_META[key]?.label || key,
    description: KEY_META[key]?.description,
  }));

  return NextResponse.json({ items });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  if (!isAdminRole(auth.session)) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "仅管理员可修改系统设置" },
      { status: 403 }
    );
  }

  const body = await readLimitedJson(req, 16 * 1024);
  if (!body.ok) return body.response;
  const parsed = settingsUpdateSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(formatZodError(parsed.error), { status: 400 });
  }

  const updates = Object.entries(parsed.data).filter(([k]) =>
    ALLOWED_KEYS.has(k)
  );

  await prisma.$transaction(
    updates.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value, description: KEY_META[key]?.description ?? null },
        create: {
          key,
          value,
          description: KEY_META[key]?.description ?? null,
        },
      })
    )
  );

  return NextResponse.json({ ok: true, updated: updates.length });
}
