import { NextResponse } from "next/server";

const DEFAULT_JSON_LIMIT = 32 * 1024;

export async function readLimitedJson<T = unknown>(req: Request, maxBytes = DEFAULT_JSON_LIMIT): Promise<
  | { ok: true; data: T }
  | { ok: false; response: NextResponse }
> {
  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, response: NextResponse.json({ error: "REQUEST_TOO_LARGE", message: "请求内容过大" }, { status: 413 }) };
  }

  const text = await req.text().catch(() => "");
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    return { ok: false, response: NextResponse.json({ error: "REQUEST_TOO_LARGE", message: "请求内容过大" }, { status: 413 }) };
  }

  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, response: NextResponse.json({ error: "INVALID_JSON", message: "请求格式无效" }, { status: 400 }) };
  }
}

function allowedOrigins() {
  const configured = process.env.APP_ORIGIN?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
  return new Set(configured.map((value) => new URL(value).origin));
}

export function requireTrustedOrigin(req: Request): NextResponse | null {
  const origin = req.headers.get("origin");
  if (!origin) {
    return NextResponse.json({ error: "INVALID_ORIGIN", message: "请求来源无效" }, { status: 403 });
  }

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return NextResponse.json({ error: "INVALID_ORIGIN", message: "请求来源无效" }, { status: 403 });
  }

  const allowed = allowedOrigins();
  if (allowed.has(parsed.origin)) return null;
  if (process.env.NODE_ENV !== "production" && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")) return null;

  return NextResponse.json({ error: "INVALID_ORIGIN", message: "请求来源无效" }, { status: 403 });
}

export function validationError() {
  return NextResponse.json({ error: "INVALID_INPUT", message: "提交内容不符合要求" }, { status: 400 });
}
