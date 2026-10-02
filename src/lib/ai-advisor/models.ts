import OpenAI from "openai";
import type { AdvisorMessage, AdvisorTask, KnowledgeSource, TravelProfile } from "@/lib/ai-advisor/types";

const SYSTEM_PROMPT = `你是“旅途AI旅行顾问”，不是通用聊天机器人。品牌主张是“住得更好，花得更少，旅行更省心”。
你的工作仅限：自然沟通、理解出行需求、推荐目的地、规划路线、给出酒店区域/类型建议、整理客户画像并在合适时建议转人工。

必须遵守：
1. 优先依据提供的旅途知识库，不确定的事实要明确说需要核实。
2. 不自动询价，不联系供应商，不付款，不采购，不锁房，不声称掌握实时价格或库存。
3. 不连续抛出表单式问题。每轮最多自然追问1—2个最关键缺失信息。
   先检查当前客户画像和历史消息，已经说过的信息绝不重复询问；“上海出发”应记为出发地上海，而不是目的地。
   用户只说“你好”时先自然打招呼并给出可直接输入的例子，不要立刻抛出一串字段。
4. 普通回答简洁、温暖、专业；复杂规划给出有节奏的分日方案和大致预算分配思路，但不虚构实时价格。
5. 用户有预订、价格、优惠、多人、定制、团队或商务接待意图时，先提供有价值的建议，再自然说明可转人工顾问继续。
6. 不使用“保证最低价”“一定有房”等承诺。
7. 业务模式必须区分：已上架旅行团可以展示正式产品、班期和行程并引导咨询报名；酒店、机票、火车票、门票、套餐、接送、包车和其他服务只负责收集出发地、目的地、日期、人数、预算与偏好，生成旅途预估后交由人工顾问确认，不能把知识库中的线索描述成可直接购买的商品。
8. 知识库没有匹配产品时，要明确说当前产品库暂无完全匹配项，可继续整理需求并由顾问核实，禁止虚构产品名称、价格或班期。`;

type ModelResult = {
  text: string;
  model: string;
  provider: string;
  latencyMs: number;
  usage?: { inputTokens?: number; outputTokens?: number };
};

// 当外部模型明确返回配额耗尽时，短时间内直接走本地顾问，避免每轮
// 都等待一次必定失败的网络请求。配置新的开源模型后会自动恢复尝试。
let modelUnavailableUntil = 0;

type OllamaResponse = {
  message?: { content?: string; thinking?: string };
  response?: string;
  prompt_eval_count?: number;
  eval_count?: number;
};

function ollamaConfig() {
  return {
    baseUrl: (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, ""),
    model: process.env.OLLAMA_MODEL || "deepseek-r1:14b",
  };
}

