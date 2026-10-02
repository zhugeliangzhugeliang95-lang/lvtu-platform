import { NextRequest, NextResponse } from "next/server";
import type { XianYuQuote } from "@prisma/client";
import { requireAdminApi } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { requireSupplierBotApi } from "@/lib/supplierBotAuth";
import { refreshXianYuQuoteSummary } from "@/lib/xianyuSummary";
import { enforceRateLimit } from "@/lib/rateLimit";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";
import { z } from "zod";

const VOLCENGINE_API_KEY = process.env.VOLCENGINE_API_KEY ?? "";
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY ?? "";
const VOLCENGINE_MODEL = process.env.VOLCENGINE_CHAT_MODEL || process.env.VOLCENGINE_MODEL || "";
const OPEN_MODEL_API_KEY = process.env.OPEN_MODEL_API_KEY || process.env.SILICONFLOW_API_KEY || "";
const OPEN_MODEL_BASE_URL = (process.env.OPEN_MODEL_BASE_URL || process.env.SILICONFLOW_BASE_URL || "https://api.siliconflow.cn/v1").replace(/\/$/, "");
const OPEN_MODEL_NAME = process.env.OPEN_MODEL_NAME || process.env.SILICONFLOW_MODEL || "Qwen/Qwen3-8B";

type ParsedQuote = {
  pricePerNight: number;
  totalPrice: number;
  breakfastIncluded: boolean;
  cancellable: boolean;
  extraServices: string[];
};

const quoteInputSchema = z.object({
  sellerId: z.string().trim().min(1).max(160),
  sellerName: z.string().trim().max(160).optional(),
  rawReply: z.string().trim().min(1).max(12_000),
  pricePerNight: z.coerce.number().finite().min(0).max(50_000).optional(),
  totalPrice: z.coerce.number().finite().min(0).max(500_000).optional(),
  breakfastIncluded: z.union([z.boolean(), z.literal("true"), z.literal("false")]).optional(),
  cancellable: z.union([z.boolean(), z.literal("true"), z.literal("false")]).optional(),
  extraServices: z.string().max(2_000).optional(),
}).strict();

const MAX_QUOTE_FORM_BYTES = 128 * 1024;

