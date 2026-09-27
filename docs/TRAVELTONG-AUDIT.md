# 旅游通整站深度审计报告

> 审计日期：2026-08-14  
> 审计对象：`/Users/apple/Desktop/旅游通 2/web`  
> 审计方式：只读代码检查、SQLite 只读查询、本地页面检查、TypeScript/ESLint/构建检查。未修改业务代码，未迁移或重置数据库，未启动闲鱼机器人，未登录闲鱼，未发送外部消息。

## 0. 执行结论

当前版本可定义为“可演示 MVP”，综合真实功能成熟度约 **35%**，不应定义为已具备交易闭环的在线旅游平台。

- 已具备：可运行的移动端网站、基础账号注册登录、酒店线索 CRM、统一询价落库、会员数据列表、静态内容展示、部分联网参考价能力、Fly.io 单实例部署配置。
- 部分具备：按业务区分问题的四步询价、访客询价绑定账号、参考价生成、供应商搜价任务模型、通知、角色控制。
- 仅 UI 或演示：AI 助手、旅行团、实测路线、热门目的地、订单状态展示、自动化机器人后台的部分文案。
- 尚未形成：正式报价版本、客户确认后的二次核价、首款凭证与财务核验、真实预订、尾款、退款、售后、旅行团/资讯 CMS、可靠任务队列、全链路审计。
- 当前最大上线风险不是页面完整度，而是公开询价/闲鱼接口越权、公式价格被标成非模拟数据、固定会话密钥回退、以及“确认”直接进入待支付但没有支付业务对象。

## 1. 当前技术栈

| 类别 | 实际情况 | 证据 |
| --- | --- | --- |
| Web 框架 | Next.js 16.2.2，App Router，Webpack 开发/构建 | `package.json`、`src/app/` |
| UI | React 19.2.4、TypeScript 5、Tailwind CSS 4、Lucide、Framer Motion | `package.json` |
| 数据库 | Prisma 6.19.3 + SQLite | `prisma/schema.prisma`、`prisma/dev.db` |
| AI | OpenAI SDK 6.37.0；另预留 DashScope/Volcengine 环境变量 | `src/lib/openai.ts`、`.env` 键名 |
| 密码与会话 | Node `crypto` 派生密码、HMAC Cookie 会话 | `src/lib/password.ts`、`src/lib/userAuth.ts`、`src/lib/adminAuth.ts` |
| 部署 | Docker + Fly.io，持久卷保存 SQLite 和上传文件 | `Dockerfile`、`fly.toml` |
| PWA | 未实现 manifest、service worker、离线缓存、安装提示 | 全库搜索无对应文件或注册代码 |
| 测试 | 未配置测试框架或 `test` script | `package.json`、测试文件搜索 |

已检查环境变量名称且未输出值：`DATABASE_URL`、`ADMIN_USER`、`ADMIN_PASS`、`USER_SESSION_SECRET`、`OPENAI_API_KEY`、`OPENAI_MODEL`、`DASHSCOPE_API_KEY`、`VOLCENGINE_API_KEY`、`VOLCENGINE_MODEL`、`DEV_SMS_CODE`、`SUPPLIER_BOT_TOKEN`、`SUPPLIER_QUOTE_API_PREFIX`。

## 2. 项目目录与关键文件

