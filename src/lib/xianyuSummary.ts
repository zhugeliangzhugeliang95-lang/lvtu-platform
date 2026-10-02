import type { XianYuQuote } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const VOLCENGINE_API_KEY = process.env.VOLCENGINE_API_KEY ?? "";
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY ?? "";
const VOLCENGINE_MODEL = process.env.VOLCENGINE_CHAT_MODEL || process.env.VOLCENGINE_MODEL || "";
const OPEN_MODEL_API_KEY = process.env.OPEN_MODEL_API_KEY || process.env.SILICONFLOW_API_KEY || "";
const OPEN_MODEL_BASE_URL = (process.env.OPEN_MODEL_BASE_URL || process.env.SILICONFLOW_BASE_URL || "https://api.siliconflow.cn/v1").replace(/\/$/, "");
const OPEN_MODEL_NAME = process.env.OPEN_MODEL_NAME || process.env.SILICONFLOW_MODEL || "Qwen/Qwen3-8B";

export interface XianYuQuoteSummary {
  priceRange: { min: number; max: number };
  totalRange: { min: number; max: number };
  withBreakfast: { min: number; max: number } | null;
  withoutBreakfast: { min: number; max: number } | null;
  extraServices: string[];
  recommendation: string;
  lvyoutongPrice: number;
  lvyoutongTotalPrice: number;
  minPricePerNight: number;
  maxPricePerNight: number;
  minTotalPrice: number;
  maxTotalPrice: number;
  withBreakfastMin: number | null;
  withBreakfastMax: number | null;
  withoutBreakfastMin: number | null;
  withoutBreakfastMax: number | null;
  allExtraServices: string[];
  quoteCount: number;
}

type SummaryTask = {
  hotelName: string;
  nights: number;
  guestCount: number;
};

type SummaryQuote = Pick<
  XianYuQuote,
  | "pricePerNight"
  | "totalPrice"
  | "breakfastIncluded"
  | "cancellable"
  | "extraServices"
  | "rawReply"
  | "sellerName"
>;

