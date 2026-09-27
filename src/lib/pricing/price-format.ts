import { PRICE_STATUS_LABELS, type PriceStatus } from "./types";

export function formatPriceStatus(status: PriceStatus | string) {
  return PRICE_STATUS_LABELS[status as PriceStatus] ?? status;
}

export function formatYuan(value: number | null | undefined) {
  return typeof value === "number" ? `¥${value.toLocaleString("zh-CN")}` : "待顾问确认";
}

export function formatEstimateRange(min: number | null | undefined, max: number | null | undefined) {
  if (typeof min !== "number" || typeof max !== "number") return "提交需求后由顾问确认优惠方案";
  return min === max ? formatYuan(min) : `${formatYuan(min)}～${formatYuan(max)}`;
}