| 路径 | 责任 | 审计判断 |
| --- | --- | --- |
| `src/app/page.tsx` | 当前移动首页 | 正式入口，内容仍大量来自静态数据 |
| `src/components/AppHeader.tsx` | 顶部城市、消息、客服 | 城市按钮无结果；消息/客服有路由 |
| `src/components/AppBottomNav.tsx` | 五个移动端一级入口 | 真实可导航 |
| `src/components/QuoteWizard.tsx` | 四步统一询价 | 真实提交，但无草稿、幂等和恢复 |
| `src/components/AITravelAssistant.tsx` | AI 助手界面 | 前端关键词规则，不是服务端 AI |
| `src/app/api/inquiry/**` | 询价、参考价、确认、闲鱼任务 | 部分真实，存在严重鉴权和价格可信度问题 |
| `src/app/member/**` | 会员中心 | 多数服务端查询按 `userId` 隔离 |
| `src/app/admin/hotel/**` | 酒店线索 CRM | 当前后台中最完整的真实模块 |
| `src/app/api/admin/**` | CRM、员工、设置、上传 | 大部分有管理员鉴权和部分角色范围 |
| `src/lib/travelData.ts` | 旅行团、路线、服务目录 | 硬编码演示数据 |
| `src/lib/siteData.ts` | 服务、目的地、路线、评价等 | 大量硬编码内容 |
| `src/lib/priceSearch.ts` | 联网参考价搜索 | 只应作为带来源的参考信息 |
| `src/lib/webhook.ts` | 企业微信/飞书/通用 Webhook | 会真实发送，缺投递队列和重试审计 |
| `prisma/schema.prisma` | 28 个模型、17 个枚举 | 可复用基础较多，但缺交易闭环对象 |
| `xianyu-bot/index.js` | 闲鱼自动搜价脚本 | 会打开真实浏览器并发送消息，当前不可生产启用 |
| `Dockerfile`、`fly.toml` | 构建与部署 | 单实例 SQLite 可用，扩容受限 |

仓库当前只有一个初始提交，绝大部分平台代码属于用户的未提交修改。审计期间全部保留，没有清理或回退。

## 3. 当前可运行情况

- `npm run dev -- --port 3001`：成功，Next.js 16.2.2 在 `http://localhost:3001` 启动。
- `GET /api/health`：开发服务运行时返回正常。
- `npm run build`：成功，生成 58 个静态页面；构建路由清单包含 90 余个页面/API 入口，TypeScript 构建阶段通过。
- 页面源码统计：48 个 `page.tsx`、48 个 `route.ts`。
- 一次 `/ai` 和一次独立 `tsc` 异常发生在开发服务器与 `next build` 同时写 `.next` 时；停止并发后页面恢复，独立 `npx tsc --noEmit` 通过。这是构建目录并发污染，不是稳定源码错误。

## 4. 功能判定口径

- **真实完成**：有可达 UI、服务端校验、持久化、权限与可核实结果。
- **部分完成**：有真实数据或服务端逻辑，但缺闭环、可靠性或关键安全控制。
- **只有 UI**：可见页面或按钮存在，没有对应服务端业务结果。
- **硬编码/模拟**：结果来自源码固定数组、公式或前端 state，而非可核验业务来源。
- **尚未开发**：路由、模型、服务和后台操作均不存在。

## 5. 当前真实可用功能

1. 五个一级入口：首页、找低价、AI 助手、发现、我的，均有实际路由。
2. 用户可用手机号或邮箱注册、密码登录、退出；密码存储使用派生哈希，Cookie 为 `httpOnly`、`sameSite=lax`。
3. 访客提交的询价 ID 会写入 `guest_inquiries` HttpOnly Cookie，登录/注册后批量绑定到当前用户。
4. 四步询价会真实调用 `POST /api/inquiry` 创建 `InquiryOrder`，并记录部分状态日志。
5. 会员中心的询价、订单、线索、收藏、通知、搜索记录、反馈等列表查询按当前 `userId` 过滤；订单/反馈/线索详情也带 `userId` 条件。
6. 酒店线索 CRM 可真实看板、查询、筛选、分配、改状态、添加备注、导出、管理员工和设置。
7. 管理后台页面未登录会重定向到 `/admin/login?next=...`；酒店线索 API 使用管理员会话，并对客服/运营/订单角色做部分数据范围控制。
8. 上传接口要求后台登录并限制声明 MIME 类型；文件名由时间戳和随机数生成，并阻断路径穿越。
9. 企业微信/飞书 Webhook 代码会发起真实 HTTP 请求，但当前只能视为“可调用”，不能视为可靠消息系统。

## 6. 只有 UI、无结果按钮与缺失交互

| 位置 | 当前表现 | 判定 |
| --- | --- | --- |
| 首页顶部“东莞” | `<button>` 没有 `onClick`；Playwright 点击后 URL、弹窗和状态均不变 | 明确无结果按钮 |
| 首页搜索 | 主视觉中的输入样式实际上是到 `/ai` 的链接 | 不是真实搜索 |
| 学校切换 | 页面和数据模型均无学校选择/保存能力 | 尚未开发 |
| AI 助手对话 | 回复仅追加到 React state，刷新即丢失 | 纯前端演示 |
| 订单总览 `/orders` | 页面明确声明没有支付和真实订单履约 | 结构占位 |
| 旅行团/路线/目的地筛选 | 标签切换仅在本地 state 中筛当前硬编码集合 | 演示交互 |
| 常用联系人/出行人 | 个人资料只保存昵称和手机号 | 标题超出真实能力 |
| 售后退款 | 只有联系页或状态文案，无案件、退款和操作 API | 尚未开发 |

