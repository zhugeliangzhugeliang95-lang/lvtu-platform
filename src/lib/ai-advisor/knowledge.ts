import type { KnowledgeSource } from "@/lib/ai-advisor/types";
import { prisma } from "@/lib/prisma";

const BUILTIN_KNOWLEDGE: KnowledgeSource[] = [
  { id: "dest-sanya", title: "三亚目的地指南", category: "DESTINATION", excerpt: "三亚适合情侣、家庭和休闲度假，通常建议4—6天。亚龙湾更安静、酒店度假感强；海棠湾新酒店多；大东海与市区交通和餐饮更方便。夏秋需留意台风与强日照。" },
  { id: "dest-yunnan", title: "云南慢旅行指南", category: "DESTINATION", excerpt: "云南适合自然、人文和慢节奏旅行。首次到访可选昆明—大理—丽江，7天内不建议再叠加香格里拉；高原地区注意防晒、保暖并预留适应时间。" },
  { id: "dest-chongqing", title: "重庆城市旅行指南", category: "DESTINATION", excerpt: "重庆适合美食、夜景与城市漫游，建议3—5天。住宿可优先考虑解放碑、观音桥或南滨路；山城步行强度较高，行程中需减少来回折返。" },
  { id: "dest-chengdu", title: "成都休闲旅行指南", category: "DESTINATION", excerpt: "成都适合美食、亲子和慢节奏旅行，建议4—6天。市区可安排宽窄巷子、人民公园与博物馆，周边可根据体力选择都江堰、青城山或熊猫基地。" },
  { id: "dest-japan", title: "日本关西旅行指南", category: "DESTINATION", excerpt: "大阪、京都组合适合5—7天。大阪偏美食购物，京都偏古都文化；旺季住宿紧张，跨城不宜频繁搬酒店，建议以1—2个住宿点为主。" },
  { id: "hotel-area", title: "酒店区域选择原则", category: "HOTEL", excerpt: "酒店推荐先按行程动线选择区域，再比较设施和服务。亲子家庭重视空间、早餐和交通；情侣度假重视景观、私密性与公共设施；本阶段仅提供区域和类型建议，不提供实时价格或库存。" },
  { id: "plan-couple", title: "情侣海边5天4晚参考方案", category: "ITINERARY", excerpt: "Day1抵达与酒店休息；Day2海边与日落；Day3小众自然体验；Day4自由活动或轻量水上项目；Day5早餐后返程。中间保留半天弹性，避免连续赶景点。" },
  { id: "plan-family", title: "亲子旅行节奏建议", category: "ITINERARY", excerpt: "亲子行程每天安排1个核心活动即可，午后保留休息；住宿优先交通便利、房间空间与早餐稳定；跨城移动尽量控制在2小时左右。" },
  { id: "faq-service", title: "旅途顾问服务流程", category: "FAQ", excerpt: "AI旅行顾问负责理解需求、推荐目的地、规划路线、整理客户画像。只有已上架旅行团按产品、班期和行程展示；酒店、机票、火车票、门票、套餐、接送、包车和其他定制服务均先收集用户需求，再进入自动或人工问价，不直接承诺实时价格、库存或可订状态。" },
  { id: "faq-change", title: "取消与变更说明", category: "FAQ", excerpt: "取消和变更规则取决于最终选定产品及供应商条款。AI不会承诺可免费取消；人工顾问会在成交前说明具体规则。" },
];

function tokens(text: string) {
  return [...new Set(text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "").split(""))];
}

function lexicalScore(query: string, document: KnowledgeSource) {
  const queryTokens = tokens(query);
  const haystack = `${document.title}${document.excerpt}`.toLowerCase();
  const titleCore = document.title
    .replace(/(?:目的地|酒店|旅行|情侣|亲子|服务流程|取消与变更)?(?:指南|参考方案|原则|说明)/g, "")
    .trim();
  const exactTitle = titleCore.length >= 2 && query.includes(titleCore) ? 30 : 0;
  const exactExcerpt = queryTokens.filter((token) => token.length > 0 && haystack.includes(token)).length;
  return exactTitle + Math.min(exactExcerpt, 12);
}

