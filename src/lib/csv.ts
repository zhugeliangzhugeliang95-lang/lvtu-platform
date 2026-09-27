/**
 * 旅途酒店 CRM · CSV 导出
 * - UTF-8 BOM 防止 Excel 中文乱码
 * - 单元格自动转义双引号、换行
 */

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = typeof value === "string" ? value : String(value);
  // 危险字符：双引号、逗号、换行 → 整体加双引号，内部双引号转义为两个
  if (/[",\n\r]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsv(headers: string[], rows: unknown[][]): string {
  const head = headers.map(csvEscape).join(",");
  const body = rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
  // ﻿ = UTF-8 BOM
  return "﻿" + head + "\r\n" + body + "\r\n";
}

export function csvResponseHeaders(filename: string): HeadersInit {
  // Content-Disposition 不能含非 ASCII：
  //   - filename="..."   用 ASCII 回退（老浏览器）
  //   - filename*=UTF-8''...  用百分号编码（现代浏览器优先识别）
  const asciiFallback = "hotel-leads.csv";
  const safeName = encodeURIComponent(filename);
  return {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${safeName}`,
    "Cache-Control": "no-store",
  };
}