客服入口是真实路由到 `/contact`，消息入口未登录时会真实跳转 `/login?next=%2Fmember%2Fmessages`，不能归类为无结果按钮。

## 7. 硬编码与模拟数据

1. `src/lib/travelData.ts`：`tourGroups`、`testedRoutes` 和服务目录均为源码常量；团价、团期、预算和实测日期不是 CMS 数据。
2. `src/app/discover/page.tsx`：热门目的地 `places` 写死；页面明确显示“演示数据 3 条”。
3. `src/lib/siteData.ts`：服务、目的地、套餐、酒店集合、机票集合、路线产品、评价、权益等大量文案和价格写死。
4. `src/app/page.tsx`：四个意图、页面编排和精选区均静态配置；团/路线数据从上述静态模块导入。
5. `src/components/AITravelAssistant.tsx:11-25`：`buildReply()` 按关键词返回固定模板，无 API 调用和会话落库。
6. `src/app/api/inquiry/price-compare/route.ts:50-72`：按品牌/房型/日期公式推断酒店基准价。
7. 同一接口 `:138-179`、`:182-214`、`:217-242`：酒店、门票/项目、交通在无真实来源时生成固定平台序列和倍率价格。
8. 同一接口 `:450-466`：无来源的公式结果仍返回 `isMock: false`，只在 `confidence/source` 中弱化，容易被前端和用户误认为真实平台价格。
9. `xianyu-bot/index.js:771-849`：mock 模式生成“供应商 A/B/C”固定报价并写回平台数据库，只能用于开发演示。
10. `prisma/seed.mjs` 与当前 `prisma/dev.db`：`Order`、酒店、机票、高铁、路线等存在种子数据，不代表真实成交、实时库存或可订商品。

## 8. 当前登录、会话与权限

### 用户端

- 注册/登录 API 真实查询和创建 `User`，使用密码哈希，登录成功写入 14 天会话 Cookie。
- `safeReturnPath()` 阻止 `//` 和反斜杠形式的开放重定向。
- 会员页面整体所有权控制较好：例如 `member/orders/[id]` 使用 `{ id, userId }`，询价列表使用 `{ userId }`。
- 严重缺口：`src/lib/userAuth.ts:11` 在缺少 `USER_SESSION_SECRET` 时回退到公开固定字符串；生产环境应直接启动失败。
- 没有验证码、邮箱/手机号验证、忘记密码、会话撤销、设备管理、登录限流或账号删除/数据导出流程。

### 后台

- `AdminUser` 支持 `SUPER_ADMIN`、`OPS`、`SUPPORT`、`ORDER`；后台登录优先数据库账号，也保留 `.env` 单账号兼容。
- 酒店线索 API 对 `SUPPORT` 做“本人 + 未分配新线索”范围，管理设置/员工需要管理角色。
- 严重缺口：`src/lib/adminAuth.ts:9` 也有公开固定密钥回退。
- 当前只有粗粒度角色，没有采购、财务、内容运营等完整职责；也没有每次敏感操作的统一 `AuditLog`。

## 9. 当前询价能力

### 已实现

- `QuoteWizard` 确实有四步：选服务、按业务提问、预算偏好、联系人。
- 酒店、机票、火车票、门票、自助餐、贵宾厅、接送机、包车、旅行团及组合询价有不同问题集。
- 提交后创建 `InquiryOrder`，异步执行 AI/本地完整性判断，并在条件满足时尝试生成参考价。
- 未登录询价可在七天内通过访客 Cookie 绑定到后续注册/登录账号。

### 未实现或有风险