function uniqueStrings(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function getExtraServices(text: string) {
  const services: string[] = [];
  if (/官方服务费|服务费/.test(text)) services.push("含官方服务费");
  if (/后续没有其他费用|没有其他费用|无其他费用|没有额外费用|无额外费用/.test(text)) {
    services.push("无额外费用");
  }
  const advanceMatch = text.match(/提前\s*(\d{1,2})\s*天/);
  if (advanceMatch) services.push(`需提前${advanceMatch[1]}天预订`);
  if (/不含门票|不包含门票|门票不含/.test(text)) services.push("不含门票");
  else if (/含门票|包含门票/.test(text)) services.push("含门票");
  if (/官网直出|官网直出|官网/.test(text)) services.push("官网直出");
  return uniqueStrings(services);
}

function inferBreakfast(text: string) {
  if (/不含\s*早|不含早餐|无早|不带早|不包早/.test(text)) return false;
  return /含\s*早|含早餐|带早|包早/.test(text);
}

function inferCancellable(text: string) {
  if (/不能取消|不可取消|无法取消|不退不改|不可退|不能退|订好了?不能取消|订好后不能取消/.test(text)) {
    return false;
  }
  if (/免费取消|可取消|可以取消|随时退|可退/.test(text)) return true;
  return true;
}

function isLikelyDateOrCount(text: string, matchIndex: number, rawNumber: string) {
  const before = text.slice(Math.max(0, matchIndex - 4), matchIndex);
  const after = text.slice(matchIndex + rawNumber.length, matchIndex + rawNumber.length + 4);
  if (/[年/-]$/.test(before) || /^[月日号/-]/.test(after)) return true;
  if (/提前\s*$/.test(before) && /^天/.test(after)) return true;
  return false;
}

function inferQuoteAmount(value: number, clause: string, fullText: string, nights: number) {
  const normalized = `${clause} ${fullText}`.replace(/\s+/g, "");
  const looksPerNight = /每晚|每夜|单晚|一晚|\/晚|晚价|间夜/.test(normalized);
  const looksTotal = /总价|合计|一共|共计|全程|全部|打包|套餐|到手|实付/.test(normalized);
  const shouldTreatAsTotal = nights > 1 && !looksPerNight && (looksTotal || value >= 1000);

  if (shouldTreatAsTotal) {
    return {
      pricePerNight: Math.max(1, Math.round(value / nights)),
      totalPrice: value,
      note: `按${nights}晚总价折算`,
    };
  }

  return {
    pricePerNight: value,
    totalPrice: value * nights,
    note: "",
  };
}

function parseHeuristicQuotes(rawReply: string, nights: number): ParsedQuote[] {
  const text = rawReply.replace(/[ \t\r]+/g, " ").trim();
  if (!text) return [];

  const wholeExtras = getExtraServices(text);
  const clauses = text
    .split(/[\n。；;，,]/)
    .map((clause) => clause.trim())
    .filter(Boolean);

  const parsed: ParsedQuote[] = [];

  for (const clause of clauses) {
    const matches = [...clause.matchAll(/(?:[¥￥]\s*)?(\d{3,5})(?:\s*(?:元|块))?/g)]
      .map((match) => ({
        raw: match[1],
        value: Number(match[1]),
        index: match.index ?? 0,
      }))
      .filter((match) => {
        if (match.value < 100 || match.value > 50000) return false;
        return !isLikelyDateOrCount(clause, match.index, match.raw);
      });

    if (matches.length === 0) continue;

    const pickedMatches =
      matches.length > 1 && /给您|给你|优惠|最低|实付|到手|只要/.test(clause)
        ? [matches[matches.length - 1]]
        : matches;

    for (const match of pickedMatches) {
      const afterContext = clause.slice(match.index, match.index + match.raw.length + 18);
      const beforeContext = clause.slice(Math.max(0, match.index - 12), match.index + match.raw.length);
      const breakfastContext = /不含\s*早|不含早餐|无早|含\s*早|含早餐|带早|包早/.test(afterContext)
        ? afterContext
        : beforeContext;
      const extras = getExtraServices(`${text} ${clause}`);
      const originalPrice =
        matches.length > 1 && pickedMatches.length === 1 && matches[0].value !== match.value
          ? [`原报价¥${matches[0].value}`]
          : [];
      const amount = inferQuoteAmount(match.value, clause, text, nights);

      parsed.push({
        pricePerNight: amount.pricePerNight,
        totalPrice: amount.totalPrice,
        breakfastIncluded: inferBreakfast(breakfastContext || clause),
        cancellable: inferCancellable(text),
        extraServices: uniqueStrings([...wholeExtras, ...extras, ...originalPrice, amount.note]),
      });
    }
  }

  const seen = new Set<string>();
  return parsed.filter((quote) => {
    const key = `${quote.pricePerNight}-${quote.breakfastIncluded}-${quote.cancellable}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// AI 从商家自然语言回复中提取报价结构
async function parseQuoteWithAI(
  rawReply: string,
  hotelName: string,
  nights: number
): Promise<ParsedQuote | null> {
  const prompt = `你是酒店采购助手，请从商家回复中提取报价信息，返回严格JSON，不要任何解释。

商家回复：
"${rawReply}"

酒店名：${hotelName}
入住晚数：${nights}晚

请提取并返回如下JSON（价格单位：元，如果商家只报了多晚总价，请将 pricePerNight 折算成每晚价格，totalPrice 保留商家总价；如果明确写了每晚/单晚/¥xx/晚，才按每晚价计算总价）：
{
  "pricePerNight": 数字（每晚价格，元），
  "totalPrice": 数字（总价=pricePerNight*nights，元），
  "breakfastIncluded": true/false（是否含早餐）,
  "cancellable": true/false（是否可免费取消）,
  "extraServices": ["字符串数组，列出附加服务，如：含停车、含下午茶等"]
}

如果回复中没有明确报价，返回 null。`;

  const parseResponse = (data: { choices?: Array<{ message?: { content?: string } }> }) => {
    const text = data.choices?.[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]);
      return parsed && typeof parsed.pricePerNight === "number" ? parsed as ParsedQuote : null;
    } catch {
      return null;
    }
  };

  // 配置了方舟模型时优先用豆包；模型 ID 不再写死，避免环境中的模型已下线时静默失败。
  if (VOLCENGINE_API_KEY && VOLCENGINE_MODEL) {
    try {
      const res = await fetch(
        "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${VOLCENGINE_API_KEY}`,
          },
          body: JSON.stringify({
            model: VOLCENGINE_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
          }),
          signal: AbortSignal.timeout(15000),
        }
      );
      const data = await res.json();
      const parsed = parseResponse(data);
      if (parsed) return parsed;
    } catch {
      // 继续尝试千问
    }
  }

  // 没有豆包时使用已配置的开源模型，再备用千问。
  if (OPEN_MODEL_API_KEY) {
    try {
      const res = await fetch(`${OPEN_MODEL_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPEN_MODEL_API_KEY}` },
        body: JSON.stringify({ model: OPEN_MODEL_NAME, messages: [{ role: "user", content: prompt }], temperature: 0.1 }),
        signal: AbortSignal.timeout(15000),
      });
      const parsed = parseResponse(await res.json());
      if (parsed) return parsed;
    } catch {
      // 继续尝试千问
    }
  }

  if (DASHSCOPE_API_KEY) {
    try {
      const res = await fetch(
        "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "qwen-plus",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
          }),
          signal: AbortSignal.timeout(15000),
        }
      );
      const data = await res.json();
      const parsed = parseResponse(data);
      if (parsed) return parsed;
    } catch {
      // 解析失败
    }
  }

  return null;
}

