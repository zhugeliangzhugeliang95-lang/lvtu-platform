# 旅游通正式重构实施蓝图

> 基于 2026-08-14 审计结果。目标不是一次性重写整站，而是在保留现有移动体验与酒店线索 CRM 的前提下，先建立可审计的人工代订闭环，再逐步建设 CMS、AI 和外部自动化。

## 0. 总体原则

1. **先真实、后自动**：先让人工采购、审核、财务和预订在系统内完整工作，再给 AI 或渠道机器人开放受控工具。
2. **参考价不等于报价**：公开参考价、供应商候选结果、正式客户报价必须分表、分权限、分文案。
3. **状态只能通过命令变化**：页面和通用 PATCH 不得直接写状态枚举；每个转换要校验角色、前置条件和版本。
4. **身份由服务端决定**：用户、管理员、任务 Worker 的主体 ID 均从验证后的会话/token 注入，不能信任请求体中的所有者 ID。
5. **敏感文件默认私有**：付款凭证、证件、预订确认单使用私有对象存储和短时签名 URL，不能复用公开 `/api/uploads`。
6. **保留历史，不原地破坏**：旧 `HotelLead` 继续作为获客线索；旧 `InquiryOrder` 通过映射迁移到新 `Inquiry`，不直接重命名和删除。
7. **P0 允许单实例 SQLite**：在明确单实例、无并发 Worker 的前提下完成最小闭环；引入队列和横向扩容前迁 PostgreSQL。

## 1. 推荐目标架构

```text
移动 Web / 管理后台
        |
Next.js Route Handlers + Server Components
        |
身份与策略层 ---- 用户 Session / 管理员 RBAC / Worker Token
        |
领域服务层
  Inquiry | Sourcing | Quote | Order | Payment | Booking | After-sale | CMS
        |
Prisma Repository + Transaction + Audit/Event Writer
        |
P0: SQLite 单实例
P1+: PostgreSQL + Redis/持久队列 + 私有对象存储
        |
Outbox Worker ---- 企业微信 / 邮件短信 / AI / 经授权供应商接口
```

建议在现有单体内采用“模块化单体”，不要 P0 就拆微服务。目录建议：

```text
src/modules/
  auth/
  inquiry/
  sourcing/
  quote/
  order/
  payment/
  booking/
  after-sale/
  cms/
  notification/
  audit/
src/lib/
  db/
  security/
  validation/
  storage/
  queue/
```

每个模块至少包含 `schema.ts`（Zod 输入）、`policy.ts`（权限/所有权）、`service.ts`（事务和状态转换）、`repository.ts`（复杂查询，可选）和测试。Route Handler 只做解析、鉴权、调用 service、映射响应。

## 2. 前端路由规划

### P0 用户端

| 路由 | 用途 | 处理方式 |
| --- | --- | --- |
| `/inquiry` | 新建/继续草稿 | 保留四步设计，改为服务端草稿 |
| `/inquiry/[id]/edit` | 补充资料 | 新增；按询价类型渲染字段 |
| `/inquiry/[id]` | 询价进度时间线 | 替代多个语义重叠详情页 |
| `/inquiry/[id]/quotes` | 查看已发布报价版本 | 只显示已发布且未撤回版本 |
| `/inquiry/[id]/quotes/[quoteId]` | 报价明细与确认意向 | 展示有效期、规则、包含项 |
| `/orders` | 我的订单列表 | 登录后读取真实订单 |
| `/orders/[id]` | 订单进度 | 付款、预订、尾款、售后时间线 |
| `/orders/[id]/deposit` | 上传首款凭证 | 私有文件上传，不做在线支付 |
| `/orders/[id]/booking` | 查看确认单 | 仅订单所有者签名访问 |
| `/orders/[id]/after-sale` | 发起售后 | P0 可先人工工单，P1 完整化 |
| `/member/inquiries` | 我的询价 | 保留，改用新 Inquiry |
| `/member/orders` | 我的订单 | 保留，改用真实 Order |
| `/member/messages` | 业务通知 | 保留，增加已读与跳转目标 |

现有 `/inquiry/[id]/prices` 可在兼容期重定向到 `/inquiry/[id]/quotes`；`/confirm`、`/service`、`/success` 保留短期兼容，但不得再直接推进支付状态。

### P1-P2 用户端

- `/tours`、`/tours/[slug]`：旅行团列表/详情。
- `/articles`、`/articles/[slug]`：攻略资讯。
- `/ai`、`/ai/[conversationId]`：服务端 AI 会话。
- `/member/travelers`：常用联系人/出行人，明确同意后再收集证件。
- `/privacy/requests`：数据导出和删除申请。

