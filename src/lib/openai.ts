import OpenAI from "openai";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey });
}

/**
 * 生成加好友申请备注
 * 用于机器人发送好友申请时附带的一句话说明
 */
export async function generateFriendRequestNote(params: {
  name: string;
  destination: string;
  travelDate?: string;
  peopleCount: number;
}): Promise<string> {
  const { name, destination, travelDate, peopleCount } = params;
  const prompt = `你是一名旅游顾问助理，帮我写一条微信加好友的申请备注，要简短自然，不超过30字。
客户信息：姓名${name}，想去${destination}，${travelDate ? `出行时间${travelDate}，` : ""}${peopleCount}人出行。
只输出备注内容本身，不要加引号或其他说明。`;

  const res = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 80,
    temperature: 0.7,
  });
  return res.choices[0]?.message?.content?.trim() ?? "您好，我是智行优旅顾问，想为您提供出行服务。";
}

/**
 * 生成通过好友后的开场白
 * 用于机器人在对方通过好友申请后发送的第一条消息
 */
export async function generateOpeningMessage(params: {
  name: string;
  destination: string;
  travelDate?: string;
  peopleCount: number;
  budget?: string;
  notes?: string;
}): Promise<string> {
  const { name, destination, travelDate, peopleCount, budget, notes } = params;
  const prompt = `你是一名旅游顾问，刚刚通过了客户的微信好友申请，请写一条自然友好的开场白消息，不超过80字。
客户信息：${name}，想去${destination}，${travelDate ? `出行时间${travelDate}，` : ""}${peopleCount}人，${budget ? `预算${budget}，` : ""}${notes ? `备注：${notes}` : ""}。
要求：称呼对方名字，简单介绍自己，表示已了解需求，询问是否方便沟通。只输出消息内容本身。`;

  const res = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 150,
    temperature: 0.7,
  });
  return res.choices[0]?.message?.content?.trim() ?? `${name}你好！我是智行优旅的顾问，已收到您的出行需求，方便的话我们来聊聊具体安排吧～`;
}

// ─── 移动端询价成单系统 AI 函数 ───────────────────────────────────────────

/** 用户提交的原始需求结构 */
export interface InquiryRequirements {
  destination?: string;
  checkInDate?: string;   // YYYY-MM-DD
  checkOutDate?: string;  // YYYY-MM-DD
  nights?: number;
  roomCount?: number;
  guestCount?: number;
  budget?: string;
  hotelPreference?: string;
  breakfastIncluded?: boolean;
  cancellable?: boolean;
  needInvoice?: boolean;
  notes?: string;
}

/** AI 分析结果 */
export interface InquiryAnalysisResult {
  structuredData: InquiryRequirements;
  missingFields: string[];   // 字段名列表，如 ["checkInDate", "guestCount"]
  followUpQuestion: string;  // 自然语言追问，当 missingFields.length > 0
  isComplete: boolean;       // 是否信息已足够生成报价
}

/**
 * 分析用户询价需求
 * - 将自由文本 + 已填字段标准化为结构化 JSON
 * - 检测缺失字段
 * - 生成追问话术
 */
export async function analyzeInquiryRequirements(params: {
  rawInput: string;          // 用户自由文本描述
  currentData: Partial<InquiryRequirements>; // 已有结构化字段
}): Promise<InquiryAnalysisResult> {
  const { rawInput, currentData } = params;

  const systemPrompt = `你是旅途的智能询价助手，负责收集用户的酒店出行需求。
请根据用户输入，提取或补全以下字段（JSON 格式输出）：
- destination: 目的地城市
- checkInDate: 入住日期 YYYY-MM-DD
- checkOutDate: 离店日期 YYYY-MM-DD
- nights: 住宿晚数（整数）
- roomCount: 房间数（整数）
- guestCount: 出行人数（整数）
- budget: 预算区间（文字，如 "300-500元/晚"）
- hotelPreference: 位置偏好（如 "市中心" "近海边"）
- breakfastIncluded: 是否含早餐（布尔值）
- cancellable: 是否需要可取消（布尔值）
- needInvoice: 是否需要发票（布尔值）
- notes: 其他备注

必须输出 JSON，格式：
{
  "structuredData": { ...提取到的字段... },
  "missingFields": ["缺失字段名1", "缺失字段名2"],
  "followUpQuestion": "自然追问文字，当有缺失字段时生成，语气亲切简短，一次只问最重要的1-2个",
  "isComplete": true/false
}
isComplete 为 true 的条件：destination、checkInDate、checkOutDate、guestCount 均已知。`;

  const userPrompt = `已有信息：${JSON.stringify(currentData)}
用户新输入：${rawInput || "（无新输入）"}`;

  try {
    const res = await getClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = res.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    return {
      structuredData: parsed.structuredData ?? currentData,
      missingFields: parsed.missingFields ?? [],
      followUpQuestion: parsed.followUpQuestion ?? "",
      isComplete: parsed.isComplete ?? false,
    };
  } catch (err) {
    // 将错误往上抛，让调用方感知（如 quota 超限）
    throw err;
  }
}