- 表单只保存在组件 state；无数据库草稿、`localStorage` 草稿、刷新恢复或返回恢复。
- 无 `Idempotency-Key`，重复点击、网络重试和多标签页可创建重复询价。
- API 未使用 Zod schema；日期、数字范围、字符串长度、业务字段组合校验不足。
- 所有业务细节被拼成 `notes` 文本，`InquiryOrder` 仍是酒店中心结构，后续采购无法稳定查询。
- 前端创建询价后立即调用“确认”接口，直接进入 `WAITING_PAYMENT`，跳过提交、补充信息、采购、审核、报价和客户意向等阶段。
- 公开详情、更新、价格、确认接口均没有用户会话、访客 Cookie 或所有权校验。

## 10. 当前报价能力

- 有 `InquiryPriceReference` 和联网搜索代码，可保存带来源 URL、`confidence=high` 的公开参考价格。
- 有 `XianYuQuote`、AI 解析和供应商报价摘要，但它们是搜价候选结果，不是对客户发布的正式报价。
- 没有 `Quote`、`QuoteItem`、`QuoteVersion`、审核人、有效期、发布渠道、币种、成本、加价、取消规则快照。
- 没有后台候选报价审核与发布页面，也没有客户对特定报价版本的确认记录。
- 公式兜底价格使用真实平台名称且 `isMock=false`，因此当前报价模块不可作为生产报价依据。

## 11. 当前订单能力

- `Order` 模型和会员订单列表/详情存在，数据库有 8 条记录。
- 订单状态包含待支付、已支付、待出行、已完成、取消、退款中、已退款等展示状态。
- 没有从询价/报价生成订单的可靠领域服务；没有预订供应商、预订编号、确认单、旅客快照、履约时间线。
- `/orders` 明确写明“当前项目还没有支付与真实订单履约”，因此这 8 条只能视为展示/种子数据。

## 12. 当前付款、退款与售后能力

- 没有真实支付接口、支付网关、支付订单、回调签名或对账。
- 没有首款凭证上传、财务审核、审核人、到账时间、金额差异处理。
- `POST /api/inquiry/[id]/confirm` 只收姓名手机号，就把任意询价置为 `WAITING_PAYMENT`；这不是支付能力。
- 状态日志 `remark` 还会写完整姓名和手机号，扩大后台日志中的敏感信息暴露。
- 没有 `Refund`、`AfterSaleCase`、退款审批、原路/线下退款记录、售后附件和 SLA。

## 13. 当前自动化能力

### 旧企业微信/私域机器人

- `RobotLead`、`RobotTask`、`ChatLog` 模型存在。
- 创建线索、标记好友通过、生成报价话术会创建/更新任务和文本。
- `/api/robot/tasks/next` 只读取下一条 `pending`，不原子领取；`/api/robot/tasks/update` 可更新 done/failed；两者均无鉴权。
- 没有消费者租约、attempt、`nextRetryAt`、心跳、超时回收、失败队列、幂等键和人工接管日志。

### 闲鱼供应商搜价

- `XianYuTask`、`XianYuMessage`、`XianYuQuote` 及脚本确实存在。
- `xianyu-bot/index.js:370-447` 会打开聊天页并真实发送消息；`:752-758` 会自动追问；`:1146-1161` 有轮询主循环。
- 风控时会进入人工验证等待（`:555-580`）并触发人工 Webhook（`:583-599`）。
- 新 `POST /api/inquiry/xianyu/pending` 使用事务选取任务并改为 `SEARCHING`，但不是带条件的 compare-and-swap；多并发和 SQLite 行为下仍可能竞领。恢复只根据两分钟 `updatedAt`，没有 worker/lease owner、租约到期和 attempt。
- `src/lib/supplierBotAuth.ts:6-10` 在 token 未配置时直接放行；配置 token 时才校验 Bearer/header。生产环境应改为缺 token 拒绝启动/拒绝请求。
- `/api/inquiry/xianyu/[taskId]` 的 GET/PATCH 无鉴权；GET 暴露卖家、聊天 URL 和报价，PATCH 可任意写状态、发送计数和 AI 摘要。
- 消息、报价、分析等新机器人写接口大多有 token 保护；后台“确认成交”有管理员鉴权。两类接口安全水平不一致。
- 脚本包含降低 webdriver 可检测性的启动参数，且闲鱼自动登录、搜索和发消息涉及平台授权、反自动化条款、账号风控和个人信息处理。P3 之前不得上线运行。