首页顶部城市按钮在 P1 实现为真实出发城市选择并持久化；在此之前应改为静态文本。首页“搜索”要么建设全站搜索，要么明确为“向 AI 描述需求”，不可继续伪装输入框。

## 3. 后台路由规划

| 路由 | 角色 | 能力 |
| --- | --- | --- |
| `/admin/inquiries` | 客服、采购、运营、管理员 | 询价队列、缺失信息、SLA、分配 |
| `/admin/inquiries/[id]` | 客服、采购 | 需求、沟通、状态、审计时间线 |
| `/admin/sourcing` | 采购、管理员 | 待采购任务、领取、超时、人工接管 |
| `/admin/sourcing/[id]` | 采购 | 录入供应商结果、附件、规则 |
| `/admin/quotes` | 报价审核、管理员 | 待审核/已发布/过期报价 |
| `/admin/quotes/[id]` | 采购、审核 | 版本、成本、售价、规则、审核发布 |
| `/admin/orders` | 客服、财务、预订 | 真实订单列表与异常队列 |
| `/admin/orders/[id]` | 分角色 | 付款、预订、尾款、售后时间线 |
| `/admin/payments` | 财务、管理员 | 待核验凭证、金额差异、拒绝原因 |
| `/admin/bookings` | 预订、管理员 | 待预订、确认单、供应商编号 |
| `/admin/refunds` | 财务、售后 | 退款审核与执行记录 |
| `/admin/after-sales` | 客服、售后 | 工单、SLA、处理记录 |
| `/admin/suppliers` | 采购主管、管理员 | 供应商、渠道、授权和风险标签 |
| `/admin/tours/**` | 内容运营 | 产品、班期、行程、上下架 |
| `/admin/articles/**` | 内容运营 | 草稿、审核、发布、SEO |
| `/admin/ai/**` | 管理员、AI 运营 | 知识库、会话抽检、成本与安全 |
| `/admin/automation` | 管理员、运维 | 任务运行、失败、重试、暂停 |
| `/admin/audit` | 超级管理员/审计 | 敏感操作审计，不允许业务角色修改 |

现有 `/admin/hotel/**` 继续作为“酒店获客线索”模块，导航中与“正式询价/订单”分组，避免用户误以为它已经覆盖交易后台。

## 4. 数据库模型变更

### 4.1 保留与复用

| 现有对象 | 决策 | 说明 |
| --- | --- | --- |
| `User` | 保留并扩展 | 增加状态、验证时间、隐私同意版本；不直接塞证件 |
| `AdminUser` | 保留并扩展 | 角色改为关联权限或更完整枚举 |
| `HotelLead` 及备注/日志 | 保留 | 仅负责获客 CRM，可转化为 Inquiry |
| `InquiryOrder` | 兼容读取后迁移 | 不原地破坏，映射到新 Inquiry |
| `InquiryPriceReference` | 重命名语义/迁移 | 只存公开参考价与来源，不作为报价 |
| `InquiryOrderStatusLog` | 迁移到领域事件/审计 | 历史只读保留 |
| `XianYuTask/Message/Quote` | P3 隔离复用 | 作为渠道原始结果，不直接对客 |
| `Notification` | 保留并扩展 | 增加类型、实体引用、已读、投递状态 |
| `Order` | 数据评估后迁移 | 种子数据与真实数据先区分 |

### 4.2 P0 必需新增

| 模型 | 核心字段 |
| --- | --- |
| `Inquiry` | `id/orderNo/userId/guestToken/type/status/version/assignedTo/submittedAt/createdAt` |
| `InquiryItem` | `inquiryId/serviceType/dataJson/schemaVersion/sortOrder` |
| `SourcingTask` | `inquiryId/status/assigneeId/leaseOwner/leaseUntil/attempt/nextRetryAt/deadlineAt` |
| `Supplier` | `name/type/status/contactEncrypted/authorizationNote/riskLevel` |
| `SupplierResult` | `taskId/supplierId/rawDataJson/cost/currency/availability/rules/sourceUrl/verifiedAt` |
| `Quote` | `inquiryId/status/currentVersionId/customerConfirmedVersionId` |
| `QuoteVersion` | `quoteId/version/currency/subtotal/fee/total/validUntil/createdBy/reviewedBy/publishedAt` |
| `QuoteItem` | `quoteVersionId/inquiryItemId/title/description/cost/salePrice/quantity/rulesJson/supplierResultId` |
| `Order` 扩展或 `BookingOrder` | `quoteVersionId/userId/status/version/depositRequired/balanceDue` |
| `PaymentRecord` | `orderId/type/expectedAmount/receivedAmount/status/reviewerId/reviewedAt` |
| `PaymentProof` | `paymentId/storageKey/contentType/size/uploadedBy/checksum` |
| `Booking` | `orderId/status/supplierId/supplierBookingNo/confirmedAt/confirmationStorageKey` |
| `AuditLog` | `actorType/actorId/action/entityType/entityId/beforeJson/afterJson/requestId/ipHash/createdAt` |
| `NotificationOutbox` | `eventType/payloadJson/status/attempt/nextRetryAt/provider/dedupeKey` |