/**
 * 生成给用户的价格说明文案
 * 解释为什么先展示公域参考价，以及我们如何帮找低价
 */
export async function generatePriceExplanation(params: {
  destination: string;
  checkInDate?: string;
  checkOutDate?: string;
  avgPublicPrice: number; // 公域参考均价，单位元
}): Promise<string> {
  const { destination, checkInDate, avgPublicPrice } = params;

  const prompt = `你是旅途的顾问助手，请写一段简短说明（不超过80字），告诉用户：
1. 我们已在美团/携程/飞猪等平台查到了${destination}${checkInDate ? `（${checkInDate}入住）` : ""}的参考价格，公开售价约${avgPublicPrice}元/晚起
2. 旅途通过协议价和集采渠道，通常能找到更优惠的方案
3. 不要说"全网最低"或"保证最低价"，说"有机会找到更划算的选项"

语气亲切自然，像朋友推荐一样。只输出文案本身。`;

  const res = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 150,
    temperature: 0.7,
  });
  return (
    res.choices[0]?.message?.content?.trim() ??
    `我们已查询了${destination}主流平台的参考价格，公开售价约${avgPublicPrice}元/晚起。通过旅途的协议渠道，有机会为您找到更划算的选项，帮您省钱省时间。`
  );
}

/**
 * 生成给后台客服的需求简报
 * 包含：需求摘要、意向评级、建议下一步动作
 */
export async function generateStaffSummary(params: {
  requirements: InquiryRequirements;
  orderNo: string;
}): Promise<string> {
  const { requirements, orderNo } = params;

  const prompt = `你是旅途后台系统，请根据以下客户需求，生成一份给客服人员看的简报，不超过150字。
订单号：${orderNo}
需求：${JSON.stringify(requirements, null, 2)}

请包含：
1. 一句话需求摘要
2. 意向程度（高/中/低），判断依据是需求明确程度
3. 建议优先处理内容（如：协议价查询 / 联系客户确认日期 等）

格式：简洁条列，不加多余说明。`;

  const res = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 250,
    temperature: 0.4,
  });
  return (
    res.choices[0]?.message?.content?.trim() ??
    `订单 ${orderNo}：客户询价，需求待确认，请尽快跟进。`
  );
}

// ─── 机器人报价话术 ───────────────────────────────────────────────────────

/**
 * 生成报价话术
 * 用于机器人发送酒店/行程报价时的消息文案
 */
export async function generateQuoteMessage(params: {
  name: string;
  destination: string;
  travelDate?: string;
  peopleCount: number;
  hotelName?: string;
  hotelPrice?: string;
  roomType?: string;
  totalPrice?: string;
  includes?: string;
  notes?: string;
}): Promise<string> {
  const { name, destination, travelDate, peopleCount, hotelName, hotelPrice, roomType, totalPrice, includes, notes } = params;
  const prompt = `你是一名旅游顾问，请根据以下报价信息，写一条发给客户的报价消息，语气自然亲切，不超过150字。
客户：${name}，目的地：${destination}，${travelDate ? `出行时间：${travelDate}，` : ""}${peopleCount}人。
报价信息：${hotelName ? `酒店：${hotelName}，` : ""}${roomType ? `房型：${roomType}，` : ""}${hotelPrice ? `酒店价格：${hotelPrice}，` : ""}${totalPrice ? `总价：${totalPrice}，` : ""}${includes ? `含：${includes}，` : ""}${notes ? `备注：${notes}` : ""}。
要求：称呼客户名字，清晰列出核心报价，结尾询问是否满意或有无其他需求。只输出消息内容本身。`;

  const res = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 250,
    temperature: 0.7,
  });
  return res.choices[0]?.message?.content?.trim() ?? `${name}你好，这是为您准备的报价方案，请查收～`;
}
