/**
 * 旅途 · 内存级请求限流
 *
 * 适用场景：单机/单实例（Vercel 上每个 lambda 实例独立）。
 * 不适用：分布式严格防刷 —— 那种需要 Redis/Upstash。
 *
 * 用法：
 *   const rl = checkRateLimit(`lead:${ip}`, { limit: 5, windowMs: 60_000 });
 *   if (!rl.ok) return new Response("...", { status: 429 });
 */

import crypto from "crypto";
import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

// 进程级缓存（dev 热重载会重置；生产 lambda 冷启动也会重置 —— 都可接受）
const buckets = new Map<string, Bucket>();

const SWEEP_INTERVAL_MS = 60_000;
const MAX_BUCKETS = 10_000;
let lastSweep = Date.now();

function sweepExpired(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
  if (buckets.size > MAX_BUCKETS) {
    const overflow = buckets.size - MAX_BUCKETS;
    [...buckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt).slice(0, overflow).forEach(([key]) => buckets.delete(key));
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
};

export function checkRateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  sweepExpired(now);

  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    const next: Bucket = { count: 1, resetAt: now + opts.windowMs };
    buckets.set(key, next);
    return { ok: true, remaining: opts.limit - 1, resetAt: next.resetAt, retryAfterSec: 0 };
  }

  if (b.count >= opts.limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: b.resetAt,
      retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
    };
  }

  b.count += 1;
  return {
    ok: true,
    remaining: opts.limit - b.count,
    resetAt: b.resetAt,
    retryAfterSec: 0,
  };
}

/**
 * 从 Next.js Request 拿客户端 IP（兼顾本地、Vercel、自建反代）
 */
export function getClientIp(req: Request): string {
  const h = req.headers;
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    h.get("x-client-ip") ||
    "unknown"
  );
}

function hashIdentifier(value: string) {
  return crypto.createHash("sha256").update(value).digest("base64url").slice(0, 22);
}

export function getHashedClientIp(req: Request) {
  return hashIdentifier(getClientIp(req));
}

export function enforceRateLimit(
  req: Request,
  route: string,
  opts: { limit: number; windowMs: number; identity?: string },
): NextResponse | null {
  const identity = opts.identity ? `actor:${opts.identity}` : `ip:${getClientIp(req)}`;
  const result = checkRateLimit(`${route}:${hashIdentifier(identity)}`, opts);
  if (result.ok) return null;
  return NextResponse.json(
    { error: "RATE_LIMITED", message: "请求过于频繁，请稍后再试" },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSec) } },
  );
}

export function resetRateLimitsForTests() {
  buckets.clear();
  lastSweep = Date.now();
}
