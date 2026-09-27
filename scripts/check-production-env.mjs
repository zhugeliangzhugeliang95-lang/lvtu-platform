import path from "node:path";

const required = [
  "DATABASE_URL",
  "APP_ORIGIN",
  "USER_SESSION_SECRET",
  "ADMIN_SECRET",
  "GUEST_INQUIRY_SECRET",
];

const errors = [];
for (const name of required) {
  if (!process.env[name]?.trim()) errors.push(`${name} 未配置`);
}

const secrets = ["USER_SESSION_SECRET", "ADMIN_SECRET", "GUEST_INQUIRY_SECRET"]
  .map((name) => [name, process.env[name]?.trim() || ""]);
for (const [name, value] of secrets) {
  if (value && value.length < 32) errors.push(`${name} 长度至少需要 32 个字符`);
}
if (new Set(secrets.map(([, value]) => value).filter(Boolean)).size !== secrets.filter(([, value]) => value).length) {
  errors.push("三个会话 Secret 必须互不相同");
}

const origins = process.env.APP_ORIGIN?.split(",").map((value) => value.trim()).filter(Boolean) || [];
for (const origin of origins) {
  try {
    const url = new URL(origin);
    if (url.origin !== origin.replace(/\/$/, "")) errors.push(`APP_ORIGIN 必须只填写源站地址：${origin}`);
    if (url.protocol !== "https:") errors.push(`生产 APP_ORIGIN 必须使用 HTTPS：${origin}`);
  } catch {
    errors.push(`APP_ORIGIN 不是有效网址：${origin}`);
  }
}

const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
if (publicSiteUrl) {
  try {
    if (new URL(publicSiteUrl).protocol !== "https:") errors.push("NEXT_PUBLIC_SITE_URL 必须使用 HTTPS");
  } catch {
    errors.push("NEXT_PUBLIC_SITE_URL 不是有效网址");
  }
}

if (process.env.DATABASE_URL?.startsWith("file:")) {
  const databasePath = process.env.DATABASE_URL.slice(5);
  if (!path.isAbsolute(databasePath)) errors.push("生产 SQLite DATABASE_URL 必须指向持久化磁盘的绝对路径");
  const uploadDir = process.env.UPLOAD_DIR?.trim() || "";
  if (!uploadDir) errors.push("使用 SQLite 部署时必须配置 UPLOAD_DIR");
  else if (!path.isAbsolute(uploadDir)) errors.push("UPLOAD_DIR 必须是绝对路径");
}

const legacyUser = process.env.ADMIN_USER?.trim();
const legacyPass = process.env.ADMIN_PASS?.trim();
if (Boolean(legacyUser) !== Boolean(legacyPass)) errors.push("ADMIN_USER 与 ADMIN_PASS 必须同时配置或同时留空");
if (legacyPass && legacyPass.length < 12) errors.push("生产后台兼容密码至少需要 12 个字符");

if (errors.length) {
  console.error("\n旅途生产环境检查失败：\n");
  for (const error of errors) console.error(`- ${error}`);
  console.error("\n请根据 .env.example 或部署平台 Secret 配置修复后再启动。\n");
  process.exit(1);
}

console.log("旅途生产环境检查通过");