### 自动化逐项结论

| 问题 | 结论 |
| --- | --- |
| 会创建任务吗 | 会，旧 RobotTask 与新 XianYuTask 都可创建 |
| 有消费者吗 | 闲鱼有本地脚本；旧 RobotTask 未发现可靠生产 Worker |
| 会真实执行吗 | 闲鱼脚本会真实浏览和发消息；本次未运行 |
| 有重试吗 | 只有零散循环/恢复，没有持久化重试策略 |
| 有超时吗 | 有部分页面/HTTP 超时，没有统一任务超时 |
| 有失败队列吗 | 没有 |
| 可暂停/人工接管吗 | 有风控人工等待提示，不是完整接管工作流 |
| 会重复执行吗 | 存在竞领和重复发送风险 |
| 会发送外部消息吗 | Webhook 和闲鱼脚本会 |
| 只是生成话术吗 | 旧机器人主要生成话术；闲鱼脚本会发消息 |
| 安全运行边界 | 只允许本地 mock/人工监督验证，不能无人值守生产运行 |

## 14. 当前 AI 能力

- `src/lib/openai.ts` 有真实服务端 OpenAI 调用，用于询价结构化、追问、员工摘要、报价文本等；API key 位于服务端环境变量。
- 询价在无 key 或调用失败时会降级为本地完整性规则，保持流程可继续。
- 前台 AI 助手完全没有调用上述服务：`buildReply()` 是关键词模板，对话仅存在 React state。
- 无 `Conversation`/`Message`，无历史、订单读取、询价创建工具、权限注入、提示词边界、内容安全、成本计量、超时/重试、全局限流。
- 现状下不存在 AI 越权读取订单的已实现路径，但一旦加工具调用，必须由服务端根据会话注入 `userId`，绝不能让模型传入任意用户或订单 ID。

## 15. 当前后台能力

| 能力 | 状态 | 证据/说明 |
| --- | --- | --- |
| 酒店线索看板/列表/详情 | 已真实完成 | `/admin/hotel`、`/admin/hotel/leads/**` |
| 线索分配、状态、备注、导出 | 已真实完成 | `api/admin/hotel-leads/**` |
| 客服账号与基础角色 | 已真实完成 | `/admin/hotel/staff`、`api/admin/staff/**` |
| 站点设置与图片上传 | 部分完成 | 有真实保存/上传，上传安全不足 |
| 用户管理 | 尚未开发 | 无后台用户列表/详情/停用/导出 |
| 正式询价管理 | 尚未开发 | 酒店线索 CRM 不是 `InquiryOrder` 工作台 |
| 采购任务 | 只有模型/脚本 | 无正式采购列表、领取、SLA、指派 |
| 候选报价/审核/发布 | 尚未开发 | 无 Quote 领域模型与后台页面 |
| 客户确认 | 明显错误 | 公开接口直接推进待支付 |
| 订单/预订 | 尚未开发 | 只有前台展示模型和种子数据 |
| 首款/尾款核验 | 尚未开发 | 无凭证和财务工作台 |
| 退款/售后 | 尚未开发 | 无领域模型和后台工作台 |
| 供应商管理 | 尚未开发 | 闲鱼卖家信息散落在任务记录 |
| 旅行团/班期/CMS | 尚未开发 | 前台硬编码 |
| 资讯 CMS | 尚未开发 | 无 Article 模型和管理路由 |
| AI 知识库/客服会话 | 尚未开发 | AI 前台演示 |
| 自动化运行记录 | 需要重构 | 有任务行，无统一 AutomationRun |
| 通知 | 部分完成 | Notification 与 Webhook 存在，缺可靠投递 |
| 权限 | 部分完成 | 酒店 CRM 有粗粒度角色，其余路由不一致 |
| 操作审计 | 尚未开发 | 只有部分状态日志，没有统一 AuditLog |

## 16. 当前旅行团与资讯能力

- 旅行团卡、参考价、标签和咨询入口可见，但数据来自 `src/lib/travelData.ts`，并明确标注“演示数据”。
- 没有旅行团详情业务对象、班期、库存、名额、费用包含/不含、取消政策、上下架、供应商和 CMS。
- “实测路线”与热门目的地是静态内容；“按路线询价”只把标题带入组合询价。
- 未发现正式攻略/资讯列表、文章详情、`Article` 模型、富文本编辑、SEO 发布和后台审核能力。

