# 旅游通 AI 旅行顾问接入说明

本文面向旅游通平台前端、服务端与部署人员。当前版本只覆盖用户沟通、需求理解、旅行规划、客户画像与人工顾问接力，不执行询价、供应商联系、付款、采购或锁房。

## 1. 已接入的平台入口

- 用户端页面：`/ai`
- 带目的地进入：`/ai?destination=三亚`
- 带已有需求进入：`/ai?destination=三亚&prompt=夫妻从广州出发，国庆玩7天，预算10000元`
- 后台工作台：`/admin/ai`
- 对话 API：`POST /api/ai/advisor`
- 转人工 API：`POST /api/ai/advisor/handoff`
- 后台 API：`GET/POST /api/admin/ai`

平台首页、搜索页、目的地/攻略页可以直接跳转到 `/ai`。页面使用现有底部导航和移动端容器，不需要 iframe。

旧入口 `/ai/plan` 会保留参数并跳转到 `/ai`。旧接口 `POST /api/ai/plan` 继续返回原有 `plan` 结构，但响应会带 `Deprecation: true`；新功能应接 `/api/ai/advisor`。

## 2. 对话 API

### 请求

```http
POST /api/ai/advisor
Content-Type: application/json
Origin: https://你的平台域名
```

```json
{
  "sessionId": "advisor_m5l9wk_6t3h8abc",
  "messages": [
    {
      "role": "user",
      "content": "夫妻两个人，从广州出发，国庆去三亚玩7天，预算10000元，不想太累，希望住好一点，还想去小众景点。"
    }
  ],
  "profile": {
    "preferences": []
  }
}
```

约束：

- `sessionId`：8—80 位字母、数字、下划线或连字符；一次会话内保持不变。
- `messages`：按时间正序传递，最多 30 条；服务端只把最近 12 条发给模型。
- `profile`：可选。平台已有的出发地、目的地等信息可提前传入，AI 会继续补全。
- 浏览器写请求必须来自 `APP_ORIGIN` 配置的同源站点。

### 成功响应

```json
{
  "apiVersion": "1",
  "sessionId": "advisor_m5l9wk_6t3h8abc",
  "message": "……",
  "profile": {
    "origin": "广州",
    "destination": "三亚",
    "travelTime": "国庆",
    "travelers": 2,
    "budget": "10,000元左右",
    "travelType": "情侣",
    "preferences": ["景点", "休闲", "小众"],
    "hotelLevel": "高端"
  },
  "missingFields": [],
  "highValue": false,
  "handoffSuggested": false,
  "task": "COMPLEX_PLAN",
  "model": "DeepSeek-R1-Distill-Qwen-32B",
  "provider": "deepseek-compatible",
  "sourceIds": ["dest-sanya", "hotel-area"],
  "sources": [
    {
      "id": "dest-sanya",
      "title": "三亚目的地指南",
      "category": "DESTINATION",
      "excerpt": "……"
    }
  ],
  "quickReplies": ["行程轻松一点", "多安排当地美食", "帮我整理给人工顾问"]
}
```

路由规则：普通咨询使用 Qwen3-14B；包含较多完整条件或明确要求路线规划时使用 DeepSeek-R1-Distill-Qwen-32B。模型未配置或临时失败时，接口仍返回 `LOCAL_FALLBACK` 结果，前台不会中断。

## 3. 转人工 API

只有已经产生过对话记录的 `sessionId` 才能提交。

```http
POST /api/ai/advisor/handoff
Content-Type: application/json
Origin: https://你的平台域名
```

```json
{
  "sessionId": "advisor_m5l9wk_6t3h8abc",
  "customerName": "林先生",
  "contact": "13800138000",
  "note": "下午方便联系"
}
```

成功后返回 `handoffId`、`status: "PENDING"` 与完整客户摘要。后台 `/admin/ai` 会出现待接管记录，人工接管后会把会话与转接记录同时标记为已接管。

摘要固定包含：客户姓名、联系方式、出发城市、目的地、时间、人数、预算、旅行类型、需求、AI 总结与推荐方案。

## 4. 服务端直接调用

同一 Next.js 服务内优先调用模块，不要让服务端再绕 HTTP：

```ts
import { advise, type AdvisorMessage, type TravelProfile } from "@/lib/ai-advisor";

const messages: AdvisorMessage[] = [
  { role: "user", content: "从广州出发，国庆想去海边，2个人，预算1万元" },
];

const result = await advise({
  messages,
  currentProfile: { preferences: [] } satisfies Partial<TravelProfile>,
});
```

`src/lib/ai-advisor/index.ts` 是稳定的模块出口，平台其他业务不应直接依赖内部的 `models.ts`、`knowledge.ts` 或 `profile.ts`。

## 5. 环境变量

最小可运行配置只需要现有数据库和安全配置；不填模型密钥时会使用本地降级回答。生产建议配置：

```bash
QWEN_API_KEY="..."
QWEN_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
QWEN_CHAT_MODEL="qwen3-14b"

DEEPSEEK_API_KEY="..."
DEEPSEEK_BASE_URL="https://你的OpenAI兼容服务/v1"
DEEPSEEK_PLANNER_MODEL="DeepSeek-R1-Distill-Qwen-32B"

BGE_API_KEY="..."
BGE_EMBEDDING_URL="https://你的Embedding服务/v1/embeddings"
BGE_EMBEDDING_MODEL="BAAI/bge-m3"
BGE_RERANKER_URL="https://你的Reranker服务/rerank"
BGE_RERANKER_MODEL="BAAI/bge-reranker-v2-m3"

APP_ORIGIN="https://你的平台域名"
```

`BGE_EMBEDDING_URL` 使用 OpenAI embeddings 兼容响应；`BGE_RERANKER_URL` 接收 `model/query/documents/top_n`。任一服务不可用时会降级到本地关键词召回或未重排结果，不影响对话可用性。

## 6. 数据库上线

AI 表结构迁移文件：

```bash
prisma/migrations/20260918093000_ai_travel_advisor/migration.sql
```

标准生产库执行：

```bash
npx prisma generate
npx prisma migrate deploy
```

本仓库已有的本地 `_prisma_migrations` 表是历史自定义结构，开发环境已通过 `npx prisma db push` 对齐。不要删除、重建或强行修复生产迁移表；部署前应先备份数据库并在预发布环境验证 `migrate deploy`。

## 7. 上线验收

1. 打开 `/ai`，欢迎语和底部导航正常显示。
2. 发送完整复杂需求，画像应识别出发地、目的地、时间、人数与预算，任务应路由为 `COMPLEX_PLAN`。
3. 回答下方应能展开“参考旅游通知识库”。
4. 再发送“这个方案不错，我要订，有没有优惠？”，应出现转人工入口。
5. 提交姓名与联系方式，在 `/admin/ai` 查看待接管记录与客户摘要。
6. 确认页面与回答没有声称实时价格、实时库存、自动询价、自动采购、自动付款或锁房。

回归命令：

```bash
npm run typecheck
npm run test
npm run build
```

## 8. 当前业务边界

AI 可以：自然对话、推荐目的地、规划路线、给出酒店区域/档次建议、整理需求、识别高价值客户并转人工。

AI 不可以：自动询价、闲鱼询价、联系供应商、付款、采购、锁房或承诺实时价格/库存。所有成交与履约行为继续由人工旅行顾问和平台现有订单流程完成。