`InquiryItem.dataJson` 是 P0 的务实选择，但必须带 `serviceType + schemaVersion` 并用 Zod 解析；高频可查询字段（城市、开始/结束日期、人数）放 Inquiry 或专门索引列，不能把所有信息永远塞 JSON。

### 4.3 P1-P2 新增

- 出行人：`TravelerProfile`、`Traveler`，证件信息单独加密，按最小需要收集。
- 售后：`Refund`、`AfterSaleCase`、`AfterSaleMessage`、`AfterSaleAttachment`。
- CMS：`TourProduct`、`TourDeparture`、`TourItineraryDay`、`TourPriceRule`、`Article`、`MediaAsset`。
- AI：`Conversation`、`Message`、`ToolInvocation`、`KnowledgeDocument`、`KnowledgeChunk`、`AiUsageRecord`。
- 自动化：`AutomationRun`、`AutomationAttempt`、`DeadLetter`。

### 4.4 约束与索引

- 所有金额用最小货币单位整数 + `currency`，不使用浮点数。
- `orderNo`、`quoteNo`、`paymentNo` 唯一；幂等键按 `actor + endpoint + key` 唯一。
- 状态转换使用 `version` 乐观锁：`updateMany({ where: { id, version, status: expected } })`。
- 对 `status/assigneeId/createdAt`、`userId/updatedAt`、`leaseUntil/status` 建组合索引。
- 私密数据字段标注保留期限，日志只存脱敏快照或哈希。

## 5. 询价状态机

推荐状态：

```text
DRAFT -> SUBMITTED -> NEEDS_INFO -> SUBMITTED
                    -> SOURCING_QUEUED -> SOURCING
                    -> RESULTS_PENDING_REVIEW
                    -> QUOTE_READY -> QUOTED
                    -> QUOTE_EXPIRED
                    -> NO_AVAILABILITY
任何非终态 -> CANCELLED（受权限和后续订单约束）
```

| 转换 | 触发者 | 前置条件 | 通知/审计 |
| --- | --- | --- | --- |
| DRAFT -> SUBMITTED | 所有者/客服代录 | 必填项通过对应 schema；幂等键有效 | 通知客服；记录字段版本 |
| SUBMITTED -> NEEDS_INFO | 客服/采购 | 明确缺失字段和问题 | 通知客户补充 |
| SUBMITTED -> SOURCING_QUEUED | 系统/采购 | 信息完整、服务项可采购 | 创建任务同事务提交 |
| SOURCING_QUEUED -> SOURCING | 采购/Worker | 原子领取成功、租约有效 | 记录领取人/租约 |
| SOURCING -> RESULTS_PENDING_REVIEW | 采购/Worker | 至少一个候选结果或明确无结果 | 通知审核队列 |
| RESULTS_PENDING_REVIEW -> QUOTE_READY | 报价审核 | 报价版本校验通过 | 记录审核人 |
| QUOTE_READY -> QUOTED | 客服/系统 | 已发布版本、有有效期 | 通知客户，保存发布快照 |
| QUOTED -> QUOTE_EXPIRED | 系统 | `validUntil` 到期且未确认 | 通知客户/客服 |
| 任意采购态 -> NO_AVAILABILITY | 采购审核 | 有人工确认的无房/无票结论 | 记录原因和来源 |

不允许用户提交联系方式就进入付款。回退只允许显式命令，例如审核驳回到 `SOURCING`，必须填写原因并产生 AuditLog。

## 6. 客户意向与订单状态机

将“询价状态”和“订单状态”分开。客户确认意向先记录在 Quote 上，随后创建订单：

```text
Quote: QUOTED -> CUSTOMER_INTERESTED -> RECHECKING
               -> RECHECK_FAILED / RECHECK_CONFIRMED

Order: DEPOSIT_PENDING -> DEPOSIT_REVIEWING
       -> DEPOSIT_REJECTED -> DEPOSIT_PENDING
       -> DEPOSIT_CONFIRMED -> BOOKING_IN_PROGRESS
       -> BOOKED -> BALANCE_PENDING -> COMPLETED
       -> REFUND_PENDING -> REFUNDED
       -> AFTER_SALE
       -> CANCELLED
```

关键规则：