## 17. 数据库模型与数据现状

Prisma 当前有 28 个模型、17 个枚举。主要可复用模型：

- 身份：`User`、`AdminUser`
- 获客：`Lead`、`HotelLead`、`HotelLeadNote`、`HotelLeadStatusLog`
- 产品展示：`Hotel`、`FlightDeal`、`TrainDeal`、`RoutePackage`、`Destination`、`Activity`
- 会员：`Favorite`、`Feedback`、`Notification`、`PriceSearchRecord`
- 询价：`InquiryOrder`、`InquiryPriceReference`、`InquiryOrderStatusLog`
- 机器人：`RobotLead`、`RobotTask`、`ChatLog`、`XianYuTask`、`XianYuMessage`、`XianYuQuote`
- 展示订单：`Order`

只读行数（未修改 `prisma/dev.db`）：

| 模型 | 行数 | 模型 | 行数 |
| --- | ---: | --- | ---: |
| User | 3 | InquiryOrder | 0 |
| Order | 8 | HotelLead | 20 |
| Hotel | 10 | FlightDeal | 10 |
| TrainDeal | 10 | RoutePackage | 8 |
| Destination | 0 | Activity | 3 |
| InquiryPriceReference | 0 | Notification | 7 |
| RobotLead/RobotTask/ChatLog | 0/0/0 | XianYuTask/Message/Quote | 0/0/0 |

缺少或需要拆分的核心对象：`InquiryItem`、`SourcingTask`、`Supplier`、`SupplierResult`、`Quote`、`QuoteVersion`、`Booking`、`PaymentRecord`、`PaymentProof`、`Refund`、`AfterSaleCase`、`TourProduct`、`TourDeparture`、`TourItineraryDay`、`Article`、`Conversation`、`Message`、`AutomationRun`、`NotificationOutbox`、`AuditLog`。

SQLite 适合当前单实例 P0 和本地开发，但不适合多 Worker 并发领取任务、多人高频后台操作和水平扩容。正式队列/多实例前应迁 PostgreSQL。

## 18. 安全与隐私问题

### 严重

1. **询价 IDOR**：`api/inquiry/[id]` GET/PUT、`[id]/prices` GET、`[id]/confirm` POST 均按外部 ID 直接读取/修改，没有登录、访客 Cookie 或所有权校验。攻击者可读取联系方式、需求、报价和状态，也可越权修改。
2. **闲鱼任务 IDOR/篡改**：`api/inquiry/xianyu/[taskId]` GET/PATCH 无鉴权，暴露供应商聊天 URL、报价，并允许任意改任务状态。
3. **旧机器人 API 无鉴权**：任务读取/完成、线索创建、标记好友、生成报价等接口缺后台或机器人权限。
4. **固定会话密钥**：用户和管理员会话在生产未配环境变量时使用公开 fallback。
5. **虚假价格风险**：无来源公式价仍使用真实平台名并标 `isMock:false`。

### 高/中风险

- 询价、登录、注册、AI、比价和机器人接口无统一限流；只有 `/api/leads` 使用进程内 Map，多实例和冷启动时失效。
- 询价 POST 直接信任宽松 JSON，缺严格 schema、长度/日期/数值边界、幂等和状态转换校验。
- “确认”日志写完整姓名手机号；应只存结构化字段，日志脱敏。
- 上传只信任浏览器 MIME，无文件大小限制、魔数嗅探、图片重编码；允许 SVG，存在脚本/主动内容风险。
- `/api/uploads/[filename]` 永久公开缓存一年，无访问控制；未来付款凭证、证件和确认单绝不能沿用此路径。
- Webhook URL 来自数据库设置，会把联系方式发送到外部；缺出站域名白名单、签名、投递日志、持久重试与数据最小化。
- 当前 Cookie 鉴权的 JSON 写接口没有统一 CSRF token；SameSite=Lax 有一定缓解，但敏感后台操作应增加 Origin 校验/CSRF 防护。
- 没有隐私同意版本、数据保留期限、用户数据导出/删除、证件字段加密策略。
- 未发现直接原生 SQL 或 shell 拼接路径，当前 SQL/命令注入风险较低；主要风险是对象越权和输入/状态校验。

