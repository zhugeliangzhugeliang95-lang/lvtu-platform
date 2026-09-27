# 旅途「预估报价 → 人工确认 → 成交」闭环审计与实施结果

> 更新日期：2026-09-19  
> 项目目录：`/Users/apple/Desktop/旅游通 2/web`  
> 本地验收地址：`http://127.0.0.1:3100`

## 1. 当前用户流程

当前核心流程已经从“展示内容后跳外部沟通”升级为站内业务闭环：

1. 游客浏览首页、探索、酒店、机票、火车、门票、用车、旅行团和攻略。
2. 酒店、机票、火车、门票、用车、套餐等服务进入旅途预估流程。
3. 系统根据有效公开价格中位数、后台配置规则和风险缓冲生成稳定的预估区间；无数据时不生成金额。
4. 用户点击“我有意向，帮我确认”，未登录时进入登录页，登录后返回原流程。
5. 预估草稿自动恢复，用户补充完整需求与联系方式，提交正式 Requirement。
6. 用户在“我的需求”查看顾问处理状态。
7. 后台人工录入渠道询价结果并发送最终确认方案。
8. 用户在“我的报价”区分旅途预估和最终确认价，确认或拒绝方案。
9. 用户确认后生成待付款订单，上传人工付款凭证。
10. 后台二次确认到账，订单进入人工履约。
11. 后台录入确认号、供应商、凭证和说明，订单变为 BOOKED 并自动创建 Trip。
12. 用户在订单详情和“我的行程”查看确认号、履约状态和行程。

旅行团保持独立流程：旅行团列表 → 详情 → 路线/费用/退改 → 咨询报名 → 客服，不进入预估交易体系。

## 2. 核心路由

### 用户端

| 业务 | 路由 |
| --- | --- |
| 服务选择与预估 | `/inquiry` |
| 正式需求确认 | `/request` |
| 登录 / 注册 | `/login`、`/signup` |
| 我的需求 | `/member/requests`、`/member/requests/[id]` |
| 我的报价 | `/member/quotes`、`/member/quotes/[id]` |
| 我的订单 | `/orders`、`/member/orders/[id]` |
| 我的行程 | `/trips`、`/trips/[id]` |
| 通知 | `/notifications` |
| 客服 | `/contact` |
| 售后 | `/support`、`/support/new`、`/support/[id]` |
| 旅行团 | `/tours`、`/tours/[slug]` |

### 运营后台

| 业务 | 路由 |
| --- | --- |
| 运营总览 | `/admin` |
| 需求与报价 | `/admin/requirements`、`/admin/requirements/[id]` |
| 价格配置 | `/admin/pricing` |
| 付款审核 | `/admin/payments` |
| 订单履约 | `/admin/orders` |
| 旅行团管理 | `/admin/tours` |
| 系统与客服配置 | `/admin/hotel/settings` |

旧的 `/inquiry/[id]/xianyu-quote` 和 `/inquiry/[id]/supplier-quote` 已只做兼容重定向，不再向用户展示内部采购渠道。

## 3. 数据库与价格体系

本轮兼容现有模型，没有删除旧 Inquiry、Robot、Supplier 或 XianYu 数据结构。

核心复用和新增关系：

- `Requirement`：正式旅行服务需求，包含编号、业务类型、目的地、日期、人数、联系方式、结构化详情、预估金额和负责人。
- `MarketPriceSnapshot`：公开价格快照，记录来源、条件、有效期和 `isMock`。
- `EstimateRule`：按业务、目的地和品类配置确定性系数、风险缓冲和置信度。
- `EstimateResult`：保存本次预估的输入、参考价、区间、规则和解释。
- `SupplierInquiryResult`：当前由客服人工录入，字段已为未来自动询价写入预留来源、原始回复、AI 解析和人工核验能力。
- `Quote`：最终确认方案，包含价格、规格、权益、退改、有效期和状态。
- `Order`、`Payment`、`Trip`：分别负责交易订单、人工付款审核和用户行程，不混为同一模型。
- `Notification`、`SupportTicket`：负责站内通知和售后。
- `CustomerService`、`SiteSetting`：集中管理客服与收款配置。

统一价格状态为：

- `REFERENCE`：公开参考价
- `ESTIMATED`：旅途预估价
- `PENDING_CONFIRMATION`：顾问确认中
- `CONFIRMED`：最终确认价
- `EXPIRED`：报价已失效
- `UNAVAILABLE`：暂无可订方案

预估引擎位于 `src/lib/pricing/`：

- 使用有效公开价格中位数，不取最低价。
- 只使用数据库中有效规则。
- 不使用随机数，相同输入和配置返回相同结果。
- 无公开价格或无规则时不编造金额。
- 生产环境忽略 `isMock = true` 的价格和规则。

## 4. 登录能力

- 游客可以浏览公开内容。
- 提交需求、查看需求/报价/订单/行程等操作要求登录。
- `requireUser(nextPath)` 保留登录前目标地址。
- 预估草稿存入 `lvtu-estimate-draft`，登录后返回 `/request?fromEstimate=1` 并恢复字段。
- 当前基础邮箱/账号登录已可用；本轮未接短信验证码服务，符合“先完成业务功能”的要求。
- 后台使用独立管理员会话与权限校验。

## 5. 订单与付款能力

