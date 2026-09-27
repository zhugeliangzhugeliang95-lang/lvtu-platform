/**
 * 旅游通 · 闲鱼自动询价机器人
 *
 * 用法：
 *   首次登录：node index.js --login
 *   正常运行：node index.js
 *   只跑一单：node index.js --once
 *   指定任务：node index.js --once --task-id=xxx
 *   只上传报价不打开闲鱼：node index.js --mock-quotes
 *
 * 依赖：playwright（npm install）
 * Cookie 默认保存在：cookies.json（勿提交 git）
 * 生产环境可用 XIANYU_COOKIE_FILE=/var/data/xianyu-cookies.json 指定持久化路径
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

// ── 配置 ──────────────────────────────────────────────────────────────────

function loadLocalEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const rawValue = trimmed.slice(eqIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const API_BASE = process.env.API_BASE ?? "http://localhost:3001";
const SUPPLIER_API_PREFIX = process.env.SUPPLIER_QUOTE_API_PREFIX ?? "/api/supplier-quotes";
const SUPPLIER_BOT_TOKEN = process.env.SUPPLIER_BOT_TOKEN ?? process.env.XIANYU_BOT_TOKEN ?? "";
const COOKIE_FILE = process.env.XIANYU_COOKIE_FILE || path.join(__dirname, "cookies.json");
const XIANYU_URL = "https://www.goofish.com";
const BROWSER_CHANNEL = process.env.XIANYU_BROWSER_CHANNEL ?? "chrome";
const BROWSER_HEADLESS = process.env.XIANYU_HEADLESS === "true";
const BROWSER_SLOW_MO = Number(process.env.XIANYU_SLOW_MO_MS ?? "80");
const DEFAULT_VIEWPORT = { width: 1280, height: 800 };

// 发完消息后等商家回复，再集中收集。默认整体节奏：约 2 分钟发送 + 6 分钟等待 + 2 分钟收集。
const REPLY_WAIT_MS = Number(process.env.XIANYU_REPLY_WAIT_MS ?? String(6 * 60 * 1000));
const COLLECT_DURATION_MS = Number(process.env.XIANYU_COLLECT_DURATION_MS ?? String(2 * 60 * 1000));
// 每次轮询聊天回复的间隔（毫秒）
const POLL_INTERVAL_MS = Number(process.env.XIANYU_POLL_INTERVAL_MS ?? String(2 * 60 * 1000));
// 空闲时拉取新询价任务的间隔（毫秒）
const TASK_POLL_INTERVAL_MS = Number(process.env.XIANYU_TASK_POLL_INTERVAL_MS ?? "10000");
// 收集到这么多报价才提前结束等待；默认不提前停，等满 10 分钟统一汇总。
const MIN_QUOTES_TO_STOP = Number(process.env.XIANYU_MIN_QUOTES_TO_STOP ?? "999");
// 本轮只收集报价时关闭自动追问，避免在用户暂停发送后继续给商家发消息。
const DISABLE_AUTO_FOLLOWUP = process.env.XIANYU_DISABLE_AUTO_FOLLOWUP === "true";
// 发送消息间隔范围（毫秒）
const MSG_DELAY_MIN = Number(process.env.XIANYU_MSG_DELAY_MIN_MS ?? "5000");
const MSG_DELAY_MAX = Number(process.env.XIANYU_MSG_DELAY_MAX_MS ?? "5000");
// 单任务最多联系商家数
const MAX_SELLERS = Number(process.env.XIANYU_MAX_SELLERS ?? "20");
// 搜索页最多收集多少个商品候选
const SEARCH_RESULT_LIMIT = Number(process.env.XIANYU_SEARCH_RESULT_LIMIT ?? "80");
const SEARCH_SCROLL_ROUNDS = Number(process.env.XIANYU_SEARCH_SCROLL_ROUNDS ?? "10");
const HUMAN_WEBHOOK_URL =
  process.env.XIANYU_HUMAN_WEBHOOK_URL
  || process.env.DINGTALK_WEBHOOK_URL
  || process.env.WECHAT_WEBHOOK_URL
  || "";
const CAPTCHA_WAIT_MS = Number(process.env.XIANYU_CAPTCHA_WAIT_MS ?? String(3 * 60 * 1000));
const API_TIMEOUT_MS = Number(process.env.XIANYU_API_TIMEOUT_MS ?? "20000");
const MOCK_QUOTE_BASE_PRICE = Number(process.env.SUPPLIER_MOCK_BASE_PRICE ?? "0");

// ── 工具函数 ──────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomDelay(min = MSG_DELAY_MIN, max = MSG_DELAY_MAX) {
  return sleep(min + Math.random() * (max - min));
}

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString("zh-CN")}] ${msg}`);
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}（超过 ${Math.round(ms / 1000)} 秒）`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function launchXianyuBrowser({ forceHeaded = false, slowMo = BROWSER_SLOW_MO } = {}) {
  const launchOptions = {
    headless: forceHeaded ? false : BROWSER_HEADLESS,
    slowMo,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--no-sandbox",
    ],
  };

  if (BROWSER_CHANNEL) {
    launchOptions.channel = BROWSER_CHANNEL;
  }

  try {
    return await chromium.launch(launchOptions);
  } catch (err) {
    if (!BROWSER_CHANNEL) throw err;
    log(`Chrome channel 启动失败，回退到 Playwright Chromium：${err.message?.slice(0, 80)}`);
    const fallbackOptions = { ...launchOptions };
    delete fallbackOptions.channel;
    return chromium.launch(fallbackOptions);
  }
}

async function newXianyuContext(browser) {
  const context = await browser.newContext({
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
    viewport: DEFAULT_VIEWPORT,
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
  });

  return context;
}

async function gotoWithRetry(page, url, options = {}, attempts = 2) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      await page.goto(url, options);
      return;
    } catch (err) {
      lastError = err;
      log(`  ⚠️ 页面打开失败，重试 ${i + 1}/${attempts}：${err.message?.slice(0, 90)}`);
      await sleep(2000);
    }
  }
  throw lastError;
}

// ── Cookie 管理 ───────────────────────────────────────────────────────────

function loadCookies() {
  if (!fs.existsSync(COOKIE_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(COOKIE_FILE, "utf8"));
  } catch {
    return null;
  }
}

function saveCookies(cookies) {
  fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2), "utf8");
}

// ── API 调用封装 ──────────────────────────────────────────────────────────

async function apiRequest(method, apiPath, body) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (SUPPLIER_BOT_TOKEN) headers.Authorization = `Bearer ${SUPPLIER_BOT_TOKEN}`;

  const res = await fetch(`${API_BASE}${apiPath}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${apiPath} -> HTTP ${res.status}: ${text.slice(0, 240)}`);
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`${method} ${apiPath} -> JSON 解析失败：${err.message}; body=${text.slice(0, 240)}`);
  }
}

async function apiGet(path) {
  return apiRequest("GET", path);
}

async function apiPost(path, body) {
  return apiRequest("POST", path, body);
}

async function apiPatch(path, body) {
  return apiRequest("PATCH", path, body);
}

// 话术结尾变体，避免商家收到完全相同的文案触发风控
const MESSAGE_TAILS = [
  "麻烦帮我看一下这个日期还有房吗？最低价多少？含早餐吗？可以免费取消吗？谢谢！",
  "方便的话麻烦报一下这个日期的最低价，含早/不含早和取消规则也一起说一下，谢谢！",
  "想确认一下这个日期能不能订，最低多少钱？早餐和退改政策麻烦也说一下。",
  "麻烦查一下这个配置的最低价，有含早价和不含早价的话都可以发我，谢谢！",
  "这个日期如果有房，麻烦直接报一下能做的底价，以及是否含早、能否取消。",
  "辛苦帮我看一下这个日期的房态和最低价，早餐和取消规则也麻烦一起确认。",
];

// 生成询价话术
function buildMessage(task, index = 0) {
  const roomPart = task.roomType ? `\n房型：${task.roomType}` : "";
  const tail = MESSAGE_TAILS[index % MESSAGE_TAILS.length];
  return `您好！我这边有朋友需要预订：
酒店：${task.hotelName}${roomPart}
入住：${task.checkInDate} / 离店：${task.checkOutDate}（共${task.nights}晚）
${task.guestCount}人 / ${task.roomCount}间
${tail}`;
}

// ── 闲鱼登录 ─────────────────────────────────────────────────────────────

async function loginAndSaveCookies() {
  log("启动有头浏览器，请扫码登录闲鱼...");
  const browser = await launchXianyuBrowser({ forceHeaded: true, slowMo: 100 });
  const context = await newXianyuContext(browser);
  const page = await context.newPage();

  await page.goto(XIANYU_URL, { waitUntil: "domcontentloaded" });
  log("请在弹出的浏览器中扫码登录闲鱼，登录成功后自动继续（最多等 5 分钟）...");

  // 登录态判定：闲鱼登录后会写入 unb / cookie2 / _tb_token_ 等关键 cookie
  // 只有这些 cookie 出现，才说明真的登录成功
  const LOGIN_COOKIES = ["unb", "cookie2", "_tb_token_", "sgcookie", "cna"];
  const deadline = Date.now() + 5 * 60 * 1000;
  let loggedIn = false;

  while (Date.now() < deadline) {
    const cookies = await context.cookies();
    const cookieNames = new Set(cookies.map((c) => c.name));
    const hits = LOGIN_COOKIES.filter((n) => cookieNames.has(n));
    // 命中至少 2 个关键 cookie 才认登录成功
    if (hits.length >= 2 && cookieNames.has("unb")) {
      loggedIn = true;
      log(`检测到登录态 cookie：${hits.join(", ")}`);
      break;
    }
    await sleep(3000);
  }

  if (!loggedIn) {
    log("等待 5 分钟仍未检测到登录态 cookie，取消保存。请重新运行 --login");
    await browser.close();
    return false;
  }

  const cookies = await context.cookies();
  saveCookies(cookies);
  log(`登录成功！已保存 ${cookies.length} 个 Cookie`);
  await browser.close();
  return true;
}

// ── 搜索商家 ─────────────────────────────────────────────────────────────

async function searchSellers(page, task) {
  // 直接搜酒店名。实测比拼“代订”相关率更高，也能减少空结果。
  const cleanHotel = (task.hotelName ?? "").trim();
  const fallbackCity = (task.city ?? "").trim();
  const keywords = [cleanHotel || fallbackCity].filter(Boolean);

  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i];
    log(`搜索关键词（第 ${i + 1}/${keywords.length} 次）：${keyword}`);

    const searchUrl = `${XIANYU_URL}/search?q=${encodeURIComponent(keyword)}`;
    await gotoWithRetry(page, searchUrl, { waitUntil: "domcontentloaded", timeout: 60_000 }, 3);
    await sleep(5000);

    const pageText = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
    if (/非法访问|正常浏览器|访问受限|安全验证|验证码|滑块/.test(pageText)) {
      log(`  🚧 闲鱼风控拦截：${pageText.replace(/\s+/g, " ").slice(0, 100)}`);
      const error = new Error("供应商渠道触发安全验证，需要人工接手");
      error.code = "SUPPLIER_CHANNEL_BLOCKED";
      throw error;
    }

    let itemLinks = [];
    let unchangedRounds = 0;
    for (let round = 0; round <= SEARCH_SCROLL_ROUNDS; round++) {
      itemLinks = await page.evaluate((limit) => {
        const cards = document.querySelectorAll('a[href*="/item?id="]');
        const seen = new Set();
        const links = [];
        for (const card of cards) {
          const href = card.getAttribute("href");
          if (!href) continue;
          const full = href.startsWith("http") ? href : `https://www.goofish.com${href}`;
          const idMatch = full.match(/[?&]id=(\d+)/);
          const key = idMatch ? idMatch[1] : full;
          if (!seen.has(key)) {
            seen.add(key);
            links.push(full);
          }
          if (links.length >= limit) break;
        }
        return links;
      }, SEARCH_RESULT_LIMIT);

      if (itemLinks.length >= SEARCH_RESULT_LIMIT) break;
      const before = itemLinks.length;
      await page.mouse.wheel(0, 1200);
      await sleep(1200);
      const after = await page
        .evaluate(() => new Set([...document.querySelectorAll('a[href*="/item?id="]')].map((a) => a.href)).size)
        .catch(() => before);
      unchangedRounds = after <= before ? unchangedRounds + 1 : 0;
      if (unchangedRounds >= 3) break;
    }

    log(`找到 ${itemLinks.length} 个商品链接`);
    if (itemLinks.length > 0) return itemLinks;

    // 0 个 → dump 现场，方便下次定位
    try {
      const dumpDir = path.join(__dirname, "debug");
      if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir);
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const png = path.join(dumpDir, `search-empty-${stamp}.png`);
      const html = path.join(dumpDir, `search-empty-${stamp}.html`);
      await page.screenshot({ path: png, fullPage: true });
      fs.writeFileSync(html, await page.content(), "utf8");
      log(`  📸 dump：${png}`);
    } catch (e) {
      log(`  ⚠️ dump 失败：${e.message}`);
    }

    // 不是最后一个关键词，回退继续试
    if (i < keywords.length - 1) {
      log(`  → 换关键词重试...`);
      await sleep(2000);
    }
  }

  return [];
}

// ── 发送消息给单个卖家 ────────────────────────────────────────────────────
// 改造：搜索页抓商品 URL → 直接打开商品页 → 点"聊一聊" → 聊天页 → 发消息
// 关键 DOM（2026-06-15 验证过的真实闲鱼）：
//   - 商品页"聊一聊"按钮：a.want--xxx，文字 "聊一聊"
//   - 聊天页输入框：textarea[placeholder*="请输入消息"]
//   - 聊天页 URL 含 itemId= 和 peerUserId=
//   - 发送：Enter 键

async function sendMessageToSeller(searchPage, itemHref, message, taskId, contactedSellers) {
  const context = searchPage.context();
  let itemPage = null;
  let chatPage = null;
  try {
    // 1. 直接打开已抓到的商品 URL。闲鱼搜索页会虚拟滚动，回头按 itemId 点链接容易找不到。
    const itemIdMatch = itemHref.match(/[?&]id=(\d+)/);
    const itemId = itemIdMatch ? itemIdMatch[1] : null;
    if (!itemId) {
      log(`  ⚠️  itemHref 缺少 id：${itemHref}`);
      return null;
    }

    itemPage = await context.newPage();
    await itemPage.goto(itemHref, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await itemPage.waitForLoadState("domcontentloaded", { timeout: 30_000 });
    await sleep(2500);

    // 2. 在商品页点"聊一聊"。有时开新标签，有时当前页跳转，两种都兼容。
    const chatPagePromise = context.waitForEvent("page", { timeout: 15_000 }).catch(() => null);
    const chatBtn = itemPage
      .locator('a:has-text("聊一聊"), button:has-text("聊一聊"), [role="button"]:has-text("聊一聊")')
      .first();
    const chatBtnVisible = await chatBtn.waitFor({ state: "visible", timeout: 12_000 }).then(() => true).catch(() => false);
    if (!chatBtnVisible) {
      log(`  ⚠️  商品页没有"聊一聊"按钮（可能是自营/未上架）`);
      return null;
    }
    await chatBtn.click({ timeout: 5000 });
    chatPage = await chatPagePromise;
    if (!chatPage) {
      await itemPage.waitForLoadState("domcontentloaded", { timeout: 10_000 }).catch(() => {});
      if (/\/im|peerUserId=|perUserId=|itemId=/.test(itemPage.url())) {
        chatPage = itemPage;
      } else {
        log(`  ⚠️  点击"聊一聊"后没进入聊天页`);
        return null;
      }
    }
    await chatPage.waitForLoadState("domcontentloaded", { timeout: 30_000 });
    await sleep(2500);
    if (!(await waitForManualVerification(chatPage, "进入聊天页"))) return null;

    // 3. 从聊天页 URL 抓 sellerId
    const chatUrl = chatPage.url();
    const peerMatch = chatUrl.match(/[?&](?:peerUserId|perUserId|sellerId|userId)=([^&]+)/i);
    const sellerId = peerMatch ? decodeURIComponent(peerMatch[1]) : chatUrl;
    if (contactedSellers.ids.has(sellerId)) {
      log(`  ↪️  已联系过卖家 ${sellerId}，跳过重复商品`);
      await apiPatch(`${SUPPLIER_API_PREFIX}/${taskId}/messages`, { sellerId, chatUrl }).catch(() => {});
      return { skipped: true };
    }

    // 卖家名先从聊天页头部抓一下（拿不到就用 sellerId 兜底）
    const sellerName = await chatPage
      .evaluate(() => {
        const el = document.querySelector('[class*="title"], [class*="seller"], [class*="nick"]');
        return el?.textContent?.trim()?.slice(0, 30) || "";
      })
      .catch(() => "");
    // 4. 在聊天页找 textarea，填入消息，回车发送
    const inputBox = chatPage.locator('textarea[placeholder*="请输入消息"]').first();
    await inputBox.waitFor({ state: "visible", timeout: 15_000 });
    await inputBox.click();
    await inputBox.fill(message);
    await sleep(500);
    await inputBox.press("Enter");
    await sleep(1500);

    log(`  ✅ 已发送给：${sellerName || sellerId}`);
    contactedSellers.ids.add(sellerId);

    // 5. 记录到 API
    await apiPost(`${SUPPLIER_API_PREFIX}/${taskId}/messages`, {
      sellerId,
      sellerName: sellerName || `卖家${sellerId.slice(-6)}`,
      chatUrl,
    });

    return { sellerId, sellerName: sellerName || `卖家${sellerId.slice(-6)}`, chatUrl };
  } catch (err) {
    log(`  ❌ 发送失败：${err.message?.slice(0, 120)}`);
    return null;
  } finally {
    // 关掉新开的两个标签，避免标签堆积内存爆炸
    if (chatPage && !chatPage.isClosed()) await chatPage.close().catch(() => {});
    if (itemPage && itemPage !== chatPage && !itemPage.isClosed()) await itemPage.close().catch(() => {});
  }
}

// ── 收集回复 ──────────────────────────────────────────────────────────────

function isQuoteLikeReply(text) {
  const normalized = (text ?? "").replace(/\s+/g, "");
  if (!normalized || normalized.length < 3) return false;
  if (/您好.*客户需要预订|入住.*离店/.test(normalized)) return false;
  const hasPrice = /[¥￥]\d+|\d{2,5}(元|块|给您|给你|含早|不含早)/.test(normalized);
  const hasHotelSignal = /酒店|迪士尼|房|含早|早餐|不含早|门票|花园|景观|奇梦|取消|退改/.test(normalized);
  return hasPrice && hasHotelSignal;
}

function needsHumanIntervention(text) {
  const normalized = (text ?? "").replace(/\s+/g, "");
  return /微信|vx|v信|电话|手机号|身份证|证件|付款|支付|定金|订金|押金|拍下|下单|二维码|收款码|转账|加.*信|发图|截图|图片/.test(
    normalized
  );
}

function buildAutoFollowup(task, rawText) {
  const text = (rawText ?? "").replace(/\s+/g, "");
  if (!text || isQuoteLikeReply(text) || needsHumanIntervention(text)) return null;

  if (/哪天|几号|日期|入住|离店|什么时候|时间/.test(text)) {
    return `入住${task.checkInDate}，离店${task.checkOutDate}，共${task.nights}晚。麻烦按这个日期报最低价，含早/不含早都可以。`;
  }

  if (/几人|人数|几间|间数|几位/.test(text)) {
    return `${task.guestCount}人，${task.roomCount}间房。麻烦报这个配置的最低价。`;
  }

  if (/房型|什么房|哪种房|大床|双床/.test(text)) {
    return task.roomType
      ? `房型优先按${task.roomType}报价；如果这个房型没有，也麻烦报同酒店可订的最低价房型。`
      : "房型先按同酒店可订的最低价房型报价即可，麻烦同时说明含早和取消规则。";
  }

  if (/早餐|含早|早饭/.test(text)) {
    return "含早和不含早都可以，麻烦两个价格都报一下；如果只有一种，也请说明。";
  }

  if (/取消|退改|可退|不可退/.test(text)) {
    return "麻烦报最低价时顺便说明取消规则，能免费取消最好，不能取消也请直接说明。";
  }

  if (/预算|心理价|目标价|多少能接受/.test(text)) {
    return "麻烦直接报这个日期能做的最低价，含早/不含早和取消规则一起说明就行。";
  }

  return null;
}

async function sendTextToCurrentChat(page, text) {
  const inputBox = page.locator('textarea[placeholder*="请输入消息"]').first();
  await inputBox.waitFor({ state: "visible", timeout: 10_000 });
  await inputBox.click();
  await inputBox.fill(text);
  await sleep(300);
  await inputBox.press("Enter");
  await sleep(800);
}

async function chatPageLooksBlocked(page) {
  const state = await page
    .evaluate(() => {
      const text = document.body?.innerText?.replace(/\s+/g, " ").trim() || "";
      const html = document.documentElement?.innerHTML || "";
      const hasInput = Boolean(document.querySelector('textarea[placeholder*="请输入消息"]'));
      const hasMessageDom = Boolean(
        document.querySelector('[class*="message-item"], [class*="msg-item"], [class*="bubble"], [class*="MessageItem"]')
      );
      const hasCaptchaText = /验证|滑块|拖动|安全|访问受限|异常|验证码|请完成|验证失败/.test(text);
      const hasBaxia = /baxia-dialog|sufei-dialog|nc_scale|滑块|验证失败/.test(html);
      const shellOnly = /订单\s*消息\s*发闲置\s*APP\s*反馈\s*客服\s*回顶部/.test(text) && text.length < 320;
      return {
        hasInput,
        hasMessageDom,
        hasCaptchaText,
        hasBaxia,
        shellOnly,
        text: text.slice(0, 260),
      };
    })
    .catch(() => ({
      hasInput: false,
      hasMessageDom: false,
      hasCaptchaText: false,
      hasBaxia: false,
      shellOnly: true,
      text: "",
    }));

  const chatReady = state.hasInput || state.hasMessageDom;
  return !chatReady;
}

async function waitForManualVerification(page, label) {
  if (!(await chatPageLooksBlocked(page))) return true;

  log(`  🧩 闲鱼需要人工滑块/安全验证：${label}`);
  log(`  👉 请在弹出的 Chrome 窗口完成验证，我会最多等待 ${Math.round(CAPTCHA_WAIT_MS / 1000)} 秒`);
  const started = Date.now();
  let lastReloadAt = Date.now();

  while (Date.now() - started < CAPTCHA_WAIT_MS) {
    await sleep(3000);
    if (!(await chatPageLooksBlocked(page))) {
      saveCookies(await page.context().cookies());
      log("  ✅ 验证已通过，继续处理");
      return true;
    }

    // 闲鱼有时滑块成功后不会自动恢复聊天内容，周期性刷新当前聊天页再判断。
    if (Date.now() - lastReloadAt > 15_000) {
      lastReloadAt = Date.now();
      await page.reload({ waitUntil: "domcontentloaded", timeout: 30_000 }).catch(() => {});
      await sleep(2500);
    }
  }

  log("  ⚠️ 等待验证超时，本轮先跳过这个聊天页");
  return false;
}

async function notifyHuman(task, issue) {
  if (!HUMAN_WEBHOOK_URL) return;

  const content = [
    "旅游通闲鱼询价需要人工接手",
    `酒店：${task.hotelName}`,
    `日期：${task.checkInDate} - ${task.checkOutDate}（${task.nights}晚）`,
    `商家：${issue.sellerName || issue.sellerId}`,
    `原因：${issue.reason}`,
    `回复：${issue.rawReply}`,
  ].join("\n");

  await fetch(HUMAN_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msgtype: "text", text: { content } }),
  }).catch(() => {});
}

async function submitReplyQuote(taskId, sellerId, sellerName, rawReply) {
  const result = await apiPost(`${SUPPLIER_API_PREFIX}/${taskId}/quotes`, {
    sellerId,
    sellerName,
    rawReply,
  });

  if (result?.duplicate) {
    log(`  ↪️  已存在报价，跳过：${sellerName || sellerId}`);
    return false;
  }

  if (result?.parsed) {
    const parsedCount = result.parsedCount ? `（${result.parsedCount} 条）` : "";
    log(`  ✅ 成功解析报价${parsedCount}`);
    return true;
  }

  if (result?.quote) {
    log(`  ⚠️ 已保存原始回复，待人工确认`);
  }
  return false;
}

async function collectConversationPreviews(page, taskId) {
  await page.goto(`${XIANYU_URL}/im`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await sleep(5000);

  const previews = await page.evaluate(() => {
    const rows = [];
    const items = document.querySelectorAll('[class*="conversation-item"]');
    for (const item of items) {
      const visibleDivs = [...item.querySelectorAll("div")]
        .map((el) => {
          const style = window.getComputedStyle(el);
          const text = (el.textContent || "").replace(/\s+/g, " ").trim();
          return {
            text,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            display: style.display,
            color: style.color,
          };
        })
        .filter((item) => item.text && item.display !== "none");

      const name =
        visibleDivs.find(
          (item) =>
            Number.parseInt(item.fontWeight, 10) >= 500 &&
            item.text.length <= 40 &&
            !/(刚刚|\d+分钟前|\d+小时前|昨天)/.test(item.text)
        )?.text || "";
      const preview =
        visibleDivs.find(
          (item) =>
            item.fontSize === "12px" &&
            item.text.length >= 2 &&
            item.text.length <= 260 &&
            !/(刚刚|\d+分钟前|\d+小时前|昨天)/.test(item.text)
        )?.text || "";
      const time =
        visibleDivs.find((item) => item.fontSize === "10px" && /(刚刚|\d+分钟前|\d+小时前|昨天)/.test(item.text))
          ?.text || "";

      if (preview) rows.push({ sellerName: name, preview, time });
    }
    return rows;
  });

  let totalQuotes = 0;
  const seen = new Set();
  for (const row of previews) {
    const rawReply = row.preview.trim();
    const sellerName = row.sellerName || "闲鱼商家";
    const key = `${sellerName}::${rawReply}`;
    if (seen.has(key) || !isQuoteLikeReply(rawReply)) continue;
    seen.add(key);

    const sellerId = `conversation:${sellerName}`;
    log(`  💬 会话预览 ${sellerName}：${rawReply.slice(0, 80)}${row.time ? `（${row.time}）` : ""}`);
    const parsed = await submitReplyQuote(taskId, sellerId, sellerName, rawReply);
    if (parsed) totalQuotes++;
  }

  return totalQuotes;
}

async function collectReplies(page, task, sellerIds, followedUpSellerIds, { deadlineAt = Number.POSITIVE_INFINITY } = {}) {
  log("开始收集商家回复...");
  let totalQuotes = 0;
  const humanIssues = [];

  if (sellerIds.length === 0) {
    log("  ⚠️ 本任务没有成功发送的卖家，跳过全局会话预览收集，避免旧报价污染当前任务");
    return { quoteCount: totalQuotes, humanIssues };
  }

  for (const { sellerId, sellerName, chatUrl } of sellerIds) {
    if (Date.now() >= deadlineAt) {
      log("  ⏱️ 收集窗口已到，剩余未回复商家本轮不再处理");
      break;
    }

    try {
      // 进入与该卖家的聊天页（用之前保存的真实 URL，含 itemId + peerUserId）
      const url = chatUrl || `${XIANYU_URL}/im?peerUserId=${encodeURIComponent(sellerId)}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await sleep(3000);
      const verified = await waitForManualVerification(page, sellerName || sellerId);
      if (!verified) continue;

      // 抓最近的消息气泡，过滤掉自己发的
      // ⚠️ 选择器待验证：闲鱼消息气泡的真实 class 名还没扫过
      const replies = await page.evaluate(() => {
        const bubbles = document.querySelectorAll(
          '[class*="message-item"], [class*="msg-item"], [class*="bubble"], [class*="MessageItem"]'
        );
        const texts = [];
        for (const bubble of bubbles) {
          const cls = bubble.className?.toString?.() || "";
          // 判断是否对方发的（class 不含 self/mine/right/me）
          const isSelf = /self|mine|right|me\b/i.test(cls) || bubble.getAttribute("data-is-self");
          if (!isSelf) {
            const text = bubble.textContent?.trim();
            if (text && text.length > 3 && text.length < 500) texts.push(text);
          }
        }
        // 只取最后 5 条（最近的）
        return texts.slice(-5);
      });

      if (replies.length > 0) {
        const rawReply = replies.join("\n");
        log(`  💬 ${sellerName} 回复了：${rawReply.slice(0, 50)}...`);

        if (needsHumanIntervention(rawReply)) {
          const issue = {
            sellerId,
            sellerName,
            reason: "商家要求联系方式、付款、证件或图片等敏感人工动作",
            rawReply,
          };
          humanIssues.push(issue);
          await notifyHuman(task, issue);
        }

        const parsed = await submitReplyQuote(task.id, sellerId, sellerName, rawReply);
        if (parsed) totalQuotes++;

        const followup = DISABLE_AUTO_FOLLOWUP ? null : buildAutoFollowup(task, rawReply);
        if (followup && !followedUpSellerIds.has(sellerId)) {
          await apiPatch(`${SUPPLIER_API_PREFIX}/${task.id}`, { status: "AUTO_FOLLOWUP" }).catch(() => {});
          await sendTextToCurrentChat(page, followup);
          followedUpSellerIds.add(sellerId);
          log(`  ↩️ 已自动补充信息给：${sellerName}`);
          await sleep(1000);
        }
      }
    } catch (err) {
      log(`  ❌ 收集回复失败 (${sellerName})：${err.message?.slice(0, 80)}`);
    }
  }

  return { quoteCount: totalQuotes, humanIssues };
}

// ── 报价上传模式：不打开闲鱼，只把报价写回平台 ─────────────────────────────

function inferMockBasePrice(task) {
  if (MOCK_QUOTE_BASE_PRICE > 0) return MOCK_QUOTE_BASE_PRICE;

  const text = `${task.hotelName ?? ""} ${task.roomType ?? ""} ${task.city ?? ""}`;
  if (/迪士尼|乐园酒店/.test(text)) return 1180;
  if (/悦椿|横琴|凤凰湾|海景/.test(text)) return 660;
  if (/万豪|喜来登|威斯汀|瑞吉|W酒店|希尔顿|洲际|凯悦/.test(text)) return 720;
  return 520;
}

function buildPlatformQuotePayloads(task) {
  const nights = Math.max(1, Number(task.nights || 1));
  const base = inferMockBasePrice(task);
  const room = task.roomType || "标准房";
  const cancellable = true;

  const candidates = [
    {
      sellerId: `auto:${task.id}:supplier-a`,
      sellerName: "供应商A",
      pricePerNight: base,
      breakfastIncluded: true,
      extraServices: ["含早", "可取消"],
      rawReply: `${room} ${base} 含早 可订`,
    },
    {
      sellerId: `auto:${task.id}:supplier-b`,
      sellerName: "供应商B",
      pricePerNight: base + 60,
      breakfastIncluded: true,
      extraServices: ["含双早", "可取消"],
      rawReply: `${room} ${base + 60} 含双早 可订`,
    },
    {
      sellerId: `auto:${task.id}:supplier-c`,
      sellerName: "供应商C",
      pricePerNight: base + 130,
      breakfastIncluded: false,
      extraServices: ["可取消"],
      rawReply: `${room} ${base + 130} 可订`,
    },
  ];

  return candidates.map((quote) => ({
    sellerId: quote.sellerId,
    sellerName: quote.sellerName,
    rawReply: quote.rawReply,
    pricePerNight: quote.pricePerNight,
    totalPrice: quote.pricePerNight * nights,
    breakfastIncluded: quote.breakfastIncluded,
    cancellable,
    extraServices: quote.extraServices.join(", "),
  }));
}

async function uploadQuotesToPlatform(task) {
  const quotes = buildPlatformQuotePayloads(task);
  log(`开始上传平台报价：${task.hotelName} / ${task.roomType || "默认房型"} / ${quotes.length} 家供应商`);

  await apiPatch(`${SUPPLIER_API_PREFIX}/${task.id}`, {
    status: "AI_ANALYZING",
    sentCount: quotes.length,
  });

  for (const quote of quotes) {
    const result = await apiPost(`${SUPPLIER_API_PREFIX}/${task.id}/quotes`, quote);
    const state = result?.duplicate ? "已存在" : "已写入";
    log(`  ${state}：${quote.sellerName} ¥${quote.pricePerNight}/晚`);
  }

  const result = await apiPost(`${SUPPLIER_API_PREFIX}/${task.id}/analyze`, {});
  await apiPatch(`${SUPPLIER_API_PREFIX}/${task.id}`, {
    status: "QUOTED",
    sentCount: quotes.length,
  }).catch(() => {});

  const minPrice = result?.summary?.minPricePerNight ?? Math.min(...quotes.map((quote) => quote.pricePerNight));
  log(`✅ 平台报价已反馈到前台：最低 ¥${minPrice}/晚起`);
  log(`前台链接：${API_BASE}/inquiry/${task.inquiryId}/supplier-quote?taskId=${task.id}`);
}

async function runQuoteUploadMode({ onceMode, taskIdArg }) {
  log("🚀 旅游通供应商报价上传机器人启动");
  log(`API 地址：${API_BASE}`);
  log(`任务接口：${SUPPLIER_API_PREFIX}${SUPPLIER_BOT_TOKEN ? "（token 已配置）" : "（未配置 token）"}`);
  log(onceMode ? "单次处理模式：处理完一单后退出\n" : "开始轮询任务...\n");

  const handleNextTask = async () => {
    const data = taskIdArg
      ? await apiGet(`${SUPPLIER_API_PREFIX}/${encodeURIComponent(taskIdArg)}`)
      : await apiPost(`${SUPPLIER_API_PREFIX}/pending`, {});
    const task = data?.task;

    if (!task) {
      log(taskIdArg ? `未找到任务：${taskIdArg}` : "暂无待处理任务");
      return false;
    }

    await uploadQuotesToPlatform(task);
    return true;
  };

  if (onceMode || taskIdArg) {
    await handleNextTask();
    return;
  }

  while (true) {
    try {
      await handleNextTask();
      await sleep(TASK_POLL_INTERVAL_MS);
    } catch (err) {
      log(`报价上传循环异常：${err.message}`);
      await sleep(30_000);
    }
  }
}

// ── 主流程 ────────────────────────────────────────────────────────────────

async function processTask(browser, task) {
  log(`\n📋 开始处理任务：${task.hotelName} / ${task.city} / ${task.checkInDate}→${task.checkOutDate}`);

  let context = null;

  try {
    if (task.status === "PENDING") {
      const claimed = await apiPatch(`${SUPPLIER_API_PREFIX}/${task.id}`, { status: "SEARCHING" });
      task = claimed?.task ? { ...task, ...claimed.task } : task;
      log("已标记任务为供应商匹配中");
    }

    log("正在创建浏览器上下文...");
    context = await withTimeout(newXianyuContext(browser), 45_000, "创建浏览器上下文超时");
    log("正在创建页面...");
    const page = await withTimeout(context.newPage(), 45_000, "创建页面超时");
    log("浏览器页面创建完成");

    // 注入 Cookie
    const cookies = loadCookies();
    if (!cookies?.length) {
      throw new Error(`未读取到登录 Cookie：${COOKIE_FILE}`);
    }
    await context.addCookies(cookies);
    log(`已载入 ${cookies.length} 个登录 Cookie`);

    const taskSnapshot = await apiGet(`${SUPPLIER_API_PREFIX}/${task.id}`);
    const taskFromApi = taskSnapshot?.task ?? task;
    const existingMessages = taskFromApi.messages ?? [];
    const existingValidQuotes = (taskFromApi.quotes ?? []).filter((quote) => quote.pricePerNight > 0).length;
    const collectOnlyStatuses = new Set(["WAITING_REPLIES", "COLLECTING", "NEEDS_HUMAN"]);
    const collectOnly =
      existingMessages.length > 0 && (existingMessages.length >= MAX_SELLERS || collectOnlyStatuses.has(taskFromApi.status));
    let itemLinks = [];

    if (collectOnly) {
      log(`已存在 ${existingMessages.length} 条发送记录，跳过搜索/发送，直接进入限时收集`);
    } else {
      // 1. 更新状态：搜索中
      await apiPatch(`${SUPPLIER_API_PREFIX}/${task.id}`, { status: "SEARCHING" });
      log("进入供应商匹配/搜索阶段");

      // 2. 搜索商家
      itemLinks = await searchSellers(page, task);
      if (itemLinks.length === 0) {
        const reason = "暂未自动匹配到可报价供应商，客服将人工继续确认";
        log(reason);
        await apiPatch(`${SUPPLIER_API_PREFIX}/${task.id}`, {
          status: "NEEDS_HUMAN",
          aiSummary: JSON.stringify({ needHumanReason: reason, quoteCount: 0 }),
        });
        return;
      }

      // 3. 更新状态：发消息
      await apiPatch(`${SUPPLIER_API_PREFIX}/${task.id}`, { status: "MESSAGING" });
    }

    const sentSellers = [];
    const seenExistingSellerKeys = new Set();
    let lastSentAtMs = 0;
    for (const msg of existingMessages) {
      const sellerKey = msg.sellerId;
      if (!sellerKey || seenExistingSellerKeys.has(sellerKey)) continue;
      seenExistingSellerKeys.add(sellerKey);
      const sentAtMs = msg.sentAt ? new Date(msg.sentAt).getTime() : 0;
      if (Number.isFinite(sentAtMs)) lastSentAtMs = Math.max(lastSentAtMs, sentAtMs);
      sentSellers.push({
        sellerId: msg.sellerId,
        sellerName: msg.sellerName || `卖家${msg.sellerId.slice(-6)}`,
        chatUrl: msg.chatUrl || undefined,
      });
    }

    const contactedSellers = {
      ids: new Set(existingMessages.map((msg) => msg.sellerId).filter(Boolean)),
    };
    if (existingMessages.length > 0) {
      log(`已加载历史联系记录：${contactedSellers.ids.size} 个 sellerId`);
    }
    let newlySentCount = 0;

    for (let i = 0; i < itemLinks.length && sentSellers.length < MAX_SELLERS; i++) {
      log(`发送消息候选 ${i + 1}/${itemLinks.length}...`);
      const message = buildMessage(task, i);
      const seller = await sendMessageToSeller(page, itemLinks[i], message, task.id, contactedSellers);
      if (seller?.skipped) {
        await sleep(3000);
        continue;
      }
      if (seller) {
        sentSellers.push(seller);
        newlySentCount++;
        lastSentAtMs = Date.now();
      }

      // 保存 Cookie（防止 session 过期）
      const updatedCookies = await context.cookies();
      saveCookies(updatedCookies);

      // 确保搜索页仍在，被关掉就重新打开
      if (page.isClosed() || !page.url().includes("/search")) {
        log("  ↩️  搜索页丢失，重新打开...");
        await gotoWithRetry(page, `${XIANYU_URL}/search?q=${encodeURIComponent(task.hotelName)}`, {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        }, 2).catch(() => {});
        await sleep(3000);
      }

      // 不是最后一条，随机延迟
      if (seller && i < itemLinks.length - 1 && sentSellers.length < MAX_SELLERS) {
        const delay = MSG_DELAY_MIN + Math.random() * (MSG_DELAY_MAX - MSG_DELAY_MIN);
        log(`  ⏳ 等待 ${Math.round(delay / 1000)} 秒后发下一条...`);
        await sleep(delay);
      }
    }

    log(
      `\n✅ 本次新增发送 ${newlySentCount} 条，累计联系 ${sentSellers.length} 个卖家`
    );

    // 4. 更新状态：等待回复
    await apiPatch(`${SUPPLIER_API_PREFIX}/${task.id}`, { status: "WAITING_REPLIES" });
    const waitMs =
      newlySentCount > 0 && lastSentAtMs > 0
        ? Math.max(0, lastSentAtMs + REPLY_WAIT_MS - Date.now())
        : 0;
    if (waitMs > 0) {
      log(`⏳ 等商家集中回复 ${Math.ceil(waitMs / 60000)} 分钟，然后用 ${COLLECT_DURATION_MS / 60000} 分钟收集报价`);
      await sleep(waitMs);
    } else {
      log(`⏱️ 直接进入 ${COLLECT_DURATION_MS / 60000} 分钟限时收集窗口`);
    }

    // 5. 限时收集回复：超过窗口的商家本轮不再处理，避免拖慢客户反馈。
    const startTime = Date.now();
    const deadlineAt = startTime + COLLECT_DURATION_MS;
    let totalQuotes = existingValidQuotes;
    const followedUpSellerIds = new Set();
    const humanIssues = [];

    while (Date.now() < deadlineAt) {
      await apiPatch(`${SUPPLIER_API_PREFIX}/${task.id}`, { status: "COLLECTING" });
      log(`\n🔄 限时收集回复...（剩余 ${Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000))} 秒）`);
      const collected = await collectReplies(page, task, sentSellers, followedUpSellerIds, { deadlineAt });
      totalQuotes += collected.quoteCount;
      humanIssues.push(...collected.humanIssues);
      log(`累计有效报价：${totalQuotes} 个`);

      if (totalQuotes >= MIN_QUOTES_TO_STOP) {
        log(`已收到 ${totalQuotes} 个有效报价，提前结束等待`);
        break;
      }

      const remaining = deadlineAt - Date.now();
      if (remaining <= 0) break;
      await apiPatch(`${SUPPLIER_API_PREFIX}/${task.id}`, { status: "WAITING_REPLIES" });
      await sleep(Math.min(POLL_INTERVAL_MS, remaining));
    }

    if (totalQuotes === 0) {
      const firstIssue = humanIssues[0];
      const reason = firstIssue
        ? `${firstIssue.sellerName || firstIssue.sellerId} 需要人工处理：${firstIssue.rawReply.slice(0, 120)}`
        : "本轮限时收集未拿到有效商家报价，需要客服人工继续询价";

      await apiPatch(`${SUPPLIER_API_PREFIX}/${task.id}`, {
        status: "NEEDS_HUMAN",
        aiSummary: JSON.stringify({ needHumanReason: reason, quoteCount: 0 }),
      });
      log(`⚠️ 未拿到有效报价，任务转人工：${reason}`);
      return;
    }

    // 6. 触发 AI 分析
    log("\n🤖 触发 AI 分析报价...");
    await apiPost(`${SUPPLIER_API_PREFIX}/${task.id}/analyze`, {});
    log("✅ AI 分析完成，任务结束！");
  } catch (err) {
    log(`❌ 任务异常：${err.message}`);
    const needsHuman = err.code === "SUPPLIER_CHANNEL_BLOCKED" || /安全验证|非法访问|访问受限|验证码|滑块/.test(err.message);
    await apiPatch(
      `${SUPPLIER_API_PREFIX}/${task.id}`,
      needsHuman
        ? {
            status: "NEEDS_HUMAN",
            aiSummary: JSON.stringify({
              needHumanReason: "供应商渠道触发安全验证，客服将人工继续询价",
              quoteCount: 0,
            }),
          }
        : { status: "FAILED" },
    ).catch(() => {});
  } finally {
    if (context) await context.close().catch(() => {});
  }
}

// ── 入口 ──────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const loginMode = args.includes("--login");
  const onceMode = args.includes("--once");
  const quoteUploadMode =
    args.includes("--mock-quotes")
    || process.env.SUPPLIER_MOCK_QUOTES === "true"
    || process.env.XIANYU_MOCK_QUOTES === "true";
  const taskIdArg = args.find((arg) => arg.startsWith("--task-id="))?.split("=").slice(1).join("=");

  if (loginMode) {
    const ok = await loginAndSaveCookies();
    process.exit(ok ? 0 : 1);
  }

  if (quoteUploadMode) {
    await runQuoteUploadMode({ onceMode, taskIdArg });
    return;
  }

  if (!fs.existsSync(COOKIE_FILE)) {
    log("⚠️  未找到登录凭证，请先运行：node index.js --login");
    process.exit(1);
  }

  log("🚀 旅游通闲鱼询价机器人启动");
  log(`API 地址：${API_BASE}`);
  log(`任务接口：${SUPPLIER_API_PREFIX}${SUPPLIER_BOT_TOKEN ? "（token 已配置）" : "（未配置 token）"}`);
  log(onceMode ? "单次处理模式：处理完一单后退出\n" : "开始轮询任务...\n");

  log(
    `浏览器模式：${BROWSER_HEADLESS ? "headless" : "headed"}${BROWSER_CHANNEL ? ` / ${BROWSER_CHANNEL}` : ""}`
  );
  const browser = await withTimeout(launchXianyuBrowser(), 60_000, "启动浏览器超时");

  if (onceMode) {
    try {
      const data = taskIdArg
        ? await apiGet(`${SUPPLIER_API_PREFIX}/${encodeURIComponent(taskIdArg)}`)
        : await apiPost(`${SUPPLIER_API_PREFIX}/pending`, {});
      const task = taskIdArg ? data?.task : data?.task;

      if (!task) {
        log(taskIdArg ? `未找到任务：${taskIdArg}` : "暂无待处理任务");
        return;
      }

      await processTask(browser, task);
    } finally {
      await browser.close().catch(() => {});
    }
    return;
  }

  // 主循环：持续轮询任务
  while (true) {
    try {
      const data = await apiPost(`${SUPPLIER_API_PREFIX}/pending`, {});
      const task = data?.task;

      if (task) {
        await processTask(browser, task);
      } else {
        log(`暂无待处理任务，${Math.round(TASK_POLL_INTERVAL_MS / 1000)}秒后重试...`);
        await sleep(TASK_POLL_INTERVAL_MS);
      }
    } catch (err) {
      log(`主循环异常：${err.message}`);
      await sleep(30_000);
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