- `CUSTOMER_INTERESTED` 必须引用客户看到的 `QuoteVersion`；报价过期先二次核价。
- `RECHECK_CONFIRMED` 由采购填写最新库存、成本、有效截止时间；金额变化必须生成新版本并让客户再次确认。
- `DEPOSIT_REVIEWING` 需要有效付款凭证、声明金额与付款时间；仅财务可确认。
- `DEPOSIT_CONFIRMED` 必须记录财务操作人和实际到账金额，不能由客服/采购代替。
- `BOOKED` 必须有供应商预订编号或确认单以及预订操作人。
- `COMPLETED` 前校验行程/服务结束、尾款状态和未关闭售后。
- 退款和售后不直接覆盖主订单历史；使用独立对象关联订单。
- 每次转换采用乐观锁、事务写 AuditLog，并通过 outbox 异步通知。

## 7. 角色与权限

推荐角色：

| 角色 | 核心权限 |
| --- | --- |
| `CUSTOMER` | 自己的询价、报价、订单、凭证、售后 |
| `SUPPORT` | 客户沟通、补充资料、查看已授权业务数据，不可审核付款 |
| `SOURCING` | 领取采购任务、录入供应商结果，不可发布自己未经审核的报价 |
| `QUOTE_REVIEWER` | 审核价格、规则和有效期，发布报价 |
| `FINANCE` | 查看付款必要信息、核验到账、执行退款记录 |
| `BOOKING` | 执行预订、上传确认单、更新履约 |
| `AFTER_SALES` | 售后案件、退款申请，不可自行确认财务到账 |
| `CONTENT_OPS` | 旅行团/文章草稿与发布，不能访问付款凭证 |
| `OPS_ADMIN` | 业务配置、分配、报表，不自动拥有超级密钥权限 |
| `SUPER_ADMIN` | 账号、权限、审计与紧急操作；高风险操作二次确认 |
| `WORKER` | 仅调用任务领取/心跳/结果提交，不具备后台页面会话 |

实现方式：`requireUser()`/`requireAdminApi()` 之上增加 `authorize(action, resource)`；资源所有权和数据范围写在 policy 层，不在各页面复制条件。API 响应按角色裁剪字段，供应商联系方式、客户手机和付款凭证不能全量下发。

## 8. API 规划

### 身份与安全

- `POST /api/auth/login|signup|logout`：增加 Zod、分布式限流、审计和会话撤销版本。
- `POST /api/auth/password/reset-request|reset`：接入真实验证渠道后再开放。
- `GET /api/me`：返回最小当前主体信息。
- 生产启动校验 `USER_SESSION_SECRET`、`ADMIN_SECRET`、`SUPPLIER_BOT_TOKEN`，缺失立即失败。

### 询价

- `POST /api/inquiries`：创建草稿，支持 `Idempotency-Key`。
- `GET/PATCH /api/inquiries/[id]`：统一所有权策略和版本号。
- `POST /api/inquiries/[id]/submit`：校验并状态转换。
- `POST /api/inquiries/[id]/request-info`、`/queue-sourcing`、`/cancel`：显式命令。
- `GET /api/inquiries/[id]/timeline`：返回客户可见事件。

### 采购与报价

- `POST /api/sourcing/tasks/[id]/claim|heartbeat|release`：租约式领取。
- `POST /api/sourcing/tasks/[id]/results`：幂等录入候选结果。
- `POST /api/quotes`、`POST /api/quotes/[id]/versions`。
- `POST /api/quote-versions/[id]/submit-review|approve|reject|publish`。
- `POST /api/quote-versions/[id]/confirm-interest`：只允许询价所有者。
- `POST /api/quotes/[id]/recheck`：采购二次核价。

### 订单与付款

- `POST /api/orders/from-quote`：仅从已确认且有效的报价版本创建，幂等。
- `GET /api/orders/[id]`：所有者或有权限员工。
- `POST /api/orders/[id]/payment-proofs`：预签名上传 + 元数据登记。
- `POST /api/payments/[id]/submit-review|confirm|reject`：财务命令。
- `POST /api/orders/[id]/bookings`、`/bookings/[id]/confirm`。
- `POST /api/orders/[id]/refunds`、`/after-sales`。

所有写 API 统一返回 `requestId`，错误结构统一为 `{ code, message, fieldErrors?, requestId }`。旧 `/api/inquiry/**` 在 P0 期间增加鉴权后做代理，迁移完成再下线。

## 9. 后台任务队列规划

### P0 SQLite 单实例

