const CSV_FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function sanitizeCsvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return CSV_FORMULA_PREFIX.test(text) ? `'${text}` : text;
}

export function assertSafePublicUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("仅允许 http/https 来源链接");
  }
  return parsed.toString();
}

export function maskLicenseNumber(value: string | null | undefined): string {
  if (!value) return "待补充";
  if (value.length <= 6) return `${value.slice(0, 2)}****`;
  return `${value.slice(0, 4)}****${value.slice(-2)}`;
}

export const PUBLIC_SUPPLIER_STATUSES = ["ACTIVE"] as const;

