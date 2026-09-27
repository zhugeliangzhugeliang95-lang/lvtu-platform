import { NextRequest, NextResponse } from "next/server";
import { timingSafeTextEqual } from "@/lib/security/secrets";

export function requireSupplierBotApi(req: NextRequest):
  | { ok: true }
  | { ok: false; response: NextResponse } {
  const token = process.env.SUPPLIER_BOT_TOKEN || process.env.XIANYU_BOT_TOKEN || "";

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "UNAUTHORIZED", message: "供应商机器人未配置" },
        { status: 401 },
      ),
    };
  }

  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const headerToken = req.headers.get("x-supplier-bot-token")?.trim();

  if (timingSafeTextEqual(bearer, token) || timingSafeTextEqual(headerToken, token)) {
    return { ok: true };
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: "UNAUTHORIZED", message: "供应商机器人 token 无效" },
      { status: 401 },
    ),
  };
}