function cosineSimilarity(left: number[], right: number[]) {
  if (!left.length || left.length !== right.length) return 0;
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] ** 2;
    rightNorm += right[index] ** 2;
  }
  return leftNorm && rightNorm ? dot / Math.sqrt(leftNorm * rightNorm) : 0;
}

async function bgeEmbeddings(input: string[]) {
  const endpoint = process.env.BGE_EMBEDDING_URL;
  if (!endpoint || !input.length) return null;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.BGE_API_KEY ? { Authorization: `Bearer ${process.env.BGE_API_KEY}` } : {}),
      },
      body: JSON.stringify({ model: process.env.BGE_EMBEDDING_MODEL || "BAAI/bge-m3", input }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const payload = await response.json() as { data?: Array<{ index?: number; embedding?: number[] }> };
    const vectors = [...(payload.data ?? [])]
      .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
      .map((item) => item.embedding)
      .filter((item): item is number[] => Array.isArray(item));
    return vectors.length === input.length ? vectors : null;
  } catch {
    return null;
  }
}

async function recall(query: string, documents: KnowledgeSource[]) {
  const lexical = documents.map((document) => ({ document, lexical: lexicalScore(query, document) }));
  const vectors = await bgeEmbeddings([
    query,
    ...documents.map((document) => `${document.title}\n${document.excerpt}`.slice(0, 1_200)),
  ]);
  if (!vectors) {
    return lexical.sort((left, right) => right.lexical - left.lexical).slice(0, 20).map(({ document }) => document);
  }

  const [queryVector, ...documentVectors] = vectors;
  const maxLexical = Math.max(...lexical.map((item) => item.lexical), 1);
  return lexical
    .map((item, index) => ({
      document: item.document,
      // BGE-M3 provides semantic recall while a small lexical contribution
      // preserves exact matches for city and hotel names.
      score: cosineSimilarity(queryVector, documentVectors[index]) * 0.82 + (item.lexical / maxLexical) * 0.18,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 20)
    .map(({ document }) => document);
}

async function loadDocuments(): Promise<KnowledgeSource[]> {
  try {
    const [rows, tours, destinations, activities, packages] = await Promise.all([
      prisma.aIKnowledgeDocument.findMany({ where: { enabled: true }, take: 200, orderBy: { updatedAt: "desc" } }),
      prisma.tourProduct.findMany({
        where: { status: "ONLINE" },
        orderBy: [{ recommended: "desc" }, { updatedAt: "desc" }],
        take: 100,
        include: { departures: { orderBy: { departureDate: "asc" }, take: 4 } },
      }),
      prisma.destination.findMany({ where: { status: "ONLINE" }, orderBy: { sortOrder: "asc" }, take: 100 }),
      prisma.activityProduct.findMany({ where: { status: "ONLINE" }, orderBy: { updatedAt: "desc" }, take: 60 }),
      prisma.packageProduct.findMany({ where: { status: "ONLINE" }, orderBy: { updatedAt: "desc" }, take: 60 }),
    ]);

    const managed: KnowledgeSource[] = rows.map((row) => ({
      id: `knowledge:${row.id}`,
      title: row.title,
      category: row.category,
      excerpt: row.content.slice(0, 700),
    }));
    const tourDocuments: KnowledgeSource[] = tours.map((tour) => {
      const statusLabel = { OPEN: "可报名", ALMOST_FULL: "名额紧张", SOLD_OUT: "已售罄", CLOSED: "已截止", PENDING_CONFIRMATION: "待确认" } as const;
      const departures = tour.departures.map((item) => `${item.departureDate.toISOString().slice(0, 10)}，成人参考价¥${item.adultPrice}/人，${statusLabel[item.status]}`).join("；");
      return {
        id: `tour:${tour.id}`,
        title: tour.name,
        category: "ITINERARY",
        href: `/tours/${tour.slug}`,
        excerpt: `${tour.destination}，${tour.days}天，${tour.tourType}，${tour.departureCity ? `${tour.departureCity}集合或出发` : "集合地以产品说明为准"}。${tour.summary || "具体服务内容以页面及顾问确认为准。"}${departures ? ` 可咨询班期：${departures}。` : " 班期待发布，请联系顾问获取最新安排。"}这是旅途已上架旅行团，可向用户展示产品信息；价格和名额仍需最终确认。`,
      };
    });
    const destinationDocuments: KnowledgeSource[] = destinations.map((destination) => ({
      id: `destination:${destination.id}`,
      title: `${destination.name}目的地资料`,
      category: "DESTINATION",
      href: `/destinations/${destination.slug}`,
      excerpt: `${destination.name}。建议天数：${destination.days || "需结合用户时间规划"}；预算参考：${destination.budget || "需按需求核算"}；适合季节：${destination.season || "出发前核实"}；亮点：${destination.highlights || "根据用户偏好推荐"}。`,
    }));
    const activityDocuments: KnowledgeSource[] = activities.map((activity) => ({
      id: `activity-service:${activity.id}`,
      title: `${activity.name}服务线索`,
      category: "FAQ",
      excerpt: `${activity.location || "目的地当地"}的${activity.category || "体验或门票"}需求：${activity.summary || activity.name}。此内容仅用于帮助收集用户偏好，必须提交需求后问价，不代表实时可售、实时价格或库存。`,
    }));
    const packageDocuments: KnowledgeSource[] = packages.map((item) => ({
      id: `package-service:${item.id}`,
      title: `${item.name}套餐线索`,
      category: "FAQ",
      excerpt: `${item.hotelName ? `相关住宿：${item.hotelName}。` : ""}${item.benefits || "根据用户需求核实套餐内容。"}此内容仅用于需求收集和问价，不是可直接下单的实时产品。`,
    }));
    return [...BUILTIN_KNOWLEDGE, ...managed, ...tourDocuments, ...destinationDocuments, ...activityDocuments, ...packageDocuments];
  } catch {
    return BUILTIN_KNOWLEDGE;
  }
}

async function rerank(query: string, documents: KnowledgeSource[]) {
  const endpoint = process.env.BGE_RERANKER_URL;
  if (!endpoint || !documents.length) return documents.slice(0, 5);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(process.env.BGE_API_KEY ? { Authorization: `Bearer ${process.env.BGE_API_KEY}` } : {}) },
      body: JSON.stringify({ model: process.env.BGE_RERANKER_MODEL || "BAAI/bge-reranker-v2-m3", query, documents: documents.map((item) => item.excerpt), top_n: 5 }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return documents.slice(0, 5);
    const data = await response.json() as { results?: Array<{ index: number }> };
    const ranked = data.results?.map((item) => documents[item.index]).filter(Boolean);
    return ranked?.length ? ranked : documents.slice(0, 5);
  } catch {
    return documents.slice(0, 5);
  }
}

export async function retrieveKnowledge(query: string) {
  const documents = await loadDocuments();
  const recalled = await recall(query, documents);
  if (/旅行团|跟团|小团|团期|班期|参团|报团/.test(query)) {
    const tours = recalled.filter((item) => item.id.startsWith("tour:"));
    const allTours = documents.filter((item) => item.id.startsWith("tour:"));
    const tourFirst = [...tours, ...allTours].filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index);
    return [...tourFirst.slice(0, 5), ...recalled.filter((item) => !item.id.startsWith("tour:")).slice(0, 2)];
  }
  return rerank(query, recalled);
}

export { BUILTIN_KNOWLEDGE };