- 先用数据库任务表 + 单独 Worker 进程，明确只运行一个消费者。
- 领取采用带条件的原子更新：只更新 `PENDING` 或租约已过期且 `version` 匹配的行。
- 字段：`status`、`leaseOwner`、`leaseUntil`、`attempt`、`maxAttempts`、`nextRetryAt`、`lastErrorCode`、`dedupeKey`。
- Worker 每 30 秒心跳；超过租约才可恢复；指数退避并加随机抖动。
- 超过最大次数写 `DEAD_LETTER`，后台允许人工查看和显式重试。

### P1+ PostgreSQL

- 迁 PostgreSQL 后使用 `FOR UPDATE SKIP LOCKED` 对应的可靠队列库，或采用 BullMQ + Redis。
- 业务事务与外部消息使用 transactional outbox，避免“数据库成功、通知失败”。
- 每次执行写 `AutomationRun/Attempt`，原始错误脱敏并设置保留期限。

## 10. 闲鱼半自动搜价边界

P3 前默认关闭。只有满足以下条件才可灰度：

1. 获得账号所有者明确授权并完成平台条款/法律合规评估。
2. 不绕过验证码、反自动化检测、登录限制或平台权限；移除隐藏 webdriver 的参数。
3. 搜索与候选信息收集可自动，首次联系、追问和报价采信必须人工确认。
4. 对每个客户需求和卖家设置消息上限、冷却期、工作时间和一键停止。
5. 不向卖家发送客户姓名、手机号、证件或付款信息；只发送采购所需最小需求。
6. 原始卖家回复仅内部可见，正式报价必须经过人工审核并生成 QuoteVersion。
7. Token 必配、定期轮换，API 仅内网或受网关保护；任务详情也必须鉴权。
8. 风控、投诉、验证码或异常页面立即暂停账号级自动化并通知人工。

## 11. 企业微信接入方式

- P0 继续使用群机器人只做“有新待办”通知，不在消息中发送完整手机号/付款凭证。
- 由 `NotificationOutbox` Worker 投递，记录 provider message ID、attempt、响应码和下一次重试时间。
- 配置 Webhook 域名白名单，只允许企业微信官方域名；密钥不写数据库明文日志。
- 消息链接进入后台并再次鉴权，不能把带敏感参数的直链发到群里。
- P2 若做一对一客服，使用企业微信正规应用/客户联系 API，处理回调签名、事件幂等、客户授权、离职继承和数据保留。
- 外部 Webhook 不得直接改变订单/付款状态；只产生经过签名验证的事件，再由领域服务校验。

## 12. AI 客服、知识库与工具调用

### 架构

- `Conversation/Message` 保存会话，消息区分用户、助手、员工、工具。
- 知识库只收录审核发布的服务规则、旅行团、退款政策和 FAQ；分块带版本、生效时间和来源。
- 服务端先鉴权，再把当前 `userId`、允许的工具和资源范围注入执行上下文。
- 工具使用严格 JSON schema；模型不能自选任意 `userId/orderId`。

### 首批只读工具

- `get_my_inquiries()`、`get_my_order(orderId)`、`search_tours(filters)`、`get_policy(topic)`。
- 返回脱敏、最小字段，并在 service 层再次校验所有权。

### 后续写工具

- `create_inquiry_draft()`、`add_inquiry_information()`、`request_human_handoff()`。
- 写操作先生成确认卡，用户明确确认后才执行；付款确认、退款执行、报价发布永不由 AI 自主完成。

### 安全与成本

- 提示词注入防护：知识内容视为数据，不执行其中指令；工具权限与模型文本分离。
- 输入/输出内容安全、速率限制、每日预算、token 统计、超时、降级、会话删除。
- 对价格、房态、订单状态要求工具返回；模型不得凭语言模型知识编造。

## 13. 旅行团 CMS

`TourProduct` 保存标题、目的地、天数、卖点、费用说明、取消政策、状态和 SEO；`TourDeparture` 保存班期、出发城市、价格、名额、最低成团数和供应状态；`TourItineraryDay` 保存每日行程。

发布流程：`DRAFT -> REVIEW -> PUBLISHED -> OFFLINE`。只有审核后的版本对外，历史订单引用不可变产品/班期快照。前台展示“参考价”或“已确认班期”必须依据字段，不允许由文案自由声明。

P1 验收至少覆盖：新建草稿、每日行程、费用包含/不含、取消政策、班期、名额、上下架、详情页、搜索筛选、咨询时绑定具体 `TourProduct/TourDeparture`。

## 14. 资讯 CMS

- `Article`：`slug/title/summary/bodyJson/coverAssetId/category/tags/status/author/reviewer/publishedAt/seo`。
- 富文本/结构化编辑器输出需服务端消毒；媒体统一进 `MediaAsset`。
- 发布流程同样需要草稿、审核、发布、下线；公开页面支持 canonical、Open Graph、sitemap。
- 资讯和旅行团不要继续混在 `siteData.ts`；迁移后静态常量只留 fallback 空状态或开发 fixture。

