/**
 * AI 全网比价模块
 * 并发调用豆包 + 千问，联网搜索酒店价格，整合返回最低价列表
 */

export interface HotelPriceResult {
  hotelName: string;
  roomType: string;
  platform: string;       // 携程 / 美团 / 飞猪 / 同程 等
  pricePerNight: number;  // 元，整数
  totalPrice: number;     // 元，整数
  breakfastIncluded: boolean;
  cancellable: boolean;
  bookingUrl: string;
  source: string;         // 豆包 / 千问
  confidence: "high" | "low" | "estimated";
}

export interface PriceSearchRequest {
  searchType?: "hotel" | "project" | "transport";
  destination: string;
  roomType?: string;
  checkInDate: string;   // YYYY-MM-DD
  checkOutDate: string;  // YYYY-MM-DD
  nights: number;
  guestCount: number;
  roomCount: number;
  budget?: string;
  projectType?: string;
  city?: string;
  transportType?: string;
  fromCity?: string;
  toCity?: string;
}

// ── Prompt 构造 ────────────────────────────────────────────────────────────

type PromptVariant = "primary" | "retry";

interface SourceContext {
  references: Array<{
    index: string;
    title: string;
    url: string;
    platform: string;
  }>;
  urlByRef: Map<string, string>;
  trustedUrls: Set<string>;
}

function buildPrompt(req: PriceSearchRequest, variant: PromptVariant = "primary"): string {
  const searchType = req.searchType ?? "hotel";

  if (searchType === "project") {
    return `你是一个专业的旅游项目公开平台参考价搜索助手，请联网搜索以下旅游项目的公开参考价格。

需求信息：
- 项目名称：${req.destination}
- 项目类型：${req.projectType || "未指定"}
- 所在城市：${req.city || "未指定"}
- 使用日期：${req.checkInDate}
- 使用人数：${req.guestCount}人
${req.budget ? `- 预算参考：${req.budget}` : ""}

请搜索美团、携程、飞猪、去哪儿、大众点评等平台，找出价格较低且可信的4-6个参考选项。
每条都必须引用搜索来源；bookingUrl 填引用编号（例如 [ref_1]），不要自己编造平台链接。没有来源的不要返回。
价格可以是门票、套餐或单项服务参考价，但必须写清楚票种/套餐。

严格按以下 JSON 数组格式返回，不要有任何其他文字：
[
  {
    "hotelName": "项目名称",
    "roomType": "票种/套餐/服务规格",
    "platform": "平台名称（美团/携程/飞猪/去哪儿/大众点评等）",
    "pricePerNight": 单人或单份价格数字,
    "totalPrice": 按使用人数估算的总价数字,
    "breakfastIncluded": false,
    "cancellable": true或false,
    "bookingUrl": "引用编号，如 [ref_1]"
  }
]

注意：
1. 只给平台公开参考价，不要承诺最终可订
2. 最终库存、规则和成交价格以供应商或人工确认为准
3. 按 totalPrice 从低到高排序
4. 只返回 JSON，不要解释`;
  }

  if (searchType === "transport") {
    const isFlight = req.transportType?.includes("机票");
    const platformText = isFlight
      ? "携程、飞猪、去哪儿、同程、航司官网或航司公开渠道"
      : "12306、携程、飞猪、去哪儿、同程等平台";
    const detailText = isFlight
      ? "如果是机票，请返回经济舱等舱位、航司或航班参考。"
      : "如果是高铁/火车，请优先返回二等座、一等座、商务座等席别。";
    return `你是一个专业的机票和高铁公开平台参考价搜索助手，请联网搜索以下交通需求的公开参考价格。

需求信息：
- 出行方式：${req.transportType || "未指定"}
- 出发地：${req.fromCity || "未指定"}
- 目的地：${req.toCity || "未指定"}
- 出发日期：${req.checkInDate}
- 乘坐人数：${req.guestCount}人
${req.budget ? `- 预算参考：${req.budget}` : ""}

请搜索${platformText}，找出价格较低且可信的4-6个参考选项。
${detailText}
每条都必须引用搜索来源；bookingUrl 填引用编号（例如 [ref_1]），不要自己编造平台链接。没有来源的不要返回。

严格按以下 JSON 数组格式返回，不要有任何其他文字：
[
  {
    "hotelName": "出发地到目的地线路名称",
    "roomType": "席别/舱位/班次说明",
    "platform": "平台名称（携程/飞猪/去哪儿/同程/12306/航司等）",
    "pricePerNight": 单人票价数字,
    "totalPrice": 按乘坐人数估算的总价数字,
    "breakfastIncluded": false,
    "cancellable": false,
    "bookingUrl": "引用编号，如 [ref_1]"
  }
]

注意：
1. 只给平台公开参考价，不要承诺最终出票
2. 机票和高铁价格变化快，最终出票价格以人工确认为准
3. 按 totalPrice 从低到高排序
4. 只返回 JSON，不要解释`;
  }

  const roomText = req.roomType ? `${req.roomType}或最接近的基础房型` : "基础房型";
  if (variant === "retry") {
    return `你现在只做公开平台酒店价格搜索。请搜索关键词：${req.destination} ${roomText} ${req.checkInDate} ${req.checkOutDate} 酒店价格 携程 美团 飞猪 去哪儿 同程。

请返回搜索结果中能看到的公开参考价，不要求确认实时库存，不要解释。价格只是给客户看的平台参考价，最终成交价由旅途供应商或人工确认。

只输出 JSON 数组，每条字段固定为：
hotelName, roomType, platform, pricePerNight, totalPrice, breakfastIncluded, cancellable, bookingUrl。

bookingUrl 必须填引用编号（例如 [ref_1]），不要自己编造携程/美团/飞猪/去哪儿/同程的酒店 ID 链接。没有可引用来源的平台不要返回。`;
  }

  return `请联网搜索“${req.destination} ${roomText} ${req.checkInDate} ${req.checkOutDate} 价格 携程 美团 飞猪 去哪儿 同程”。请根据搜索结果摘要给出公开平台参考价，不要求确认实时库存。必须返回 JSON 数组。字段：hotelName, roomType, platform, pricePerNight, totalPrice, breakfastIncluded, cancellable, bookingUrl。bookingUrl 必须填引用编号（例如 [ref_1]），不要自己编造平台酒店 ID 链接；没有可引用来源的平台不要返回。价格只作为平台参考，最终库存、早餐、取消规则和成交价以供应商或人工确认为准。`;
}