- 最终报价只有在有效期内才能确认。
- 用户确认报价后创建 `PENDING_PAYMENT` 订单。
- 用户可选择微信或支付宝人工付款，并上传 JPEG、PNG、WebP 凭证，最大 5MB。
- 后台“确认到账”有二次确认。
- 审核通过后 Payment → `APPROVED`，Order → `FULFILLING`，Requirement → `FULFILLING`。
- 后台录入确认号、供应商、凭证和履约说明后，Order / Requirement → `BOOKED`。
- BOOKED 自动创建关联 Trip，并向用户发送站内通知。

## 6. 后台能力

- 首页展示今日新需求、待询价、待报价、待用户确认、待付款审核、履约中和旅行团数量。
- 需求列表支持搜索和状态筛选。
- 需求详情集中展示用户、联系方式、完整需求、公开价格、预估、人工渠道结果、最终报价和订单。
- 可录入公开价格并重新计算预估。
- 可人工录入渠道询价结果。
- 可创建最终确认方案；最终价高于预估上限时自动追加差异提示。
- 价格配置页可维护业务规则和公开价格快照。
- 付款审核页可查看凭证、确认到账或驳回。
- 订单履约页可录入确认信息并生成行程。

## 7. 缺失页面与明确边界

本轮要求内的核心页面已具备。以下属于明确不做或依赖外部服务的能力：

- 未接真实微信支付、支付宝支付 API，当前为人工付款凭证审核。
- 未接 OTA 实时库存、锁房、出票、退改签。
- 未开发自动渠道问价、自动采购或自动付款。
- 未配置真实收款二维码时，支付页提示联系客服；二维码可在后台设置后展示。
- 现有旧机器人和供应商相关模型/API 为兼容历史代码保留，不参与本次用户成交主流程。

## 8. 死链接与前台文案检查

已扫描 `Link`、`href`、`router.push`、按钮和 CTA 的常见失效模式：

- 未发现 `javascript:void`。
- 未发现空 `onClick`。
- 未发现 TODO alert。
- 首页 `#lead-form`、`#destinations`、`#scenarios`、`#services`、`#wechat`、`#faq` 均有实际锚点。
- 旧内部渠道前台路由重定向到顾问确认进度页。
- 用户侧“机器人问价”“内部价”“渠道价”等文案已改为“旅途预估”“顾问人工确认”。
- 前台不展示供应商名称、内部采购来源或卖家信息；后台仍保留运营所需明细。

## 9. Prisma 调整结果

已完成并执行：

```bash
npx prisma format
npx prisma db push
npx prisma generate
```

扩展内容包括：

- `PriceStatus`、`EstimateConfidence`
- 完整 `PlatformRequirementType` 和 `PlatformRequirementStatus`
- `Requirement` 的结构化需求、预估价格、联系方式和负责人字段
- `Quote` 的最终方案、权益、退改和创建人字段
- `Order` 的 FULFILLING / BOOKED、确认号、凭证、供应商和履约备注
- `MarketPriceSnapshot`、`EstimateRule`、`EstimateResult`、`SupplierInquiryResult`

## 10. 实施文件与结果

主要实施区域：

- `prisma/schema.prisma`、`prisma/seed.mjs`
- `src/lib/pricing/`
- `src/lib/services/estimate.service.ts`
- `src/components/QuoteWizard.tsx`
- `src/app/request/RequestForm.tsx`
- `src/app/api/pricing/estimate/route.ts`
- `src/app/api/requirements/route.ts`
- `src/app/admin/requirements/`
- `src/app/admin/pricing/`
- `src/app/member/quotes/`
- `src/app/member/orders/`
- `src/app/api/admin/payments/`
- `src/app/admin/orders/`
- `src/app/api/admin/orders/[id]/book/route.ts`
- `src/app/contact/page.tsx`
- `src/app/member/page.tsx`

## 11. 实际端到端验收

2026-09-19 已用真实浏览器完成场景 A：

1. 三亚酒店公开市场参考 ¥3,200。
2. 确定性旅途预估 ¥2,080～¥2,300。
3. 登录后恢复日期、人数、房间、房型、预算和偏好。
4. 提交正式需求 `RQMU8E3JB287EE`。
5. 后台录入人工渠道报价 ¥2,180。
6. 后台发送最终确认价 ¥2,380。
7. 因最终价高于预估上限，用户页正确显示差异说明。
8. 用户确认预订，生成订单 `TGMU8E9ZSK1AA7`。
9. 上传图片付款凭证成功。
10. 后台二次确认到账，订单进入 FULFILLING。
11. 后台录入确认号 `HTL-SANYA-20261003-001`，订单变为 BOOKED。
12. 自动生成三亚行程，订单和行程互相可达。
13. 用户需求、报价、订单、行程页面浏览器控制台均无 error。

同时验证：

- 最终价高于预估时自动解释差异。
- 未配置收款码时页面明确提示联系客服。
- 付款凭证安全转码并保存为 WebP。
- 旅行团仍保持展示与咨询路径。

## 12. 代码质量结果

```text
npm run typecheck  通过
npm test           10 个测试文件、41 项测试全部通过
npm run lint       0 error；72 条存量 warning
npm run build      通过；113 个页面生成成功
```

当前版本已经具备可实际操作的“预估 → 人工确认 → 最终报价 → 用户确认 → 人工付款审核 → 人工履约 → 行程”MVP 闭环。
