import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_PIXELS = 25_000_000;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

type UploadFile = { type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> };

export async function sanitizePublicImage(file: UploadFile): Promise<
  | { ok: true; buffer: Buffer }
  | { ok: false; status: number; error: string; message: string }
> {
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, status: 415, error: "UNSUPPORTED_IMAGE", message: "只支持 JPEG、PNG 或 WebP 图片" };
  }
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, status: 413, error: "FILE_TOO_LARGE", message: "图片不能超过 5MB" };
  }

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const image = sharp(input, { failOn: "error", limitInputPixels: MAX_PIXELS });
    const metadata = await image.metadata();
    const expectedFormat = file.type === "image/jpeg" ? "jpeg" : file.type === "image/png" ? "png" : "webp";
    if (metadata.format !== expectedFormat || !metadata.width || !metadata.height || metadata.width * metadata.height > MAX_PIXELS) {
      return { ok: false, status: 415, error: "INVALID_IMAGE", message: "图片内容与文件类型不匹配" };
    }
    return { ok: true, buffer: await image.rotate().webp({ quality: 88 }).toBuffer() };
  } catch {
    return { ok: false, status: 415, error: "INVALID_IMAGE", message: "图片无法解析或已损坏" };
  }
}