// ── 豆包调用（火山方舟）──────────────────────────────────────────────────

async function searchWithDoubao(req: PriceSearchRequest): Promise<HotelPriceResult[]> {
  const apiKey = process.env.VOLCENGINE_API_KEY;
  const model = process.env.VOLCENGINE_MODEL;
  if (!apiKey) throw new Error("VOLCENGINE_API_KEY not set");
  if (!model) throw new Error("VOLCENGINE_MODEL not set");

  const res = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: buildPrompt(req) }],
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`豆包 API 错误 ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  return parseAIResponse(content, "豆包", req);
}

// ── 千问调用（阿里云百炼）──────────────────────────────────────────────────

async function searchWithQianwen(
  req: PriceSearchRequest,
  variant: PromptVariant = "primary",
): Promise<HotelPriceResult[]> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error("DASHSCOPE_API_KEY not set");

  try {
    const res = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "qwen-plus",
        input: {
          messages: [{ role: "user", content: buildPrompt(req, variant) }],
        },
        parameters: {
          result_format: "message",
          temperature: 0.1,
          enable_search: true,
          search_options: {
            search_strategy: "turbo",
            enable_source: true,
            enable_citation: true,
            citation_format: "[ref_<number>]",
          },
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`千问原生搜索 API 错误 ${res.status}: ${err}`);
    }

    const data = await res.json();
    const content = String(
      data.output?.choices?.[0]?.message?.content ??
      data.output?.text ??
      "",
    );
    const sourceContext = buildSourceContext(data, req);
    return parseAIResponse(
      content,
      variant === "retry" ? "千问重试" : "千问",
      req,
      sourceContext,
    );
  } catch (e) {
    console.warn("[priceSearch] 千问原生搜索失败，回退兼容模式:", e);
  }

  const res = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "qwen-plus",
      messages: [{ role: "user", content: buildPrompt(req, variant) }],
      temperature: 0.1,
      enable_search: true,   // 开启联网搜索
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`千问 API 错误 ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  return parseAIResponse(content, variant === "retry" ? "千问重试" : "千问", req);
}

// ── 解析 AI 返回的 JSON ────────────────────────────────────────────────────