## 19. 移动端与浏览器体验

Playwright 使用真实 Chromium，检查 375x812、390x844、430x932：

| 页面 | 结果 |
| --- | --- |
| `/` | 390 宽 `scrollWidth=390`；无横向溢出，服务和导航可点 |
| `/inquiry` | 390 宽 `scrollWidth=390`，四步及九类业务可见 |
| `/ai` | 无横向溢出；固定输入栏位于底部导航上方；页面明确演示模式 |
| `/discover` | 三个宽度 `scrollWidth` 分别等于 375/390/430；固定导航未遮挡末尾内容 |
| `/member` | 三个宽度均无横向溢出；游客态正确引导登录 |
| `/login`、`/signup` | 三个宽度均无横向溢出；430 下内容高度等于视口，375/390 正常 |
| `/admin/hotel` | 未登录重定向到 `/admin/login?next=%2Fadmin%2Fhotel` |
| `/admin/login` | 三个宽度均无横向溢出 |

已有 `env(safe-area-inset-top/bottom)` 和底部约 82-86px 内容预留，这是可保留的基础。

尚未验证/尚未实现的生产体验：真机微信内置浏览器、Android WebView 差异、软键盘遮挡、断网/弱网恢复、重复提交、长订单号/长酒店名极限数据、PWA 离线与安装、表单刷新/返回恢复。开发模式最初的 console 异常来自 `.next` 并发编译污染，稳定后所测页面 console error 为 0。

## 20. 工程质量检查结果

| 命令 | 结果 | 说明 |
| --- | --- | --- |
| `npx tsc --noEmit` | 最终通过 | 首次与 `next build` 并发导致 `.next/types` 缺失；构建结束后独立运行无输出 |
| `npm run lint` | 通过，31 warnings，0 errors | 主要为 `@next/next/no-img-element` 和未使用 import，不阻塞构建 |
| `npm test` | 失败 | `package.json` 没有 `test` script，且未发现测试套件 |
| `npm run build` | 通过 | Next.js 16.2.2，58 个静态页面生成完成，TypeScript 阶段通过 |

建议 CI 顺序执行 lint、typecheck、test、build，禁止 dev server 与 build 共用同一 `.next` 目录并发运行。

## 21. 准备保留的内容

- 当前五入口移动信息架构、`AppShell`、安全区域和底部导航。
- 按业务动态提问的询价问题集和四步渐进式体验。
- `User`/`AdminUser`、密码哈希、站内安全跳转、会员页面 `userId` 查询模式。
- 酒店线索 CRM 的看板、数据范围、备注、分配、导出和员工管理，作为获客模块独立保留。
- `InquiryOrderStatusLog` 的思路，但需要升级为不可篡改、带操作人的统一事件/审计结构。
- 带真实来源 URL 和高置信度校验的公开参考价结果。
- Fly.io 单实例持久卷方案，作为 P0 短期部署基线。

## 22. 准备重构的内容

- 将酒店中心的 `InquiryOrder` 拆为通用 `Inquiry + InquiryItem`，业务字段结构化。
- 把“参考价”“供应商候选结果”“正式客户报价”分成三个对象和三种 UI，不再混用。
- 引入显式状态机服务，任何 API 不得直接任意写枚举。
- 为所有询价、任务、文件和会员详情统一实现所有权/角色策略。
- 用持久队列和 outbox 替代 fire-and-forget、轮询竞领和进程内限流。
- 将 `Order` 升级为从已确认报价创建的真实订单，并增加预订、付款、退款、售后模型。
- 旅行团/资讯改为 CMS 数据源；AI 助手改为服务端会话 + 受控工具调用。

## 23. 建议删除或下线的内容

以下建议在下一阶段先下线/隔离，再决定是否物理删除；本次未删除任何代码或数据：

- 生产环境禁用公式生成的“平台价”及 `isMock:false` 行为；保留算法只能作为内部估算且不得冠平台名。
- 关闭所有无鉴权旧 `/api/robot/**` 路由，确认无消费者后删除或迁移。
- 移除用户/管理员会话固定密钥 fallback。
- P3 前从部署包和进程启动中隔离 `xianyu-bot`，并禁用 webdriver 隐藏参数和自动发消息路径。
- 不再把 `Order` 种子数据当作真实订单展示；开发数据应显式标记 `demo` 或移入 fixture。
- 后台上传禁用 SVG；私密文件迁到受控对象存储后再清理公开 URL。

