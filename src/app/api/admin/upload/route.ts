import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { requireTrustedOrigin } from "@/lib/security/request";
import { MAX_UPLOAD_BYTES, sanitizePublicImage } from "@/lib/security/imageUpload";

function getUploadDir() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  const originError = requireTrustedOrigin(req);
  if (originError) return originError;
  const limited = enforceRateLimit(req, "admin:upload", { limit: 20, windowMs: 10 * 60_000, identity: auth.session.adminId });
  if (limited) return limited;

  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_UPLOAD_BYTES + 256 * 1024) {
    return NextResponse.json({ error: "FILE_TOO_LARGE", message: "图片不能超过 5MB" }, { status: 413 });
  }
  if (!req.headers.get("content-type")?.includes("multipart/form-data")) {
    return NextResponse.json({ error: "INVALID_UPLOAD", message: "请选择图片文件" }, { status: 400 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "INVALID_UPLOAD", message: "请选择图片文件" }, { status: 400 });
  }
  const sanitized = await sanitizePublicImage(file);
  if (!sanitized.ok) {
    return NextResponse.json({ error: sanitized.error, message: sanitized.message }, { status: sanitized.status });
  }

  try {
    const filename = `${crypto.randomBytes(16).toString("hex")}.webp`;
    const uploadDir = getUploadDir();
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), sanitized.buffer, { flag: "wx", mode: 0o600 });
    return NextResponse.json({ url: `/api/uploads/${filename}` });
  } catch {
    return NextResponse.json({ error: "INVALID_IMAGE", message: "图片无法解析或已损坏" }, { status: 415 });
  }
}