function normalizePlatform(platform: unknown, bookingUrl: unknown): string {
  const urlRaw = String(bookingUrl ?? "").toLowerCase();
  if (/ctrip|trip\.com/.test(urlRaw)) return "携程";
  if (/meituan|dianping/.test(urlRaw)) return "美团";
  if (/fliggy|alitrip/.test(urlRaw)) return "飞猪";
  if (/ly\.com|tongcheng/.test(urlRaw)) return "同程";
  if (/qunar/.test(urlRaw)) return "去哪儿";
  if (/tuniu/.test(urlRaw)) return "途牛";
  if (/gzl\.com\.cn/.test(urlRaw)) return "广之旅";
  if (/booking/.test(urlRaw)) return "Booking";
  if (/agoda/.test(urlRaw)) return "Agoda";

  const raw = String(platform ?? "").toLowerCase();
  if (/携程|ctrip|trip\.com/.test(raw)) return "携程";
  if (/美团|meituan|dianping|大众点评/.test(raw)) return "美团";
  if (/飞猪|fliggy|alitrip/.test(raw)) return "飞猪";
  if (/同程|ly\.com|tongcheng/.test(raw)) return "同程";
  if (/去哪儿|qunar/.test(raw)) return "去哪儿";
  if (/途牛|tuniu/.test(raw)) return "途牛";
  if (/广之旅|gzl/.test(raw)) return "广之旅";
  if (/booking/.test(raw)) return "Booking";
  if (/agoda/.test(raw)) return "Agoda";
  const cleaned = String(platform ?? "").trim();
  return cleaned || "平台参考";
}

function isRelevantSourceUrl(url: string, title: string, req: PriceSearchRequest): boolean {
  if ((req.searchType ?? "hotel") !== "hotel") return true;

  const urlLower = url.toLowerCase();
  const isTicketUrl = /(^|[./_-])(piao|ticket|menpiao|tour|tours|route|package|line)([./_-]|$)/.test(urlLower) || /flight|train/.test(urlLower);
  const isHotelUrl = /hotel|hotels|jiudian/.test(urlLower);
  if (isTicketUrl && !isHotelUrl) return false;

  const haystack = `${url} ${title}`.toLowerCase();
  const hasHotelSignal = /酒店|宾馆|客栈|民宿|度假|hotel|inn|resort/.test(haystack);
  const hasTicketSignal = /门票|票务|景点|乐园门票|ticket|piao|menpiao|flight|train/.test(haystack);
  if (hasTicketSignal && !hasHotelSignal) return false;
  return true;
}

function buildSourceContext(data: unknown, req: PriceSearchRequest): SourceContext | undefined {
  const root = data as {
    output?: {
      search_info?: {
        search_results?: Array<{
          index?: string | number;
          title?: string;
          url?: string;
          link?: string;
        }>;
      };
    };
  };
  const rawReferences = root.output?.search_info?.search_results;
  if (!Array.isArray(rawReferences) || rawReferences.length === 0) return undefined;

  const references: SourceContext["references"] = [];
  const urlByRef = new Map<string, string>();
  const trustedUrls = new Set<string>();

  rawReferences.forEach((item, index) => {
    const url = normalizeRawUrl(item.url ?? item.link);
    if (!url) return;
    const title = String(item.title ?? "");
    if (!isRelevantSourceUrl(url, title, req)) return;

    const sourceIndex = String(item.index ?? index + 1);
    const reference = {
      index: sourceIndex,
      title,
      url,
      platform: normalizePlatform(item.title, url),
    };
    references.push(reference);
    trustedUrls.add(url);

    for (const key of [
      sourceIndex,
      `ref_${sourceIndex}`,
      `ref-${sourceIndex}`,
      `[${sourceIndex}]`,
      `[ref_${sourceIndex}]`,
      `[ref-${sourceIndex}]`,
    ]) {
      urlByRef.set(key.toLowerCase(), url);
    }
  });

  return references.length > 0 ? { references, urlByRef, trustedUrls } : undefined;
}

function parseMoney(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return normalizeParsedMoney(value);
  }
  const text = String(value ?? "").replace(/[,，]/g, "");
  const match = text.match(/\d+(?:\.\d+)?/);
  return match ? normalizeParsedMoney(Number(match[0])) : 0;
}

function normalizeParsedMoney(value: number): number {
  const amount = Math.round(value);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return amount > 10000 ? Math.round(amount / 100) : amount;
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
}