// POST /api/inquiry/xianyu/[taskId]/quotes
// 机器人提交商家回复，AI 自动解析报价
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const isFormSubmit = req.headers.get("content-type")?.includes("multipart/form-data")
    || req.headers.get("content-type")?.includes("application/x-www-form-urlencoded");

  try {
    const declaredLength = Number(req.headers.get("content-length") ?? 0);
    if (isFormSubmit && Number.isFinite(declaredLength) && declaredLength > MAX_QUOTE_FORM_BYTES) {
      return NextResponse.json({ error: "REQUEST_TOO_LARGE", message: "请求内容过大" }, { status: 413 });
    }

    if (isFormSubmit) {
      const auth = await requireAdminApi();
      if (!auth.ok) return auth.response;
      const originError = requireTrustedOrigin(req);
      if (originError) return originError;
      const limited = enforceRateLimit(req, "admin:xianyu-quote", { limit: 30, windowMs: 10 * 60_000, identity: auth.session.adminId });
      if (limited) return limited;
    } else {
      const auth = requireSupplierBotApi(req);
      if (!auth.ok) return auth.response;
      const limited = enforceRateLimit(req, "worker:xianyu-quote", { limit: 120, windowMs: 60_000, identity: "supplier-worker" });
      if (limited) return limited;
    }

    const bodyResult = isFormSubmit
      ? { ok: true as const, data: Object.fromEntries((await req.formData()).entries()) }
      : await readLimitedJson(req, 32 * 1024);
    if (!bodyResult.ok) return bodyResult.response;
    const parsedInput = quoteInputSchema.safeParse(bodyResult.data);
    if (!parsedInput.success) return validationError();
    const body = parsedInput.data;
    const sellerId = body.sellerId;
    const sellerName = body.sellerName || undefined;
    const rawReply = body.rawReply;
    const manualPricePerNight = body.pricePerNight ?? 0;
    const manualTotalPrice = body.totalPrice ?? 0;
    const manualBreakfastIncluded = body.breakfastIncluded === "true" || body.breakfastIncluded === true;
    const manualCancellable = body.cancellable !== "false" && body.cancellable !== false;
    const manualExtraServices = (body.extraServices ?? "")
      .split(/[，,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!sellerId || !rawReply) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    // 取任务信息
    const task = await prisma.xianYuTask.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    // 后台手动录入时直接使用表单价格；机器人提交自然语言时交给 AI 解析。
    const parsedQuotes: ParsedQuote[] =
      manualPricePerNight > 0
        ? [
          {
            pricePerNight: manualPricePerNight,
            totalPrice: manualTotalPrice > 0 ? manualTotalPrice : manualPricePerNight * task.nights,
            breakfastIncluded: manualBreakfastIncluded,
            cancellable: manualCancellable,
            extraServices: manualExtraServices,
          },
        ]
        : parseHeuristicQuotes(rawReply, task.nights);

    if (parsedQuotes.length === 0 && manualPricePerNight <= 0) {
      const aiParsed = await parseQuoteWithAI(rawReply, task.hotelName, task.nights);
      if (aiParsed) parsedQuotes.push(aiParsed);
    }

    const createdQuotes: XianYuQuote[] = [];
    const existingQuotes: XianYuQuote[] = [];

    if (parsedQuotes.length > 0) {
      for (const parsed of parsedQuotes) {
        const pricePerNight = Math.round(parsed.pricePerNight);
        const totalPrice = Math.round(parsed.totalPrice);
        const existingQuote = await prisma.xianYuQuote.findFirst({
          where: {
            taskId,
            sellerId,
            rawReply,
            pricePerNight,
            breakfastIncluded: parsed.breakfastIncluded,
          },
        });
        if (existingQuote) {
          existingQuotes.push(existingQuote);
          continue;
        }

        const quote = await prisma.xianYuQuote.create({
          data: {
            taskId,
            sellerId,
            sellerName: sellerName || null,
            pricePerNight,
            totalPrice,
            breakfastIncluded: parsed.breakfastIncluded,
            cancellable: parsed.cancellable,
            extraServices: JSON.stringify(parsed.extraServices ?? []),
            rawReply,
            aiParsed: manualPricePerNight > 0 ? false : true,
          },
        });
        createdQuotes.push(quote);
      }
    } else {
      const existingQuote = await prisma.xianYuQuote.findFirst({
        where: { taskId, sellerId, rawReply, pricePerNight: 0 },
      });

      if (existingQuote) {
        existingQuotes.push(existingQuote);
      } else {
        // AI 解析失败，存原始回复等待人工处理
        const quote = await prisma.xianYuQuote.create({
          data: {
            taskId,
            sellerId,
            sellerName: sellerName || null,
            pricePerNight: 0,
            totalPrice: 0,
            rawReply,
            aiParsed: false,
          },
        });
        createdQuotes.push(quote);
      }
    }

    const allQuotes = [...createdQuotes, ...existingQuotes];

    // 同步更新消息状态
    await prisma.xianYuMessage.updateMany({
      where: { taskId, sellerId },
      data: { replied: true, replyText: rawReply, repliedAt: new Date() },
    });

    if (isFormSubmit && allQuotes.some((quote) => quote.pricePerNight > 0)) {
      await refreshXianYuQuoteSummary(taskId).catch((error) => {
        console.error("[xianyu/quotes POST] refresh summary error:", error);
      });
    }

    if (isFormSubmit) {
      return NextResponse.redirect(new URL("/admin/hotel", req.url), 303);
    }

    return NextResponse.json({
      quote: allQuotes[0] ?? null,
      quotes: allQuotes,
      parsed: allQuotes.some((quote) => quote.pricePerNight > 0),
      parsedCount: allQuotes.filter((quote) => quote.pricePerNight > 0).length,
      duplicate: createdQuotes.length === 0 && existingQuotes.length > 0,
    });
  } catch (e) {
    console.error("[xianyu/quotes POST] error:", e);
    return NextResponse.json({ error: "服务异常" }, { status: 500 });
  }
}