## 15. 人工首付款核验

P0 不接真实支付网关，采用“上传凭证 + 财务人工确认”：

1. 已二次核价且客户确认的订单生成 `PaymentRecord(type=DEPOSIT, status=PENDING)`。
2. 客户在订单页看到收款说明和应付金额，上传凭证；前端不显示“支付成功”。
3. 文件直传私有对象存储，校验大小、魔数、扩展名，图片重编码；登记 checksum 防重复。
4. 提交后为 `REVIEWING`，财务队列显示订单、应付、声明金额、凭证和历史。
5. 财务选择确认或驳回；确认必须填实际到账金额、渠道、到账时间，驳回必须填原因。
6. 金额不一致进入异常状态，不能自动推进预订。
7. 财务确认和订单推进在同一数据库事务，写 AuditLog 和 NotificationOutbox。

## 16. 预订、退款与售后

- 预订：财务确认首款后创建 Booking；预订员填写供应商、成本、编号、规则并上传确认单。客户只看到经审核的确认信息。
- 尾款：根据订单约定生成 `PaymentRecord(type=BALANCE)`，复用人工核验，不从订单状态推断已付款。
- 退款：客户/客服创建申请，售后确认可退规则与金额，财务记录实际退款；订单保留原交易历史。
- 售后：`AfterSaleCase` 记录类型、优先级、SLA、负责人、消息和附件；状态变化可通知客户。
- 所有金额调整、取消和退款均要引用原 QuoteVersion/PaymentRecord 并写审计。

## 17. 日志、监控与审计

- 结构化日志包含 `requestId`、actor、route、entity、duration、result；手机号、证件、凭证 URL、Cookie、token 全部脱敏。
- Sentry/同类服务采集服务端异常和前端错误，环境与 release 分离。
- 指标：询价提交率、缺资料率、首次响应时长、采购耗时、报价发布率、报价确认率、付款核验时长、预订成功率、退款率、任务失败率。
- AuditLog 使用追加写模式，业务 API 不提供删除/修改；高风险操作记录 before/after 的必要字段。
- 定时监控：过期报价、超时采购、待核验付款、预订 SLA、outbox 重试、死信队列。
- 健康检查拆成 liveness/readiness，readiness 校验数据库与关键配置但不暴露密钥。

## 18. 测试策略

### 单元测试

- 状态机允许/禁止转换、金额计算、报价有效期、角色策略、脱敏、幂等键。
- 每个 service type 的 Zod schema 和迁移映射。

### 集成测试

- 使用独立测试数据库运行 Prisma；每例事务回滚或重建 fixture。
- 覆盖 IDOR：用户 A 不能读取/修改用户 B 的询价、报价、订单、凭证。
- 覆盖状态竞态：重复确认、并发领取、重复 outbox、乐观锁冲突。
- 文件上传覆盖伪 MIME、超大文件、SVG、路径穿越和未授权读取。

### E2E

- Playwright 覆盖游客草稿 -> 注册绑定 -> 提交 -> 后台采购 -> 报价发布 -> 客户确认 -> 首款凭证 -> 财务确认 -> 预订确认。
- 375/390/430、桌面后台、软键盘、断网重试、后退恢复、重复点击、长文本。
- 外部 AI/企业微信/存储使用 fake server 或 sandbox，CI 不发送真实消息。

### CI 门禁

新增 scripts：`typecheck`、`test`、`test:integration`、`test:e2e`。顺序运行 `lint -> typecheck -> unit/integration -> build -> e2e`；不与 `next dev` 并发共享 `.next`。

## 19. 部署策略

### P0

- 沿用 Docker + Fly.io 单实例和持久卷；固定 `min/max machines=1`，不运行并发 Worker。
- 部署前备份 SQLite，运行 `prisma migrate deploy`，再做健康检查；失败立即回滚镜像和数据库文件。
- `USER_SESSION_SECRET`、`ADMIN_SECRET`、对象存储密钥等通过 Fly secrets，启动时强校验。
- Web 与任何 Worker 分进程；P0 Worker 可关闭，仅人工后台处理。

### P1+

- 迁托管 PostgreSQL；应用实例无状态化，上传使用私有对象存储。
- Redis/队列和 outbox Worker 独立部署；数据库连接池、自动备份、时间点恢复。
- Preview/测试/生产完全分离数据库与外部接口，生产部署需迁移 dry-run、备份和人工批准。

## 20. 实施阶段、文件与验收

## P0：真实询价与人工订单闭环

### P0-A 安全止血（第一批）