function normalizeRawUrl(value: unknown): string {
  const url = String(value ?? "").trim();
  if (!/^https?:\/\//i.test(url)) return "";
  if (/example\.com|localhost|127\.0\.0\.1/i.test(url)) return "";
  if (/0{10,}|123456|abcdef/i.test(url)) return "";
  return url;
}

function isTrustedPriceSourceUrl(url: string): boolean {
  return /(?:ctrip|trip\.com|meituan|dianping|fliggy|alitrip|qunar|ly\.com|tongcheng|tuniu|booking|agoda)\./i.test(url);
}

function resolveSourceReference(value: unknown, sourceContext?: SourceContext): string {
  if (!sourceContext) return "";
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "";

  const direct = sourceContext.urlByRef.get(raw);
  if (direct) return direct;

  const refMatch = raw.match(/\[?ref[_-]?(\d+)\]?/) ?? raw.match(/\[(\d+)\]/);
  const refIndex = refMatch?.[1];
  if (!refIndex) return "";
  return (
    sourceContext.urlByRef.get(`ref_${refIndex}`) ??
    sourceContext.urlByRef.get(`[ref_${refIndex}]`) ??
    sourceContext.urlByRef.get(refIndex) ??
    ""
  );
}

function findPlatformSource(platform: string, sourceContext?: SourceContext): string {
  if (!sourceContext) return "";
  return sourceContext.references.find((reference) => reference.platform === platform)?.url ?? "";
}

function normalizeBookingUrl(
  value: unknown,
  platform: string,
  sourceContext?: SourceContext,
): { url: string; trusted: boolean } {
  const referencedUrl = resolveSourceReference(value, sourceContext);
  if (referencedUrl) return { url: referencedUrl, trusted: true };

  const rawUrl = normalizeRawUrl(value);
  if (rawUrl && sourceContext?.trustedUrls.has(rawUrl)) {
    return { url: rawUrl, trusted: true };
  }

  const platformUrl = findPlatformSource(platform, sourceContext);
  if (platformUrl) return { url: platformUrl, trusted: true };

  return { url: sourceContext ? "" : rawUrl, trusted: false };
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  const text = String(value ?? "").toLowerCase();
  if (/false|no|不可|不支持|不退|取消收费/.test(text)) return false;
  if (/true|yes|可|支持|免费|含/.test(text)) return true;
  return fallback;
}

function parseAIResponse(
  content: string,
  source: string,
  req: PriceSearchRequest,
  sourceContext?: SourceContext,
): HotelPriceResult[] {
  try {
    // 提取 JSON 数组（有时 AI 会在前后加说明文字）
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const raw = JSON.parse(match[0]);
    if (!Array.isArray(raw)) return [];

    const unitCount = req.searchType === "hotel"
      ? Math.max(req.nights || 1, 1) * Math.max(req.roomCount || 1, 1)
      : Math.max(req.guestCount || 1, 1);

    const parsed: HotelPriceResult[] = [];
    for (const item of raw as Record<string, unknown>[]) {
      const explicitTotalPrice = parseMoney(firstPresent(
        item.totalPrice,
        item.total,
        item.totalAmount,
        item.total_price,
      ));
      const unitPrice = parseMoney(firstPresent(
        item.pricePerNight,
        item.price,
        item.amount,
        item.unitPrice,
        item.ticketPrice,
        item.fare,
        item.lowestPrice,
      ));
      const pricePerNight = unitPrice || (explicitTotalPrice > 0 ? Math.max(1, Math.round(explicitTotalPrice / unitCount)) : 0);
      if (pricePerNight <= 0) continue;

      const totalPrice = explicitTotalPrice || pricePerNight * unitCount;
      const rawBookingUrl = firstPresent(
        item.bookingUrl,
        item.sourceRef,
        item.reference,
        item.ref,
        item.sourceUrl,
        item.url,
        item.link,
        item.detailUrl,
        item.booking_url,
      );
      const requestedPlatform = normalizePlatform(item.platform, rawBookingUrl);
      const { url: bookingUrl, trusted } = normalizeBookingUrl(rawBookingUrl, requestedPlatform, sourceContext);
      const platform = bookingUrl ? normalizePlatform(item.platform, bookingUrl) : requestedPlatform;
      const roomType = String(firstPresent(
        item.roomType,
        item.room,
        item.roomName,
        item.productName,
        item.ticketType,
        item.cabin,
        item.seatType,
        "标准大床房",
      ));
      const highConfidence = trusted && isTrustedPriceSourceUrl(bookingUrl);
      parsed.push({
        hotelName: String(firstPresent(item.hotelName, item.name, item.title, req.destination)),
        roomType,
        platform,
        pricePerNight,
        totalPrice,
        breakfastIncluded: parseBoolean(
          firstPresent(item.breakfastIncluded, item.breakfast, item.hasBreakfast, item.meal),
          /含早|早餐/.test(roomType),
        ),
        cancellable: parseBoolean(
          firstPresent(item.cancellable, item.cancelable, item.refundable, item.cancelPolicy),
          !/不可退|不能退|不退/.test(roomType),
        ),
        bookingUrl,
        source,
        confidence: (highConfidence ? "high" : "low") as "high" | "low",
      });
    }

    return parsed;
  } catch {
    console.error(`[priceSearch] 解析 ${source} 返回失败:`, content.slice(0, 200));
    return [];
  }
}

// ── 整合去重排序 ───────────────────────────────────────────────────────────

function mergeResults(allResults: HotelPriceResult[]): HotelPriceResult[] {
  if (allResults.length === 0) return [];

  // 按平台+酒店名+房型去重，保留同平台同房型总价最低的，避免把 AI 返回的多平台来源合并掉。
  const map = new Map<string, HotelPriceResult>();
  for (const item of allResults) {
    const key = `${item.platform}__${item.hotelName}__${item.roomType}`;
    const existing = map.get(key);
    if (!existing || item.totalPrice < existing.totalPrice) {
      map.set(key, item);
    }
  }

  // 按总价升序
  return Array.from(map.values()).sort((a, b) => a.totalPrice - b.totalPrice);
}

function hasSourceUrl(results: HotelPriceResult[]) {
  return results.some((item) => /^https?:\/\//i.test(item.bookingUrl));
}

// ── 主入口：并发查价 ───────────────────────────────────────────────────────

export async function searchHotelPrices(req: PriceSearchRequest): Promise<{
  results: HotelPriceResult[];
  sources: string[];
  errors: string[];
}> {
  const tasks: Promise<
    | { ok: true; data: HotelPriceResult[]; source: string }
    | { ok: false; error: string; source: string }
  >[] = [];

  if (process.env.VOLCENGINE_API_KEY && process.env.VOLCENGINE_MODEL) {
    tasks.push(
      searchWithDoubao(req).then(r => ({ ok: true as const, data: r, source: "豆包" }))
        .catch(e => ({ ok: false as const, error: String(e), source: "豆包" })),
    );
  } else if (process.env.VOLCENGINE_API_KEY && !process.env.VOLCENGINE_MODEL) {
    console.warn("[priceSearch] 已配置 VOLCENGINE_API_KEY，但未配置 VOLCENGINE_MODEL，跳过豆包查价");
  }

  if (process.env.DASHSCOPE_API_KEY) {
    tasks.push(
      searchWithQianwen(req).then(r => ({ ok: true as const, data: r, source: "千问" }))
        .catch(e => ({ ok: false as const, error: String(e), source: "千问" })),
    );
  }

  if (tasks.length === 0) {
    return {
      results: [],
      sources: [],
      errors: ["未配置可用的联网查价模型"],
    };
  }

  const settled = await Promise.all(tasks);

  const allResults: HotelPriceResult[] = [];
  const sources: string[] = [];
  const errors: string[] = [];

  for (const result of settled) {
    if (result.ok) {
      allResults.push(...result.data);
      sources.push(result.source);
    } else {
      errors.push(`${result.source}: ${result.error}`);
      console.error(`[priceSearch] ${result.source} 查价失败:`, result.error);
    }
  }

  const merged = mergeResults(allResults);
  const shouldRetryQianwen =
    (req.searchType ?? "hotel") === "hotel" &&
    process.env.DASHSCOPE_API_KEY &&
    !hasSourceUrl(merged);

  if (shouldRetryQianwen) {
    try {
      const retryResults = await searchWithQianwen(req, "retry");
      if (retryResults.length > 0) {
        allResults.push(...retryResults);
        sources.push("千问重试");
      } else {
        errors.push("千问重试: 空结果");
      }
    } catch (e) {
      const error = `千问重试: ${String(e)}`;
      errors.push(error);
      console.error("[priceSearch] 千问重试失败:", error);
    }
  }

  return {
    results: mergeResults(allResults),
    sources,
    errors,
  };
}