async function generateWithOllama(params: {
  task: AdvisorTask;
  messages: AdvisorMessage[];
  profile: TravelProfile;
  sources: KnowledgeSource[];
  missingFields: string[];
  highValue: boolean;
}): Promise<ModelResult | null> {
  const { baseUrl, model } = ollamaConfig();
  const started = Date.now();
  const context = params.sources
    .map((source, index) => `[资料${index + 1}｜${source.title}] ${source.excerpt}`)
    .join("\n");
  const state = `当前客户画像：${JSON.stringify(params.profile)}\n尚缺信息：${params.missingFields.join("、") || "无"}\n高价值信号：${params.highValue ? "是" : "否"}`;
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      // DeepSeek-R1 can put the answer in a separate thinking field by default.
      think: false,
      options: {
        temperature: params.task === "COMPLEX_PLAN" ? 0.45 : 0.65,
        num_predict: params.task === "COMPLEX_PLAN" ? 1400 : 700,
      },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `${state}\n\n旅途知识库：\n${context || "暂无匹配资料，请谨慎回答并说明需核实。"}` },
        ...params.messages.slice(-12),
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Ollama ${response.status}`);
  const payload = await response.json() as OllamaResponse;
  const text = payload.message?.content?.trim() || payload.response?.trim();
  if (!text) throw new Error("Ollama returned an empty response");
  return {
    text,
    model,
    provider: "ollama-local",
    latencyMs: Date.now() - started,
    usage: { inputTokens: payload.prompt_eval_count, outputTokens: payload.eval_count },
  };
}

function clientFor(task: AdvisorTask, providerMode: string) {
  const normalizedMode = providerMode.toLowerCase();
  const openModelKey = process.env.OPEN_MODEL_API_KEY || process.env.SILICONFLOW_API_KEY;
  const openModelBaseUrl = (process.env.OPEN_MODEL_BASE_URL || process.env.SILICONFLOW_BASE_URL || "https://api.siliconflow.cn/v1").replace(/\/$/, "");
  const openModelName = process.env.OPEN_MODEL_NAME || process.env.SILICONFLOW_MODEL || "Qwen/Qwen3-8B";
  const wantsOpenModel = normalizedMode === "open-model" || normalizedMode === "siliconflow";

  // SiliconFlow exposes an OpenAI-compatible API for open-weight models. In
  // auto mode it is preferred when configured, so the app does not silently
  // fall back to an unconfigured commercial provider.
  if ((wantsOpenModel || normalizedMode === "auto") && openModelKey) {
    return {
      client: new OpenAI({ apiKey: openModelKey, baseURL: openModelBaseUrl }),
      model: openModelName,
      provider: "open-model",
    };
  }
  if (wantsOpenModel) return null;

  if ((normalizedMode === "auto" || normalizedMode === "deepseek") && task === "COMPLEX_PLAN" && process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_BASE_URL) {
    return {
      client: new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: process.env.DEEPSEEK_BASE_URL }),
      model: process.env.DEEPSEEK_PLANNER_MODEL || "DeepSeek-R1-Distill-Qwen-32B",
      provider: "deepseek-compatible",
    };
  }
  if ((normalizedMode === "auto" || normalizedMode === "volcengine") && process.env.VOLCENGINE_API_KEY && (process.env.VOLCENGINE_CHAT_MODEL || process.env.VOLCENGINE_MODEL)) {
    return {
      client: new OpenAI({ apiKey: process.env.VOLCENGINE_API_KEY, baseURL: "https://ark.cn-beijing.volces.com/api/v3" }),
      model: process.env.VOLCENGINE_CHAT_MODEL || process.env.VOLCENGINE_MODEL!,
      provider: "volcengine",
    };
  }
  if (normalizedMode === "volcengine") return null;
  const apiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
  if (!apiKey || !["auto", "qwen", "dashscope"].includes(normalizedMode)) return null;
  return {
    client: new OpenAI({ apiKey, baseURL: process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1" }),
    model: process.env.QWEN_CHAT_MODEL || "qwen3-14b",
    provider: "dashscope",
  };
}

export async function generateModelReply(params: {
  task: AdvisorTask;
  messages: AdvisorMessage[];
  profile: TravelProfile;
  sources: KnowledgeSource[];
  missingFields: string[];
  highValue: boolean;
}): Promise<ModelResult | null> {
  // The fast local planner is the default. Set AI_PROVIDER=ollama (or
  // AI_USE_OLLAMA=true) to enable the installed Ollama model for deep plans.
  // Use AI_PROVIDER=auto only when a paid compatible API is an intentional
  // fallback; AI_PROVIDER=cloud skips Ollama.
  const providerMode = (process.env.AI_PROVIDER || "auto").toLowerCase();
  const latest = [...params.messages].reverse().find((message) => message.role === "user")?.content.trim() || "";
  // 短句中的出发地和问候由本地规则直接处理，保证关键字段不会被
  // 任意模型误判，也避免模型把一次简单问候变成表单追问。
  if (/^(你好|您好|嗨|哈喽|hello|hi)[!！。\s]*$/i.test(latest)
    || (/^[\u4e00-\u9fa5]{2,10}(?:出发|出行|启程|走)[!！。\s]*$/.test(latest) && !/(?:去|到|目的地|想去)/.test(latest))) {
    return null;
  }
  if (Date.now() < modelUnavailableUntil) return null;
  const canUseLocalPlanner = params.task === "COMPLEX_PLAN" && Boolean(params.profile.destination) && params.missingFields.length <= 1;
  const useOllama = providerMode === "ollama" || process.env.AI_USE_OLLAMA === "true";
  if (providerMode !== "cloud" && (useOllama || providerMode === "auto") && canUseLocalPlanner) {
    try {
      const local = await generateWithOllama(params);
      if (local) return local;
    } catch (error) {
      console.warn("[AI advisor Ollama fallback]", error instanceof Error ? error.message : String(error));
    }
  }

  if (providerMode === "cloud" || !["auto", "volcengine", "qwen", "dashscope", "open-model", "siliconflow", "deepseek"].includes(providerMode)) return null;

  const selected = clientFor(params.task, providerMode);
  if (!selected) return null;
  const started = Date.now();
  const context = params.sources.map((source, index) => `[资料${index + 1}｜${source.title}] ${source.excerpt}`).join("\n");
  const state = `当前客户画像：${JSON.stringify(params.profile)}\n尚缺信息：${params.missingFields.join("、") || "无"}\n高价值信号：${params.highValue ? "是" : "否"}`;
  let response;
  try {
    response = await selected.client.chat.completions.create({
      model: selected.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `${state}\n\n旅途知识库：\n${context || "暂无匹配资料，请谨慎回答并说明需核实。"}` },
        ...params.messages.slice(-12).map((message) => ({ role: message.role, content: message.content })),
      ],
      temperature: params.task === "COMPLEX_PLAN" ? 0.45 : 0.65,
      max_tokens: params.task === "COMPLEX_PLAN" ? 1400 : 700,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    if (/quota|free.?tier|allocationquota|\b403\b|\b429\b/i.test(reason)) modelUnavailableUntil = Date.now() + 5 * 60_000;
    throw error;
  }
  return {
    text: response.choices[0]?.message?.content?.trim() || "我已经记下你的想法了。可以再告诉我最在意的是行程节奏、酒店，还是当地体验吗？",
    model: selected.model,
    provider: selected.provider,
    latencyMs: Date.now() - started,
    usage: { inputTokens: response.usage?.prompt_tokens, outputTokens: response.usage?.completion_tokens },
  };
}
