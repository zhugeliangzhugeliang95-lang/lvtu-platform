import { prisma } from "@/lib/prisma";

export const DEFAULT_MEMBERSHIP_PRICE = 30;
export const DEFAULT_MEMBERSHIP_DAYS = 30;

export async function getMembershipConfig() {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ["membership.price", "membership.days", "membership.title", "membership.benefits", "payment.wechatQrUrl", "payment.alipayQrUrl", "payment.instructions", "payment.enabled"] } },
  });
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const price = Number(values["membership.price"]);
  const days = Number(values["membership.days"]);
  return {
    price: Number.isFinite(price) && price > 0 && price <= 100000 ? Math.round(price) : DEFAULT_MEMBERSHIP_PRICE,
    days: Number.isFinite(days) && days >= 1 && days <= 3650 ? Math.round(days) : DEFAULT_MEMBERSHIP_DAYS,
    title: values["membership.title"]?.trim() || "旅途会员",
    benefits: values["membership.benefits"]?.trim() || "会员绑定手机号通过旅途完成符合条件的旅行服务，可享平台服务费减免。",
    wechatQrUrl: values["payment.wechatQrUrl"]?.trim() || "",
    alipayQrUrl: values["payment.alipayQrUrl"]?.trim() || "",
    instructions: values["payment.instructions"]?.trim() || "完成付款后点击“我已完成付款”，客服会人工核对到账。",
    enabled: values["payment.enabled"] !== "false",
  };
}

export function isMembershipActive(membership: { status: string; expiresAt: Date | null } | null | undefined, now = new Date()) {
  return Boolean(membership?.status === "ACTIVE" && membership.expiresAt && membership.expiresAt > now);
}

export function membershipState(membership: { status: string; expiresAt: Date | null } | null | undefined, now = new Date()) {
  if (!membership) return "NONE" as const;
  if (membership.status === "ACTIVE" && membership.expiresAt && membership.expiresAt > now) return "ACTIVE" as const;
  if (membership.status === "SUSPENDED") return "SUSPENDED" as const;
  if (membership.status === "PENDING") return "PENDING" as const;
  return "EXPIRED" as const;
}

export function makeMemberNo() {
  return `LV${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function makeMembershipPaymentNo() {
  return `MP${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
