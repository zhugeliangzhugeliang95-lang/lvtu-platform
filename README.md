# 旅途 V1

旅途是一个以“产品发现 + 需求收集 + 旅途预估 + 真人顾问成交 + 会员制”为核心的旅行服务平台。旅行团提供产品展示和咨询报名；酒店、机票、门票、接送、包车及套餐统一进入需求和人工确认流程。

## Getting Started

### 1) 安装依赖

```bash
npm install
```

### 2) 配置环境变量

复制一份环境变量文件：

```bash
cp .env.example .env
```

编辑 `.env`：
- `DATABASE_URL`：默认 `file:./dev.db`（SQLite 本地数据库）
- `USER_SESSION_SECRET`、`ADMIN_SECRET`、`GUEST_INQUIRY_SECRET`：生产必填且必须互不相同的随机密钥
- `APP_ORIGIN`：生产站点的完整 Origin，例如部署域名对应的 `https://...`
- `SUPPLIER_BOT_TOKEN`：供应商 Worker 必填；缺失时所有 Worker 接口失败关闭
- `AI_PROVIDER=auto`：优先使用已配置的开源对话模型，其次才使用已配置的兼容模型，未配置时自动回退本地顾问；推荐填写 `OPEN_MODEL_API_KEY`（SiliconFlow/OpenAI 兼容接口）、`OPEN_MODEL_BASE_URL` 和 `OPEN_MODEL_NAME`。如使用豆包对话，填写 `VOLCENGINE_API_KEY` 与 `VOLCENGINE_CHAT_MODEL`
- `VOLCENGINE_VISION_MODEL`：填写支持图片理解的方舟模型后，付款截图会自动识别金额、时间和收款方；未配置时保持人工审核
- `ADMIN_USER` / `ADMIN_PASS`：可选的后台兼容账号，生产优先使用数据库管理员

可使用 `openssl rand -base64 48` 分别生成三个 Session/签名密钥和 Worker Token，不要把生成结果提交到仓库。

### 3) 初始化数据库

```bash
npx prisma generate
npx prisma db push
npm run suppliers:import # 仅在需要导入供应商 CSV 时执行
```

### 4) 启动开发环境

```bash
npm run dev:local
```

打开：
- 前台官网：http://127.0.0.1:3100
- 统一旅行问价：http://127.0.0.1:3100/inquiry
- 旅途会员：http://127.0.0.1:3100/membership
- 用户登录：http://127.0.0.1:3100/login
- 用户注册：http://127.0.0.1:3100/signup
- 后台管理：http://127.0.0.1:3100/admin
- 会员付款审核：http://127.0.0.1:3100/admin/membership-payments

AI 旅行顾问的平台入口、接口协议、模型配置与上线验收见 [接入说明](docs/AI-TRAVEL-ADVISOR-INTEGRATION.md)。

## V1 业务范围

- 前台：首页、探索、旅行团、统一问价、会员、行程、收藏、客服和用户中心。
- 旅行服务：用户填写需求与公开参考价，平台展示明确标注的“旅途预估”，最终价格由顾问确认。
- 旅行团：后台录入、发布、下架，前台展示并转人工咨询；当前不做在线购买。
- 会员：默认 ¥30 / 30 天，用户提交付款申请，管理员人工确认后开通；有效期内续费从原到期日顺延。
- 后台：需求、报价、订单履约、旅行团、会员、会员付款、会员查询、预估规则和客服设置。

## 会员付款流程

1. 用户登录后进入 `/membership`，填写姓名、绑定手机号并同意会员协议。
2. 页面显示后台配置的收款二维码和付款说明。
3. 用户上传付款截图并提交；系统会记录截图，若配置了视觉模型，会显示 AI 的金额匹配结果。
4. 付款进入 `USER_MARKED_PAID`，管理员在 `/admin/membership-payments` 查看截图、AI提示和微信到账记录后确认。
5. 只有管理员确认后才会开通会员；首次开通从确认时间起增加配置天数，有效会员续费从原到期日继续顺延。

普通酒店、旅行社和其他服务订单使用同一套截图上传与 AI 辅助识别流程，最终仍以人工确认实际到账为准。AI 识别不会自动开通会员、标记已付款或完成预订。

会员价格、有效天数、二维码和付款说明在 `/admin/settings/membership` 配置，不在前端硬编码。

## 客服与旅行团配置

- 客服微信、二维码、电话和服务时间在后台系统设置中维护；未配置时前台不会显示虚构联系方式。
- 旅行团在 `/admin/tours` 新增和管理，发布后才会进入前台产品库。
- 所有预估只作初步参考，不代表实时库存或最终成交价。

## 部署

当前线上环境使用 Fly.io：

```bash
flyctl deploy --app lvtu --depot=true --strategy rolling --ha=false
```

线上地址：
- 前台：https://lvtu.fly.dev/
- 后台：https://lvtu.fly.dev/admin/hotel

说明：Fly 会挂载 `lvyou_data` 到 `/var/data`，容器启动时自动执行 `prisma migrate deploy`。

## P0-A 安全边界

- 用户、管理员和访客所有权使用不同用途的签名密钥；生产缺失时失败关闭。
- 机器人任务接口必须使用 `Authorization: Bearer <SUPPLIER_BOT_TOKEN>` 或兼容头 `x-supplier-bot-token`。
- 进程内限流仅适用于当前单实例部署；扩展多实例前必须迁移到 Redis 或持久限流。
- `/api/admin/upload` 只用于后台公开展示图片，限制为 5MB JPEG/PNG/WebP，并解码后重编码。证件、付款凭证、预订确认单不得使用该公开路径。
- Cookie 鉴权写接口按 `APP_ORIGIN` 校验来源。生产部署前必须配置准确来源，不能使用任意 Host 或通配符。

安全回归命令：

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```