## 24. 当前最严重的十个问题

1. 询价详情、修改、价格和确认 API 存在严重 IDOR，可按 ID 越权读取/修改客户数据。
2. 闲鱼任务详情和 PATCH 无鉴权，可泄露供应商信息并篡改自动化状态。
3. 无来源的公式价格使用真实平台名称且返回 `isMock:false`，有虚假价格与消费者信任风险。
4. 用户与后台会话密钥存在公开固定 fallback，生产误配置会导致会话可伪造。
5. 联系方式提交即可把任意询价推进 `WAITING_PAYMENT`，没有状态前置条件、报价版本或付款对象。
6. 没有正式 Quote/Booking/Payment/Refund/AfterSale 模型，订单闭环实际不存在。
7. 旧机器人 API 无鉴权；新机器人 token 未配置时也默认放行，安全策略不一致。
8. 闲鱼任务缺可靠租约、原子领取、持久重试、失败队列和审计，且自动发消息存在平台合规风险。
9. 上传缺大小/内容校验并允许公开 SVG；未来若用于付款或证件会造成高隐私风险。
10. 没有自动化测试；询价、权限、状态机和支付人工核验等高风险路径无法回归保护。

## 25. 完整功能成熟度表

| 领域 | 成熟度 | 当前等级 | 上线判断 |
| --- | ---: | --- | --- |
| 首页与五入口导航 | 75% | 部分完成 | 可作为 MVP 导航；城市/搜索需补 |
| 用户注册登录 | 55% | 部分完成 | 修复 secret、限流、验证/找回后可用 |
| 会员数据隔离 | 65% | 部分完成 | 页面查询较好，公开 API 严重拖累 |
| 统一询价 UI | 65% | 部分完成 | 动态问题可保留，需草稿和结构化 |
| 询价服务端 | 35% | 部分完成且高风险 | 修复 IDOR/幂等/状态机前不可上线 |
| 公开参考价 | 25% | 部分真实 + 高风险模拟 | 只能展示可核验来源结果 |
| 正式报价 | 5% | 尚未开发 | 不可上线 |
| 订单 | 15% | 模型/展示为主 | 不可视为真实订单 |
| 付款与财务核验 | 0% | 尚未开发 | 不可上线 |
| 预订履约 | 0% | 尚未开发 | 不可上线 |
| 退款与售后 | 0% | 尚未开发 | 不可上线 |
| 酒店线索 CRM | 70% | 已真实完成核心 | 可内部试用，先修通用安全项 |
| 完整业务后台 | 20% | 酒店 CRM 以外缺失 | 不可支撑交易闭环 |
| 旅行团前台 | 20% | 硬编码演示 | 只能演示 |
| 旅行团 CMS | 0% | 尚未开发 | 不可运营 |
| 资讯/攻略 CMS | 0% | 尚未开发 | 不可运营 |
| AI 助手 | 10% | 纯前端演示 | 不可宣传为真实 AI 客服 |
| 服务端 AI 辅助 | 35% | 部分完成 | 可做内部草稿，需治理 |
| 企业微信通知 | 25% | 可调用但不可靠 | 需 outbox、重试和脱敏 |
| 闲鱼半自动搜价 | 20% | 开发验证级 | P3 前禁止生产自动发送 |
| 权限与审计 | 25% | 局部完成 | 交易上线前必须重构 |
| 文件与隐私 | 20% | 高风险 | 私密文件能力未建立 |
| 移动端适配 | 70% | 主要页面良好 | 需真机/键盘/弱网测试 |
| PWA/离线 | 0% | 尚未开发 | 非 P0 阻塞项 |
| 测试与可观测性 | 10% | 基本缺失 | 交易功能前必须补齐 |
| 部署 | 55% | 单实例可用 | P0 可沿用，扩容前迁 PostgreSQL |

**综合判断：约 35%，适合继续作为本地/内部演示 MVP；在完成 P0 安全与真实交易工作流前，不适合对外承诺自动报价、支付、预订或无人值守自动化。**