准备修改：

- `src/lib/userAuth.ts`、`src/lib/adminAuth.ts`、`src/lib/supplierBotAuth.ts`
- `src/app/api/inquiry/[id]/route.ts`
- `src/app/api/inquiry/[id]/prices/route.ts`
- `src/app/api/inquiry/[id]/confirm/route.ts`
- `src/app/api/inquiry/xianyu/[taskId]/route.ts`
- `src/app/api/robot/**`
- `src/app/api/inquiry/price-compare/route.ts`
- `src/app/api/admin/upload/route.ts`、`src/app/api/uploads/[filename]/route.ts`
- `src/lib/rateLimit.ts` 及新的 `src/lib/security/**`

验收：

- 任意跨用户/无访客所有权请求返回 401/403；自动化接口缺 token 返回 401。
- 生产缺 session secret 时构建后启动失败，不能生成默认会话。
- 无真实来源的结果不显示平台名、不返回 `isMock:false`，不能进入正式报价。
- 登录、注册、询价、比价、AI、机器人均有可跨实例限流计划；P0 单实例至少有统一限流。
- 上传拒绝 SVG、超限和伪 MIME；私密文件不走公开路由。

### P0-B 领域模型与状态机

准备新增/修改：

- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_p0_inquiry_quote_order/**`
- `src/modules/inquiry/**`
- `src/modules/sourcing/**`
- `src/modules/quote/**`
- `src/modules/order/**`
- `src/modules/audit/**`
- `src/app/api/inquiries/**`
- `src/app/api/sourcing/**`
- `src/app/api/quotes/**`
- `src/app/api/orders/**`

验收：

- 草稿、提交、补资料、采购、候选结果、审核、发布、客户意向、二次核价均有独立记录。
- 所有状态转换有前置条件、操作人、时间、版本和 AuditLog。
- 公开参考价无法被当作 QuoteVersion 发布，除非人工选择并补全规则/来源。
- 并发重复请求只产生一个业务结果。

### P0-C 前后台工作流

准备新增/修改：

- `src/components/QuoteWizard.tsx`
- `src/app/inquiry/**`
- `src/app/member/inquiries/**`
- `src/app/member/orders/**`
- `src/app/admin/inquiries/**`
- `src/app/admin/sourcing/**`
- `src/app/admin/quotes/**`
- `src/app/admin/orders/**`
- 后台导航/布局组件

验收：

- 表单刷新、后退和重新登录后草稿仍在；不同业务字段结构化保存。
- 后台可领取采购、录入至少两个候选结果、审核并发布一个有有效期的报价。
- 用户只能查看自己的已发布报价并确认具体版本；过期报价不能确认。
- 未登录访客提交后注册可绑定草稿/询价，且不能通过猜 ID 绑定他人记录。

### P0-D 首款与预订确认

准备新增/修改：

- `src/modules/payment/**`、`src/modules/booking/**`
- `src/lib/storage/**`
- `src/app/orders/[id]/deposit/**`、`src/app/orders/[id]/booking/**`
- `src/app/admin/payments/**`、`src/app/admin/bookings/**`
- `src/app/api/payments/**`、`src/app/api/bookings/**`

验收：

- 客户上传私有首款凭证后只显示“待财务核验”，不显示支付成功。
- 仅财务能确认到账；金额差异不推进订单。
- 仅到账确认后的订单能进入预订；客户可安全查看预订确认单。
- 全流程通知可重试且不包含完整敏感信息。

## P1：旅行团、资讯与售后基础

准备修改：

- `prisma/schema.prisma` 与 P1 migration
- `src/modules/cms/**`、`src/modules/after-sale/**`
- `src/app/tours/**`、`src/app/articles/**`
- `src/app/admin/tours/**`、`src/app/admin/articles/**`
- `src/app/admin/refunds/**`、`src/app/admin/after-sales/**`
- `src/lib/travelData.ts`、`src/lib/siteData.ts`（迁移后降为 fixture 或删除生产引用）

验收：

- 旅行团草稿、审核、班期、名额、行程、费用规则和上下架完整。
- 文章可草稿/审核/发布，公开路由和 SEO 正常。
- 售后和退款有工单、审批、财务执行和客户通知。
- 前台不再把源码常量展示为实时产品。

## P2：真实 AI 客服

准备修改：

- `src/components/AITravelAssistant.tsx`
- `src/app/ai/**`、`src/app/api/ai/**`
- `src/modules/ai/**`
- `src/lib/openai.ts`（拆分 provider 与领域工具）
- `prisma/schema.prisma` 与 AI migration
- `src/app/admin/ai/**`

验收：

- 对话和历史可保存/删除，模型失败有明确降级。
- 订单/询价工具只读取当前用户数据；IDOR、提示词注入测试通过。
- AI 可创建草稿但不能确认付款、发布报价或执行退款。
- 有内容安全、限流、每日成本和单会话 token 指标，支持转人工。

## P3：经授权的外部自动化

准备修改：

- `xianyu-bot/index.js` 及其独立部署/配置
- `src/app/api/supplier-quotes/**`
- `src/modules/automation/**`、`src/lib/queue/**`
- `src/lib/webhook.ts`（迁 outbox provider）
- `src/app/admin/automation/**`、`src/app/admin/suppliers/**`
- `prisma/schema.prisma` 与自动化 migration

验收：

- 具有书面授权和平台合规结论；无绕过验证或隐藏自动化行为。
- 默认人工确认发送，账号/任务可随时暂停，异常自动熔断。
- 原子领取、租约、心跳、幂等、重试、死信和运行审计完整。
- 外部结果只能生成候选报价草稿，必须人工审核后对客。

## 21. 数据迁移与回滚方案

### 迁移前

1. 停止写入窗口；复制 `prisma/dev.db` 到带时间戳且受控的备份路径，并计算 SHA-256。
2. 导出关键表行数和抽样校验；记录当前 migration 清单。
3. 在数据库副本执行 `prisma migrate deploy` 和迁移脚本，禁止直接在唯一数据库上试错。
4. 为每个旧状态、金额单位、空值和演示订单定义映射；无法映射的写迁移异常表，不猜测。

### 双轨迁移

- 新建表，不原地改名/删列。
- `HotelLead` 不迁为 Inquiry，除非后台显式“转正式询价”，并保存 `sourceLeadId`。
- `InquiryOrder` 批量映射到 `Inquiry`，旧 ID 写 `legacyId` 唯一索引；价格参考映射到 `PriceBaseline`。
- 当前 `InquiryOrder` 为 0 行，可简化初次迁移，但脚本仍要幂等并考虑部署环境有数据。
- 8 条旧 `Order` 先标记 `dataOrigin=LEGACY/DEMO`，人工确认后才迁为真实订单；不得默认视为已支付。
- 兼容期读新表、必要时双写；完成行数、金额和关联校验后切换。

### 回滚

- 代码回滚：保留旧读路径和 feature flag，切回上一镜像。
- 数据库回滚：优先前向修复；若新迁移导致不可用，停止写入并恢复完整 SQLite 备份。
- 任何 migration 的 `down` 方案只在副本演练；涉及数据丢失时禁止自动 down。
- PostgreSQL 迁移采用全量导入 + 增量冻结窗口 + 校验 + DNS/连接串切换；SQLite 原库至少保留一个完整业务周期只读归档。

## 22. 今天优先完成的最小真实闭环

今天最值得执行的不是接支付或跑闲鱼，而是完成以下顺序：

```text
安全止血
-> 询价草稿/提交与所有权
-> 后台人工采购任务
-> 人工录入候选结果
-> 审核发布正式报价版本
-> 客户确认意向
-> 人工二次核价
-> 上传首款凭证
-> 财务人工确认
-> 预订确认单
-> 用户查看订单进度
```

若只能交付一个开发批次，选择 **P0-A + P0-B 的询价/报价部分**：先堵住公开越权和虚假价格，再建立 `Inquiry/SourcingTask/QuoteVersion/AuditLog`。没有这层基础，继续增加 AI、旅行团或机器人只会扩大数据和合规风险。

## 23. 外部接口缺口与需要决定的问题

尚未具备或未确认：

- 正规酒店/机票/火车/门票/包车供应商接口及商用授权。
- 短信/邮箱验证与通知 provider。
- 私有对象存储及病毒/内容扫描。
- 企业微信正式应用、回调域名和客户联系授权。
- 银行/收款渠道对账方式；P0 仅做人工凭证核验。
- PostgreSQL、Redis/队列、监控告警服务。
- 闲鱼账号授权、平台许可和法律合规结论。

进入 P0 前必须由产品/业务负责人决定：

1. 首款收款主体、收款方式、财务审核责任人和凭证保留期限。
2. 报价中平台参考价、供应商成本、服务费和对客总价的展示规则。
3. 哪些业务先进入 P0。建议酒店优先，其他类型保留结构化询价和人工处理，不承诺自动报价。
4. 订单取消、首款退款、二次核价涨价时的客户确认规则。
5. 是否接受 P0 单实例 SQLite 的短期约束；若要多人并发/队列，先迁 PostgreSQL。

这些是业务规则决策，不应由工程代码自行猜测。它们不阻塞先完成 P0-A 安全止血和数据库迁移演练。