function parseExtraServices(raw: string | null) {
  try {
    const parsed = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function generateXianYuQuoteSummary(
  quotes: SummaryQuote[],
  task: SummaryTask
): Promise<XianYuQuoteSummary> {
  const validQuotes = quotes.filter((quote) => quote.pricePerNight > 0);

  if (validQuotes.length === 0) {
    return {
      priceRange: { min: 0, max: 0 },
      totalRange: { min: 0, max: 0 },
      withBreakfast: null,
      withoutBreakfast: null,
      extraServices: [],
      recommendation: "暂未收到有效报价，请联系客服继续确认。",
      lvyoutongPrice: 0,
      lvyoutongTotalPrice: 0,
      minPricePerNight: 0,
      maxPricePerNight: 0,
      minTotalPrice: 0,
      maxTotalPrice: 0,
      withBreakfastMin: null,
      withBreakfastMax: null,
      withoutBreakfastMin: null,
      withoutBreakfastMax: null,
      allExtraServices: [],
      quoteCount: 0,
    };
  }

  const prices = validQuotes.map((quote) => quote.pricePerNight);
  const totals = validQuotes.map((quote) => quote.totalPrice);
  const withBreakfast = validQuotes.filter((quote) => quote.breakfastIncluded);
  const withoutBreakfast = validQuotes.filter((quote) => !quote.breakfastIncluded);
  const allExtras = [
    ...new Set(validQuotes.flatMap((quote) => parseExtraServices(quote.extraServices))),
  ];

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minTotal = Math.min(...totals);
  const maxTotal = Math.max(...totals);
  const withBreakfastRange =
    withBreakfast.length > 0
      ? {
          min: Math.min(...withBreakfast.map((quote) => quote.pricePerNight)),
          max: Math.max(...withBreakfast.map((quote) => quote.pricePerNight)),
        }
      : null;
  const withoutBreakfastRange =
    withoutBreakfast.length > 0
      ? {
          min: Math.min(...withoutBreakfast.map((quote) => quote.pricePerNight)),
          max: Math.max(...withoutBreakfast.map((quote) => quote.pricePerNight)),
        }
      : null;

  const summary: XianYuQuoteSummary = {
    priceRange: { min: minPrice, max: maxPrice },
    totalRange: { min: minTotal, max: maxTotal },
    withBreakfast: withBreakfastRange,
    withoutBreakfast: withoutBreakfastRange,
    extraServices: allExtras,
    recommendation: "",
    lvyoutongPrice: minPrice,
    lvyoutongTotalPrice: minTotal,
    minPricePerNight: minPrice,
    maxPricePerNight: maxPrice,
    minTotalPrice: minTotal,
    maxTotalPrice: maxTotal,
    withBreakfastMin: withBreakfastRange?.min ?? null,
    withBreakfastMax: withBreakfastRange?.max ?? null,
    withoutBreakfastMin: withoutBreakfastRange?.min ?? null,
    withoutBreakfastMax: withoutBreakfastRange?.max ?? null,
    allExtraServices: allExtras,
    quoteCount: validQuotes.length,
  };

  const prompt = `你是旅途客服助手，请根据供应商报价汇总，生成一段给客户看的简短报价文案（50字以内，重点突出当前最低价和服务亮点）。

酒店：${task.hotelName}
入住${task.nights}晚，${task.guestCount}人
共收到${validQuotes.length}个供应商报价
每晚价格区间：¥${summary.priceRange.min}~¥${summary.priceRange.max}
含早价格区间：${summary.withBreakfast ? `¥${summary.withBreakfast.min}~¥${summary.withBreakfast.max}` : "暂无含早报价"}
附加服务：${allExtras.length > 0 ? allExtras.join("、") : "无"}

请直接输出文案，不要解释。`;

  const tryAI = async (url: string, key: string, model: string): Promise<string> => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  };

  try {
    if (VOLCENGINE_API_KEY && VOLCENGINE_MODEL) {
      summary.recommendation = await tryAI(
        "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
        VOLCENGINE_API_KEY,
        VOLCENGINE_MODEL
      );
    } else if (OPEN_MODEL_API_KEY) {
      summary.recommendation = await tryAI(
        `${OPEN_MODEL_BASE_URL}/chat/completions`,
        OPEN_MODEL_API_KEY,
        OPEN_MODEL_NAME,
      );
    } else if (DASHSCOPE_API_KEY) {
      summary.recommendation = await tryAI(
        "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        DASHSCOPE_API_KEY,
        "qwen-plus"
      );
    }
  } catch {
    summary.recommendation = "";
  }

  if (!summary.recommendation.trim()) {
    summary.recommendation = `已收到${validQuotes.length}个供应商报价，当前最低¥${minPrice}/晚起。`;
  }

  return summary;
}

export async function refreshXianYuQuoteSummary(taskId: string) {
  const task = await prisma.xianYuTask.findUnique({
    where: { id: taskId },
    include: { quotes: true },
  });

  if (!task) return null;

  await prisma.xianYuTask.update({
    where: { id: taskId },
    data: { status: "AI_ANALYZING" },
  });

  const summary = await generateXianYuQuoteSummary(task.quotes, task);
  const nextTaskStatus = summary.quoteCount > 0 ? "QUOTED" : "NEEDS_HUMAN";

  await prisma.xianYuTask.update({
    where: { id: taskId },
    data: {
      status: nextTaskStatus,
      aiSummary: JSON.stringify(summary),
    },
  });

  await prisma.inquiryOrder.update({
    where: { id: task.inquiryId },
    data: {
      status: summary.quoteCount > 0 ? "PRICE_REFERENCE_READY" : "ABNORMAL",
        aiStaffSummary:
        summary.quoteCount > 0
          ? `供应商报价完成：收到${summary.quoteCount}个有效报价，报价区间¥${summary.priceRange.min}~¥${summary.priceRange.max}/晚，当前最低¥${summary.minPricePerNight}/晚`
          : "供应商报价暂未拿到有效报价，需要客服人工继续确认。",
    },
  });

  return summary;
}
