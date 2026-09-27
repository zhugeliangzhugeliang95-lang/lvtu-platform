"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plane,
  MessageCircle,
  Copy,
  X,
  Check,
  ChevronDown,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Phone,
  Sparkles,
  Hotel,
  Ticket,
  FileText,
  Compass,
  Heart,
  Baby,
  GraduationCap,
  ShieldCheck,
  HeadphonesIcon,
  RefreshCw,
  Search,
  Menu,
} from "lucide-react";
import {
  BUDGET_OPTIONS,
  FALLBACK_SITE_CONFIG,
  GUEST_OPTIONS,
  ICP_LINK,
  ICP_NUMBER,
  LANDING_TRUST_BADGES,
  PREFERENCE_OPTIONS,
  PSB_LINK,
  PSB_NUMBER,
  ROOM_OPTIONS,
  TIMEFRAME_OPTIONS,
  TRAVEL_TONG_BRAND,
  type SiteConfig,
} from "@/lib/travelTong";

/* =========================================================================
   Constants & Data
   ========================================================================= */

type Destination = {
  name: string;
  cover: string;
  tags: string[];
  note: string;
  badge: string;
};

const DESTINATIONS: Destination[] = [
  {
    name: "三亚",
    cover:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=70",
    tags: ["亚龙湾", "海景房", "亲子情侣"],
    note: "今日可询价",
    badge: "热门",
  },
  {
    name: "上海迪士尼",
    cover:
      "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=900&q=70",
    tags: ["园区附近", "亲子友好", "周末出游"],
    note: "今日可询价",
    badge: "亲子热门",
  },
  {
    name: "香港",
    cover:
      "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=900&q=70",
    tags: ["铜锣湾", "尖沙咀", "近地铁"],
    note: "今日可询价",
    badge: "热门",
  },
  {
    name: "澳门",
    cover:
      "https://images.unsplash.com/photo-1581368135153-a506cf13b1e1?auto=format&fit=crop&w=900&q=70",
    tags: ["威尼斯人", "新濠天地", "情侣度假"],
    note: "今日可询价",
    badge: "可询价",
  },
  {
    name: "东京",
    cover:
      "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=900&q=70",
    tags: ["新宿", "银座", "近地铁"],
    note: "近期热门",
    badge: "近期热门",
  },
  {
    name: "大阪",
    cover:
      "https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=900&q=70",
    tags: ["环球影城", "心斋桥", "亲子推荐"],
    note: "今日可询价",
    badge: "可询价",
  },
  {
    name: "首尔",
    cover:
      "https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=900&q=70",
    tags: ["明洞", "弘大", "购物美食"],
    note: "今日可询价",
    badge: "可询价",
  },
  {
    name: "曼谷",
    cover:
      "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=900&q=70",
    tags: ["素坤逸", "暹罗", "高星性价比"],
    note: "近期热门",
    badge: "近期热门",
  },
  {
    name: "新加坡",
    cover:
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=70",
    tags: ["圣淘沙", "滨海湾", "亲子家庭"],
    note: "今日可询价",
    badge: "热门",
  },
  {
    name: "云南",
    cover:
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=70",
    tags: ["大理丽江", "毕业旅行", "多间房"],
    note: "今日可询价",
    badge: "可询价",
  },
];

type Scenario = {
  title: string;
  desc: string;
  destinations: string;
  cta: string;
  cover: string;
  icon: React.ReactNode;
  hint: string;
};

const SCENARIOS: Scenario[] = [
  {
    title: "学生党出游",
    desc: "预算有限，也想住得舒服一点，先让客服帮你找性价比酒店。",
    destinations: "云南 / 曼谷 / 大阪 / 首尔",
    cta: "学生党问价",
    cover:
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=70",
    icon: <GraduationCap className="h-4 w-4" />,
    hint: "学生党，预算有限，想找性价比酒店。",
  },
  {
    title: "情侣旅行",
    desc: "想住得舒服、拍照好看、位置方便，可以先查几套方案。",
    destinations: "三亚 / 澳门 / 东京 / 新加坡",
    cta: "情侣游问价",
    cover:
      "https://images.unsplash.com/photo-1502301197179-65228ab57f78?auto=format&fit=crop&w=900&q=70",
    icon: <Heart className="h-4 w-4" />,
    hint: "情侣旅行，想住得舒服、位置方便、拍照好看。",
  },
  {
    title: "亲子家庭",
    desc: "更关心早餐、位置、床型和出行方便，客服帮你一起看。",
    destinations: "上海迪士尼 / 三亚 / 新加坡 / 大阪",
    cta: "亲子游问价",
    cover:
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=70",
    icon: <Baby className="h-4 w-4" />,
    hint: "亲子家庭出游，关心早餐、位置和加床。",
  },
  {
    title: "多人毕业旅行",
    desc: "多间房、多晚入住，自己比价太麻烦，可以直接提交需求。",
    destinations: "云南 / 曼谷 / 三亚 / 香港",
    cta: "毕业旅行问价",
    cover:
      "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=70",
    icon: <Users className="h-4 w-4" />,
    hint: "毕业旅行多人出行，多间房想一起比价。",
  },
];

type Service = {
  title: string;
  desc: string;
  cta: string;
  icon: React.ReactNode;
};

const SERVICES: Service[] = [
  {
    title: "酒店核价",
    desc: "同一家酒店，不同渠道、不同日期价格可能不一样。把入住日期和预算告诉客服，帮你查更合适的价格。",
    cta: "查酒店价格",
    icon: <Hotel className="h-5 w-5" />,
  },
  {
    title: "房型对比",
    desc: "大床房、双床房、家庭房、海景房——客服帮你横向对比早餐、面积和取消政策。",
    cta: "对比房型",
    icon: <Compass className="h-5 w-5" />,
  },
  {
    title: "多人多间房",
    desc: "毕业旅行、公司团建多间房，自己一间一间比价太麻烦，告诉我们人数和间数即可。",
    cta: "问多间房价格",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "早餐 / 取消 / 早鸟",
    desc: "含不含早、能不能取消、有没有早鸟价，这些细节客服帮你看清楚再决定。",
    cta: "确认入住规则",
    icon: <Ticket className="h-5 w-5" />,
  },
  {
    title: "酒店 + 接送机",
    desc: "想顺带订接送机或当地包车？酒店和接送可以一起报，省去自己再问一次。",
    cta: "问酒店 + 接车",
    icon: <Plane className="h-5 w-5" />,
  },
  {
    title: "私域确认下单",
    desc: "觉得方案合适，再加客服微信确认，不在页面下单。不合适不用订，没有压力。",
    cta: "了解流程",
    icon: <FileText className="h-5 w-5" />,
  },
];

const WHY_CHOOSE = [
  {
    title: "免费询价",
    desc: "先提交需求，看完方案再决定，不满意不用订。",
    icon: <Search className="h-5 w-5" />,
  },
  {
    title: "实时核价",
    desc: "酒店价格和库存随时间变化，客服每次都帮你重新核一遍。",
    icon: <RefreshCw className="h-5 w-5" />,
  },
  {
    title: "多渠道比价",
    desc: "不同平台价格不一样，把需求给我们一次性看，省得自己反复查。",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "专人客服对接",
    desc: "把目的地、入住日期、人数、预算告诉我们，客服帮你整理。",
    icon: <HeadphonesIcon className="h-5 w-5" />,
  },
  {
    title: "学生党友好",
    desc: "学生党、情侣游、毕业旅行、亲子周末，都可以先问问。",
    icon: <Sparkles className="h-5 w-5" />,
  },
];

const STEPS = [
  {
    title: "填写需求",
    desc: "目的地、入住日期、人数、预算，30 秒填完。",
  },
  {
    title: "客服核价",
    desc: "客服根据你的需求，帮你看酒店价格和可订方案。",
  },
  {
    title: "私域确认",
    desc: "觉得合适再加微信确认，不合适不用下单。",
  },
];

const TEMPLATES = [
  "我想去三亚，2 个人，住 2 晚，想看看海边酒店多少钱。",
  "学生预算有限，想去上海迪士尼附近，有没有便宜点的酒店？",
  "一家三口去香港，想住交通方便一点的，预算别太高。",
  "想去东京，2 个人，帮我看看新宿附近酒店。",
  "毕业旅行 6 个人，想去云南，多间房能不能便宜点？",
  "只想问酒店，从周五住到周日，看看哪家划算。",
];

const FAQS = [
  {
    q: "询价收费吗？",
    a: "不收费。你可以先提交需求，客服给你看方案和报价。",
  },
  {
    q: "一定比我自己订便宜吗？",
    a: "我们会尽量帮你匹配合适的低价方案，但具体价格会随时间、库存和渠道变化，以客服实时核价为准。",
  },
  {
    q: "可以只问酒店吗？",
    a: "可以。第一阶段旅途主要做酒店代订询价，机票门票等可以一起备注。",
  },
  {
    q: "多久能联系我？",
    a: "客服看到需求后会尽快通过微信或手机号联系你。",
  },
  {
    q: "不想下单可以吗？",
    a: "可以。觉得合适再定，不合适不用下单。",
  },
  {
    q: "为什么要留微信或手机号？",
    a: "酒店价格、房型、早餐和取消政策需要人工确认，客服会把方案发给你。",
  },
  {
    q: "提交信息安全吗？",
    a: "你的信息仅用于酒店询价和客服沟通，不会公开展示。",
  },
];

/* =========================================================================
   Hotel Brand Partners
   ========================================================================= */

type HotelBrand = {
  zh: string;
  en: string;
  logo: string;
};

const HOTEL_BRANDS: HotelBrand[] = [
  // 万豪系
  { zh: "万豪", en: "Marriott", logo: "https://www.google.com/s2/favicons?sz=128&domain=marriott.com" },
  { zh: "喜来登", en: "Sheraton", logo: "https://www.google.com/s2/favicons?sz=128&domain=sheraton.com" },
  { zh: "W酒店", en: "W Hotels", logo: "https://www.google.com/s2/favicons?sz=128&domain=marriott.com/w-hotels" },
  { zh: "威斯汀", en: "Westin", logo: "https://www.google.com/s2/favicons?sz=128&domain=westin.com" },
  { zh: "瑞吉", en: "St. Regis", logo: "https://www.google.com/s2/favicons?sz=128&domain=stregis.com" },
  { zh: "豪华精选", en: "Luxury Collection", logo: "https://www.google.com/s2/favicons?sz=128&domain=theluxurycollection.com" },
  { zh: "雅乐轩", en: "Aloft", logo: "https://www.google.com/s2/favicons?sz=128&domain=alofthotels.com" },
  { zh: "万枫", en: "Fairfield", logo: "https://www.google.com/s2/favicons?sz=128&domain=fairfield.marriott.com" },
  { zh: "万怡", en: "Courtyard", logo: "https://www.google.com/s2/favicons?sz=128&domain=courtyard.marriott.com" },
  { zh: "万豪行政公寓", en: "Marriott Executive", logo: "https://www.google.com/s2/favicons?sz=128&domain=executiveapartments.marriott.com" },
  // 希尔顿系
  { zh: "希尔顿", en: "Hilton", logo: "https://www.google.com/s2/favicons?sz=128&domain=hilton.com" },
  { zh: "康莱德", en: "Conrad", logo: "https://www.google.com/s2/favicons?sz=128&domain=conradhotels.com" },
  { zh: "华尔道夫", en: "Waldorf Astoria", logo: "https://www.google.com/s2/favicons?sz=128&domain=waldorfastoria.com" },
  { zh: "DoubleTree", en: "DoubleTree", logo: "https://www.google.com/s2/favicons?sz=128&domain=doubletree.com" },
  { zh: "希尔顿花园", en: "Hilton Garden Inn", logo: "https://www.google.com/s2/favicons?sz=128&domain=hiltongardeninn.com" },
  { zh: "汉普顿", en: "Hampton", logo: "https://www.google.com/s2/favicons?sz=128&domain=hamptoninn.com" },
  { zh: "格芮精选", en: "Curio Collection", logo: "https://www.google.com/s2/favicons?sz=128&domain=curiocollection.com" },
  // 洲际系
  { zh: "洲际", en: "InterContinental", logo: "https://www.google.com/s2/favicons?sz=128&domain=ihg.com" },
  { zh: "皇冠假日", en: "Crowne Plaza", logo: "https://www.google.com/s2/favicons?sz=128&domain=crowneplaza.com" },
  { zh: "假日", en: "Holiday Inn", logo: "https://www.google.com/s2/favicons?sz=128&domain=holidayinn.com" },
  { zh: "智选假日", en: "Holiday Inn Express", logo: "https://www.google.com/s2/favicons?sz=128&domain=hiexpress.com" },
  { zh: "英迪格", en: "Hotel Indigo", logo: "https://www.google.com/s2/favicons?sz=128&domain=hotelindigo.com" },
  { zh: "华邑", en: "HUALUXE", logo: "https://www.google.com/s2/favicons?sz=128&domain=hualuxe.com" },
  { zh: "逸衡", en: "Even Hotels", logo: "https://www.google.com/s2/favicons?sz=128&domain=evenhotels.com" },
  // 凯悦系
  { zh: "凯悦", en: "Hyatt", logo: "https://www.google.com/s2/favicons?sz=128&domain=hyatt.com" },
  { zh: "柏悦", en: "Park Hyatt", logo: "https://www.google.com/s2/favicons?sz=128&domain=parkhyatt.com" },
  { zh: "君悦", en: "Grand Hyatt", logo: "https://www.google.com/s2/favicons?sz=128&domain=grandhyatt.com" },
  { zh: "凯悦嘉轩", en: "Hyatt Place", logo: "https://www.google.com/s2/favicons?sz=128&domain=hyattplace.com" },
  // 雅高系
  { zh: "索菲特", en: "Sofitel", logo: "https://www.google.com/s2/favicons?sz=128&domain=sofitel.com" },
  { zh: "诺富特", en: "Novotel", logo: "https://www.google.com/s2/favicons?sz=128&domain=novotel.com" },
];

/* =========================================================================
   Form state
   ========================================================================= */

// 首屏轻量问卷（出行意向）
type IntentForm = {
  destination: string;
  timeframe: string;
  guestCount: string;
  contactType: "WECHAT" | "MOBILE";
  contactValue: string;
  remark: string;
};

const EMPTY_INTENT: IntentForm = {
  destination: "",
  timeframe: "",
  guestCount: "",
  contactType: "WECHAT",
  contactValue: "",
  remark: "",
};

// 酒店板块详细问卷
type HotelForm = {
  destination: string;
  checkInDate: string;
  checkOutDate: string;
  roomCount: string;
  guestCount: string;
  budget: string;
  preferences: string[];
  contactType: "WECHAT" | "MOBILE";
  contactValue: string;
  remark: string;
};

const EMPTY_HOTEL: HotelForm = {
  destination: "",
  checkInDate: "",
  checkOutDate: "",
  roomCount: "",
  guestCount: "",
  budget: "",
  preferences: [],
  contactType: "WECHAT",
  contactValue: "",
  remark: "",
};

/* =========================================================================
   Logo
   ========================================================================= */

function Logo({
  size = 40,
  mode = "light",
}: {
  size?: number;
  mode?: "light" | "dark";
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="shrink-0 overflow-hidden"
        style={{ width: size, height: size }}
      >
        <img
          src="/logo.png"
          alt={TRAVEL_TONG_BRAND.logoAlt}
          width={size}
          height={size}
          draggable={false}
          className="select-none"
          style={{
            width: size,
            height: size,
            objectFit: "contain",
          }}
        />
      </div>
      <span
        className={`text-[18px] font-semibold tracking-tight ${
          mode === "dark" ? "text-white" : "text-[#0b1f4a]"
        }`}
      >
        {TRAVEL_TONG_BRAND.name}
      </span>
    </div>
  );
}

/* =========================================================================
   Navbar
   ========================================================================= */

function Navbar({
  onWechat,
  onInquire,
}: {
  onWechat: () => void;
  onInquire: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems: Array<{ label: string; href: string }> = [
    { label: "免费询价", href: "#lead-form" },
    { label: "热门目的地", href: "#destinations" },
    { label: "出行场景", href: "#scenarios" },
    { label: "服务范围", href: "#services" },
    { label: "客服微信", href: "#wechat" },
    { label: "常见问题", href: "#faq" },
  ];

  const onNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (!href.startsWith("#")) return;
    const id = href.slice(1);
    if (id === "lead-form") {
      onInquire();
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled
          ? "border-b border-[#e4e7ec] bg-white/85 backdrop-blur-xl shadow-[0_4px_20px_-12px_rgba(15,23,42,0.18)]"
          : "border-b border-transparent bg-white/70 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-[64px] max-w-[1240px] items-center justify-between px-4 md:h-[72px] md:px-6">
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => onNavClick(e, item.href)}
              className="text-[14px] text-[#475467] transition hover:text-[#0b4fd8]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={onWechat}
            className="hidden items-center gap-1.5 rounded-full border border-[#0b4fd8]/25 px-4 py-2 text-[13px] font-medium text-[#0b4fd8] transition hover:border-[#0b4fd8] hover:bg-[#eaf1ff] md:inline-flex"
          >
            <MessageCircle className="h-4 w-4" />
            加客服微信
          </button>
          <button
            onClick={onInquire}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#ff7a1a] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,122,26,0.55)] transition hover:bg-[#ff8a35] active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" />
            免费查酒店低价
          </button>
          <Link href="/explore" aria-label="打开旅行服务导航" className="grid h-9 w-9 place-items-center rounded-lg text-[#475467] hover:bg-[#f1f5fb] lg:hidden">
            <Menu className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* =========================================================================
   IntentFormCard —— 首屏轻量出行意向表单
   ========================================================================= */

function IntentFormCard({
  form,
  setForm,
  onSubmit,
  privacyText,
  submitting,
}: {
  form: IntentForm;
  setForm: (next: IntentForm) => void;
  onSubmit: (form: IntentForm) => void;
  privacyText: string;
  submitting?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.destination.trim()) {
      setError("先告诉我们你想去哪。");
      return;
    }
    if (!form.timeframe) {
      setError("选一下大概什么时候出发。");
      return;
    }
    if (!form.guestCount) {
      setError("选一下几个人出行。");
      return;
    }
    if (!form.contactValue.trim()) {
      setError("留个微信号或手机号，方便客服联系你。");
      return;
    }
    if (
      form.contactType === "MOBILE" &&
      !/^1[3-9]\d{9}$/.test(form.contactValue.trim())
    ) {
      setError("手机号格式不正确，应为 11 位。");
      return;
    }
    setError(null);
    onSubmit(form);
  };

  return (
    <motion.form
      id="lead-form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-full rounded-[24px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.03] backdrop-blur md:p-7"
    >
      {/* honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] top-[-9999px] h-px w-px opacity-0"
      />

      <div className="mb-4 md:mb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fff3e8] px-2.5 py-1 text-[11px] font-medium text-[#b04a00]">
          <Sparkles className="h-3 w-3" />
          免费询价 · 30秒填写
        </div>
        <h3 className="mt-2.5 text-[18px] font-semibold tracking-tight text-[#172033] md:mt-3 md:text-[22px]">
          快速询价
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-[#667085] md:text-[13.5px]">
          填写基本信息，客服会为你对比多家平台找到最优方案
        </p>
      </div>

      <div className="space-y-3.5 md:space-y-4">
        <Field
          label="想去哪里"
          icon={<MapPin className="h-4 w-4" />}
          required
        >
          <input
            value={form.destination}
            onChange={(e) =>
              setForm({ ...form, destination: e.target.value })
            }
            placeholder="例如：三亚、上海迪士尼、成都"
            className={inputCls}
            maxLength={50}
          />
        </Field>

        <Field
          label="大概什么时候出发"
          icon={<Calendar className="h-4 w-4" />}
          required
        >
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {TIMEFRAME_OPTIONS.map((t) => (
              <Chip
                key={t}
                active={form.timeframe === t}
                onClick={() => setForm({ ...form, timeframe: t })}
              >
                {t}
              </Chip>
            ))}
          </div>
        </Field>

        <Field
          label="几个人出行"
          icon={<Users className="h-4 w-4" />}
          required
        >
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {GUEST_OPTIONS.map((p) => (
              <Chip
                key={p}
                active={form.guestCount === p}
                onClick={() => setForm({ ...form, guestCount: p })}
              >
                {p}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="联系方式" icon={<Phone className="h-4 w-4" />} required>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex shrink-0 rounded-xl border border-[#e4e7ec] bg-white p-1 text-[13px]">
              <button
                type="button"
                onClick={() => setForm({ ...form, contactType: "WECHAT" })}
                className={`flex-1 rounded-lg px-3 py-1.5 font-medium transition sm:flex-none ${
                  form.contactType === "WECHAT"
                    ? "bg-[#0b4fd8] text-white shadow-sm"
                    : "text-[#475467] hover:bg-[#f5f8ff]"
                }`}
              >
                微信
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, contactType: "MOBILE" })}
                className={`flex-1 rounded-lg px-3 py-1.5 font-medium transition sm:flex-none ${
                  form.contactType === "MOBILE"
                    ? "bg-[#0b4fd8] text-white shadow-sm"
                    : "text-[#475467] hover:bg-[#f5f8ff]"
                }`}
              >
                手机号
              </button>
            </div>
            <input
              value={form.contactValue}
              onChange={(e) =>
                setForm({ ...form, contactValue: e.target.value })
              }
              placeholder={
                form.contactType === "WECHAT"
                  ? "填写微信号"
                  : "填写手机号"
              }
              inputMode={form.contactType === "MOBILE" ? "numeric" : "text"}
              className={`${inputCls} flex-1`}
              maxLength={50}
            />
          </div>
        </Field>

        <Field label="其他需求（选填）">
          <textarea
            value={form.remark}
            onChange={(e) => setForm({ ...form, remark: e.target.value })}
            placeholder="例如：想住海景房、预算有限、带小孩..."
            rows={2}
            maxLength={500}
            className={`${inputCls} resize-none py-2.5`}
          />
        </Field>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-[#fef3f2] px-3 py-2 text-[13px] text-[#b42318]"
          >
            {error}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="group relative w-full overflow-hidden rounded-2xl bg-linear-to-r from-[#ff7a1a] to-[#ff913f] px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_30px_-10px_rgba(255,122,26,0.6)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="relative z-10">
            {submitting ? "正在跳转…" : "立即咨询优惠"}
          </span>
          <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </button>

        {/* AI 完整询价入口 */}
        <a
          href="/inquiry"
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#0b4fd8]/25 bg-[#f5f8ff] py-3 text-[13.5px] font-medium text-[#0b4fd8] transition active:scale-[0.98]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI 对比参考价格 · 更多偏好选项
        </a>

        <p className="text-center text-[12px] leading-relaxed text-[#98a2b3]">
          {privacyText}
        </p>
      </div>
    </motion.form>
  );
}

/* =========================================================================
   HotelFormCard —— 酒店板块里的详细询价表单
   ========================================================================= */

function HotelFormCard({
  form,
  setForm,
  onSubmit,
  privacyText,
  submitting,
}: {
  form: HotelForm;
  setForm: (next: HotelForm) => void;
  onSubmit: (form: HotelForm) => void;
  privacyText: string;
  submitting?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  const togglePref = (s: string) => {
    const next = form.preferences.includes(s)
      ? form.preferences.filter((v) => v !== s)
      : [...form.preferences, s];
    setForm({ ...form, preferences: next });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.destination.trim()) {
      setError("请填写目的地或城市。");
      return;
    }
    if (!form.checkInDate || !form.checkOutDate) {
      setError("请选择入住日期和离店日期。");
      return;
    }
    if (
      new Date(form.checkOutDate).getTime() <=
      new Date(form.checkInDate).getTime()
    ) {
      setError("离店日期必须晚于入住日期。");
      return;
    }
    if (!form.roomCount) {
      setError("请选择房间数。");
      return;
    }
    if (!form.guestCount) {
      setError("请选择入住人数。");
      return;
    }
    if (!form.budget) {
      setError("请选择每晚预算。");
      return;
    }
    if (!form.contactValue.trim()) {
      setError("请填写微信号或手机号，方便客服联系你。");
      return;
    }
    if (
      form.contactType === "MOBILE" &&
      !/^1[3-9]\d{9}$/.test(form.contactValue.trim())
    ) {
      setError("手机号格式不正确，应为 11 位。");
      return;
    }
    setError(null);
    onSubmit(form);
  };

  // 自动填出离店日期（入住后 +1 天），方便用户
  const onCheckInChange = (v: string) => {
    const next: Partial<HotelForm> = { checkInDate: v };
    if (v && (!form.checkOutDate || form.checkOutDate <= v)) {
      const d = new Date(v);
      d.setDate(d.getDate() + 1);
      next.checkOutDate = d.toISOString().slice(0, 10);
    }
    setForm({ ...form, ...next });
  };

  const today = new Date().toISOString().slice(0, 10);
  const minCheckOut = form.checkInDate || today;

  return (
    <motion.form
      id="hotel-inquiry-form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-full rounded-[24px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.03] backdrop-blur md:p-7"
    >
      {/* honeypot：机器人会填，正常用户看不到 */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] top-[-9999px] h-px w-px opacity-0"
      />

      <div className="mb-4 md:mb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fff3e8] px-2.5 py-1 text-[11px] font-medium text-[#b04a00]">
          <Sparkles className="h-3 w-3" />
          免费询价 · 不下单也可以
        </div>
        <h3 className="mt-2.5 text-[18px] font-semibold tracking-tight text-[#172033] md:mt-3 md:text-[22px]">
          酒店详细询价
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-[#667085] md:text-[13.5px]">
          填写详细信息，我们会为你对比多家平台找到最优酒店方案
        </p>
      </div>

      <div className="space-y-3.5 md:space-y-4">
        <Field
          label="目的地 / 城市"
          icon={<MapPin className="h-4 w-4" />}
          required
        >
          <input
            value={form.destination}
            onChange={(e) =>
              setForm({ ...form, destination: e.target.value })
            }
            placeholder="例如 三亚 / 上海 / 东京 / 香港 / 迪士尼"
            className={inputCls}
            maxLength={50}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="入住日期" icon={<Calendar className="h-4 w-4" />} required>
            <input
              type="date"
              value={form.checkInDate}
              min={today}
              onChange={(e) => onCheckInChange(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="离店日期" icon={<Calendar className="h-4 w-4" />} required>
            <input
              type="date"
              value={form.checkOutDate}
              min={minCheckOut}
              onChange={(e) =>
                setForm({ ...form, checkOutDate: e.target.value })
              }
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 md:gap-4">
          <Field label="房间数" icon={<Hotel className="h-4 w-4" />} required>
            <div className="grid grid-cols-2 gap-2">
              {ROOM_OPTIONS.map((p) => (
                <Chip
                  key={p}
                  active={form.roomCount === p}
                  onClick={() => setForm({ ...form, roomCount: p })}
                >
                  {p}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="入住人数" icon={<Users className="h-4 w-4" />} required>
            <div className="grid grid-cols-2 gap-2">
              {GUEST_OPTIONS.map((p) => (
                <Chip
                  key={p}
                  active={form.guestCount === p}
                  onClick={() => setForm({ ...form, guestCount: p })}
                >
                  {p}
                </Chip>
              ))}
            </div>
          </Field>
        </div>

        <Field label="每晚预算" icon={<Wallet className="h-4 w-4" />} required>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BUDGET_OPTIONS.map((b) => (
              <Chip
                key={b}
                active={form.budget === b}
                onClick={() => setForm({ ...form, budget: b })}
              >
                {b}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="酒店偏好（可多选）" icon={<Sparkles className="h-4 w-4" />}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PREFERENCE_OPTIONS.map((s) => (
              <Chip
                key={s}
                active={form.preferences.includes(s)}
                onClick={() => togglePref(s)}
              >
                {s}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="联系方式" icon={<Phone className="h-4 w-4" />} required>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex shrink-0 rounded-xl border border-[#e4e7ec] bg-white p-1 text-[13px]">
              <button
                type="button"
                onClick={() => setForm({ ...form, contactType: "WECHAT" })}
                className={`flex-1 rounded-lg px-3 py-1.5 font-medium transition sm:flex-none ${
                  form.contactType === "WECHAT"
                    ? "bg-[#0b4fd8] text-white shadow-sm"
                    : "text-[#475467] hover:bg-[#f5f8ff]"
                }`}
              >
                微信
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, contactType: "MOBILE" })}
                className={`flex-1 rounded-lg px-3 py-1.5 font-medium transition sm:flex-none ${
                  form.contactType === "MOBILE"
                    ? "bg-[#0b4fd8] text-white shadow-sm"
                    : "text-[#475467] hover:bg-[#f5f8ff]"
                }`}
              >
                手机号
              </button>
            </div>
            <input
              value={form.contactValue}
              onChange={(e) =>
                setForm({ ...form, contactValue: e.target.value })
              }
              placeholder={
                form.contactType === "WECHAT"
                  ? "填写微信号"
                  : "填写手机号"
              }
              inputMode={form.contactType === "MOBILE" ? "numeric" : "text"}
              className={`${inputCls} flex-1`}
              maxLength={50}
            />
          </div>
        </Field>

        <Field label="其他需求（选填）">
          <textarea
            value={form.remark}
            onChange={(e) => setForm({ ...form, remark: e.target.value })}
            placeholder="例如：想住海景房、需要接送机、带小孩..."
            rows={2}
            maxLength={500}
            className={`${inputCls} resize-none py-2.5`}
          />
        </Field>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-[#fef3f2] px-3 py-2 text-[13px] text-[#b42318]"
          >
            {error}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="group relative w-full overflow-hidden rounded-2xl bg-linear-to-r from-[#ff7a1a] to-[#ff913f] px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_30px_-10px_rgba(255,122,26,0.6)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="relative z-10">
            {submitting ? "正在跳转…" : "立即咨询优惠"}
          </span>
          <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </button>

        {/* AI 完整询价入口 */}
        <a
          href="/inquiry"
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#0b4fd8]/25 bg-[#f5f8ff] py-3 text-[13.5px] font-medium text-[#0b4fd8] transition active:scale-[0.98]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI 对比参考价格 · 更多偏好选项
        </a>

        <p className="text-center text-[12px] leading-relaxed text-[#98a2b3]">
          {privacyText}
        </p>
      </div>
    </motion.form>
  );
}

const inputCls =
  "w-full rounded-xl border border-[#e4e7ec] bg-white px-3.5 py-3 text-[14px] text-[#172033] outline-none transition placeholder:text-[#98a2b3] focus:border-[#0b4fd8] focus:ring-4 focus:ring-[#0b4fd8]/10";

function Field({
  label,
  icon,
  required,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-[#344054]">
        {icon && <span className="text-[#667085]">{icon}</span>}
        {label}
        {required && <span className="text-[#ff7a1a]">*</span>}
      </label>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition ${
        active
          ? "border-[#0b4fd8] bg-[#eaf1ff] text-[#0b4fd8]"
          : "border-[#e4e7ec] bg-white text-[#475467] hover:border-[#cdd5df] hover:bg-[#f5f8ff]"
      }`}
    >
      {children}
    </button>
  );
}

/* =========================================================================
   Hero
   ========================================================================= */

function Hero({
  form,
  setForm,
  onSubmit,
  onWechat,
  onInquire,
  onHotelInquiry,
  heroTitle,
  privacyText,
  submitting,
}: {
  form: IntentForm;
  setForm: (f: IntentForm) => void;
  onSubmit: (f: IntentForm) => void;
  onWechat: () => void;
  onInquire: () => void;
  onHotelInquiry: () => void;
  heroTitle: string;
  privacyText: string;
  submitting?: boolean;
}) {
  // 把后台可配置的 heroTitle 拆出"更划算"做高亮
  const highlight = "更划算";
  const idx = heroTitle.indexOf(highlight);
  const titleBefore = idx >= 0 ? heroTitle.slice(0, idx) : heroTitle;
  const titleAfter = idx >= 0 ? heroTitle.slice(idx + highlight.length) : "";
  const showHighlight = idx >= 0;

  return (
    <section className="relative overflow-hidden">
      {/* background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-[#eaf1ff] via-[#f5f8ff] to-[#f5f8ff]" />
        <div className="absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-[#0b4fd8]/10 blur-3xl" />
        <div className="absolute top-40 -left-24 h-[360px] w-[360px] rounded-full bg-[#ff7a1a]/10 blur-3xl" />
        <img
          src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=70"
          alt=""
          className="absolute right-0 top-0 hidden h-full w-1/2 object-cover opacity-[0.18] mask-fade-b lg:block"
        />
      </div>

      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 pb-12 pt-10 md:px-6 md:pb-20 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-24 lg:pt-20">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col justify-center"
        >
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#0b4fd8]/15 bg-white/80 px-3 py-1.5 text-[12px] font-medium text-[#0b4fd8] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[#12b76a]" />
            旅行低价询价平台
          </div>

          <h1 className="mt-5 text-[32px] font-bold leading-[1.18] tracking-tight text-[#0b1f4a] md:text-[46px] lg:text-[52px]">
            {showHighlight ? (
              <>
                {titleBefore}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-linear-to-r from-[#ff7a1a] to-[#ff5c00] bg-clip-text text-transparent">
                    {highlight}
                  </span>
                  <span className="absolute bottom-1 left-0 right-0 -z-0 h-3 bg-[#ffd9b8]/70 md:h-4" />
                </span>
                {titleAfter}
              </>
            ) : (
              heroTitle
            )}
          </h1>

          <p className="mt-5 max-w-[560px] text-[15px] leading-[1.75] text-[#475467] md:text-[16.5px]">
            所有平台都会对商家很重的抽水，我们直接和酒店集团对接，为您拿到平台抽水之前的价格。
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {LANDING_TRUST_BADGES.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e4e7ec] bg-white/80 px-3 py-1.5 text-[12.5px] text-[#344054] backdrop-blur"
              >
                <Check className="h-3.5 w-3.5 text-[#12b76a]" />
                {t}
              </span>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={onInquire}
              className="inline-flex items-center gap-2 rounded-full bg-[#ff7a1a] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_30px_-10px_rgba(255,122,26,0.6)] transition hover:bg-[#ff8a35] active:scale-[0.98]"
            >
              <Sparkles className="h-[18px] w-[18px]" />
              免费查低价方案
            </button>
            <button
              onClick={onWechat}
              className="inline-flex items-center gap-2 rounded-full border border-[#0b4fd8] bg-white px-6 py-3.5 text-[15px] font-semibold text-[#0b4fd8] transition hover:bg-[#eaf1ff]"
            >
              <MessageCircle className="h-[18px] w-[18px]" />
              加客服微信
            </button>
          </div>

          <p className="mt-3 text-[13px] text-[#98a2b3]">
            填写需求不收费，觉得合适再决定。
            <button
              type="button"
              onClick={onHotelInquiry}
              className="ml-1 font-medium text-[#0b4fd8] hover:underline"
            >
              想直接问酒店？点这里 →
            </button>
          </p>
        </motion.div>

        {/* Right form —— 轻量出行意向 */}
        <div className="lg:sticky lg:top-24">
          <IntentFormCard
            form={form}
            setForm={setForm}
            onSubmit={onSubmit}
            privacyText={privacyText}
            submitting={submitting}
          />
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   Section helpers
   ========================================================================= */

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={`mb-8 md:mb-10 ${
        align === "center" ? "mx-auto max-w-[640px] text-center" : ""
      }`}
    >
      {eyebrow && (
        <div
          className={`mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#eaf1ff] px-2.5 py-1 text-[11px] font-medium text-[#0b4fd8]`}
        >
          {eyebrow}
        </div>
      )}
      <h2 className="text-[24px] font-bold tracking-tight text-[#0b1f4a] md:text-[32px]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-[14px] leading-relaxed text-[#667085] md:text-[15.5px]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function FadeIn({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

/* =========================================================================
   Destinations
   ========================================================================= */

function DestinationsSection({
  onPick,
}: {
  onPick: (d: Destination) => void;
}) {
  return (
    <section id="destinations" className="border-t border-[#e9edf5] bg-white py-14 md:py-20">
      <div className="mx-auto max-w-[1240px] px-4 md:px-6">
        <SectionHeader
          eyebrow="热门目的地"
          title="最近大家都想去这些地方"
          subtitle="选一个你感兴趣的，把时间和人数告诉我们，客服帮你看一版合适方案。"
        />

        {/* Mobile: horizontal scroll. Desktop: grid */}
        <div className="-mx-4 overflow-x-auto px-4 no-scrollbar md:mx-0 md:overflow-visible md:px-0">
          <div className="flex gap-3 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-5">
            {DESTINATIONS.map((d, i) => (
              <FadeIn key={d.name} delay={i * 0.03}>
                <button
                  onClick={() => onPick(d)}
                  className="group relative block w-[240px] shrink-0 overflow-hidden rounded-2xl bg-[#0b1f4a] text-left shadow-[0_8px_24px_-14px_rgba(15,23,42,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-16px_rgba(15,23,42,0.45)] md:w-full"
                >
                  <div className="aspect-[3/4]">
                    <img
                      src={d.cover}
                      alt={d.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]"
                    />
                  </div>
                  <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-black/0" />
                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-medium text-[#0b4fd8] backdrop-blur">
                    {d.badge}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="text-[20px] font-semibold text-white">
                      {d.name}
                    </div>
                    <div className="mt-1 text-[12px] text-white/80">
                      {d.tags.slice(0, 2).join(" · ")}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[11.5px] text-white/85">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#12b76a]" />
                        {d.note}
                      </span>
                      <span className="rounded-full bg-[#ff7a1a] px-3 py-1 text-[11.5px] font-semibold text-white">
                        问问低价
                      </span>
                    </div>
                  </div>
                </button>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   Scenarios
   ========================================================================= */

function ScenariosSection({ onPick }: { onPick: (s: Scenario) => void }) {
  return (
    <section id="scenarios" className="bg-[#f5f8ff] py-14 md:py-20">
      <div className="mx-auto max-w-[1240px] px-4 md:px-6">
        <SectionHeader
          eyebrow="出行场景"
          title="你是哪种出行？先让客服帮你看看"
          subtitle="不同的旅行心情，匹配的方案也不一样。告诉我们你的出行类型，我们来搭配。"
        />

        <div className="grid gap-4 md:grid-cols-2 md:gap-5">
          {SCENARIOS.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.05}>
              <div className="group relative overflow-hidden rounded-3xl bg-white shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)] ring-1 ring-black/[0.03]">
                <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr]">
                  <div className="relative aspect-[3/4] overflow-hidden sm:aspect-auto">
                    <img
                      src={s.cover}
                      alt={s.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-linear-to-r from-transparent to-white/0" />
                  </div>
                  <div className="flex flex-col justify-between p-5">
                    <div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf1ff] px-2.5 py-1 text-[11px] font-medium text-[#0b4fd8]">
                        {s.icon}
                        {s.title}
                      </div>
                      <p className="mt-2.5 text-[14px] leading-relaxed text-[#475467]">
                        {s.desc}
                      </p>
                      <p className="mt-2 text-[12.5px] text-[#98a2b3]">
                        适合：{s.destinations}
                      </p>
                    </div>
                    <button
                      onClick={() => onPick(s)}
                      className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#ff7a1a] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#ff8a35]"
                    >
                      {s.cta}
                    </button>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   Hotel Brand Partners
   ========================================================================= */

function HotelBrandsSection() {
  // 复制一份用于无缝循环
  const doubled = [...HOTEL_BRANDS, ...HOTEL_BRANDS];

  return (
    <section className="border-t border-[#e9edf5] bg-white py-14 md:py-20 overflow-hidden">
      <div className="mx-auto max-w-[1240px] px-4 md:px-6">
        <SectionHeader
          eyebrow="合作伙伴"
          title="和我们合作的集团"
          subtitle="我们直接与国际顶级酒店集团对接，为您拿到平台抽水之前的真实价格。"
        />
      </div>

      {/* 滚动轨道 */}
      <div className="relative mt-8 md:mt-10">
        {/* 左右渐变遮罩 */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent" />

        <div className="flex items-center gap-6 hotel-marquee">
          {doubled.map((brand, i) => (
            <div
              key={`${brand.en}-${i}`}
              className="flex shrink-0 flex-col items-center justify-center gap-3 w-[120px]"
            >
              <div className="flex h-[88px] w-[88px] items-center justify-center rounded-2xl bg-white border border-[#e9edf5] shadow-[0_4px_14px_-6px_rgba(11,31,74,0.12)]">
                <img
                  src={brand.logo}
                  alt={brand.en}
                  className="h-12 w-12 object-contain"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                  }}
                />
              </div>
              <p className="text-[13px] font-medium tracking-tight text-[#0b1f4a] text-center whitespace-nowrap">
                {brand.zh}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .hotel-marquee {
          animation: hotel-scroll 40s linear infinite;
          width: max-content;
        }
        .hotel-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes hotel-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

/* =========================================================================
   Services
   ========================================================================= */

function ServicesSection({ onPick }: { onPick: (s: Service) => void }) {
  return (
    <section id="services" className="border-t border-[#e9edf5] bg-white py-14 md:py-20">
      <div className="mx-auto max-w-[1240px] px-4 md:px-6">
        <SectionHeader
          eyebrow="服务范围"
          title="酒店核价为主，其他也可以一起问"
          subtitle="第一阶段主做酒店代订，如果还想顺带机票 / 接送机 / 门票，可以在备注里提，客服一起看。"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.04}>
              <div className="group relative h-full rounded-[22px] border border-[#e9edf5] bg-white p-6 transition hover:-translate-y-0.5 hover:border-[#cfdcf5] hover:shadow-[0_18px_40px_-20px_rgba(11,79,216,0.25)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf1ff] text-[#0b4fd8]">
                  {s.icon}
                </div>
                <h3 className="mt-4 text-[17px] font-semibold text-[#0b1f4a]">
                  {s.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[#667085]">
                  {s.desc}
                </p>
                <button
                  onClick={() => onPick(s)}
                  className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0b4fd8] transition hover:gap-1.5"
                >
                  {s.cta}
                  <span className="transition group-hover:translate-x-0.5">→</span>
                </button>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   Why Choose
   ========================================================================= */

function WhyChooseSection() {
  return (
    <section className="bg-[#f5f8ff] py-14 md:py-20">
      <div className="mx-auto max-w-[1240px] px-4 md:px-6">
        <SectionHeader
          eyebrow="为什么选我们"
          title="为什么先来旅途问一问？"
          subtitle="你可以先看方案和报价，觉得合适再决定，不用自己反复查。"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {WHY_CHOOSE.map((w, i) => (
            <FadeIn key={w.title} delay={i * 0.04}>
              <div className="h-full rounded-2xl bg-white p-5 ring-1 ring-black/[0.04]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-[#eaf1ff] to-[#fff3e8] text-[#0b4fd8]">
                  {w.icon}
                </div>
                <div className="mt-3 text-[15px] font-semibold text-[#0b1f4a]">
                  {w.title}
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#667085]">
                  {w.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   Steps
   ========================================================================= */

function StepsSection({ onCta }: { onCta: () => void }) {  return (
    <section className="border-t border-[#e9edf5] bg-white py-14 md:py-20">
      <div className="mx-auto max-w-[1240px] px-4 md:px-6">
        <SectionHeader
          eyebrow="操作流程"
          title="3 步获取你的旅行低价方案"
          align="center"
        />

        <div className="relative grid gap-4 md:grid-cols-3 md:gap-6">
          <div className="absolute left-0 right-0 top-12 hidden h-px bg-linear-to-r from-transparent via-[#cfdcf5] to-transparent md:block" />
          {STEPS.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.06}>
              <div className="relative rounded-3xl border border-[#e9edf5] bg-white p-6 text-center md:text-left">
                <div className="step-num inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-[#0b4fd8] to-[#1e6cff] text-[20px] font-bold text-white shadow-[0_10px_24px_-10px_rgba(11,79,216,0.55)]">
                  0{i + 1}
                </div>
                <h3 className="mt-4 text-[18px] font-semibold text-[#0b1f4a]">
                  {s.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#667085]">
                  {s.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={onCta}
            className="inline-flex items-center gap-2 rounded-full bg-[#ff7a1a] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_30px_-10px_rgba(255,122,26,0.6)] transition hover:bg-[#ff8a35]"
          >
            现在填写需求
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   HotelInquirySection —— 详细酒店询价板块
   ========================================================================= */

function HotelInquirySection({
  form,
  setForm,
  onSubmit,
  privacyText,
  submitting,
}: {
  form: HotelForm;
  setForm: (next: HotelForm) => void;
  onSubmit: (form: HotelForm) => void;
  privacyText: string;
  submitting?: boolean;
}) {
  return (
    <section
      id="hotel-inquiry"
      className="relative overflow-hidden bg-white py-14 md:py-20"
    >
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 500px at 85% -10%,rgba(255,122,26,0.08),transparent 55%),radial-gradient(700px 400px at -5% 20%,rgba(11,79,216,0.08),transparent 60%)",
        }}
      />
      <div className="mx-auto max-w-[1240px] px-4 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#ff7a1a]/25 bg-[#fff3e8] px-2.5 py-1 text-[11px] font-medium text-[#b04a00]">
              <Hotel className="h-3 w-3" />
              酒店询价 · 详细版
            </div>
            <h2 className="mt-3 text-[26px] font-bold leading-tight text-[#0b1f4a] md:text-[36px]">
              想订酒店？填这张更
              <span className="relative inline-block">
                <span className="relative z-10 bg-linear-to-r from-[#ff7a1a] to-[#ff5c00] bg-clip-text text-transparent">
                  具体的询价单
                </span>
                <span className="absolute bottom-1 left-0 right-0 -z-0 h-3 bg-[#ffd9b8]/70 md:h-4" />
              </span>
            </h2>
            <p className="mt-3 max-w-[480px] text-[15px] leading-[1.75] text-[#475467]">
              入住日期、房间数、预算、偏好一起告诉我们，客服会直接发酒店方案过来，不用再来回问。
            </p>

            <div className="mt-6 space-y-3">
              {[
                {
                  icon: <Hotel className="h-4 w-4" />,
                  title: "酒店核价",
                  desc: "同一家酒店，不同渠道/日期价格可能不同，客服帮你看一版更合适的。",
                },
                {
                  icon: <Compass className="h-4 w-4" />,
                  title: "房型对比",
                  desc: "大床 / 双床 / 家庭房 / 海景房，含早餐和取消规则一并说清楚。",
                },
                {
                  icon: <Users className="h-4 w-4" />,
                  title: "多间房 · 多晚",
                  desc: "毕业旅行、亲子家庭、公司团建都可以，多间多晚一起看。",
                },
              ].map((b) => (
                <div
                  key={b.title}
                  className="flex gap-3 rounded-2xl border border-[#e9edf5] bg-white p-4 ring-1 ring-black/[0.02]"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eaf1ff] text-[#0b4fd8]">
                    {b.icon}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[#0b1f4a]">
                      {b.title}
                    </div>
                    <div className="mt-0.5 text-[13px] leading-relaxed text-[#667085]">
                      {b.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <HotelFormCard
              form={form}
              setForm={setForm}
              onSubmit={onSubmit}
              privacyText={privacyText}
              submitting={submitting}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   Wechat strong-CTA section
   ========================================================================= */

function WechatSection({
  onWechat,
  onCopy,
  wechatId,
  qrUrl,
}: {
  onWechat: () => void;
  onCopy: () => void;
  wechatId: string;
  qrUrl: string;
}) {
  return (
    <section id="wechat" className="relative overflow-hidden py-14 md:py-20">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg,#eaf1ff 0%,#f5f8ff 55%,#fff3e8 100%)",
        }}
      />
      {/* deco grid */}
      <svg
        className="absolute inset-0 -z-10 h-full w-full opacity-[0.25]"
        viewBox="0 0 1440 600"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#0b4fd8"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <path
          d="M 0 480 Q 360 320 720 380 T 1440 280"
          stroke="rgba(11,79,216,0.35)"
          strokeWidth="1.5"
          strokeDasharray="6 6"
          fill="none"
        />
      </svg>
      <div className="absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-[#ff7a1a]/25 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 -z-10 h-80 w-80 rounded-full bg-[#0b4fd8]/15 blur-3xl" />

      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div>
          <div
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium"
            style={{
              background: "#fff",
              borderColor: "rgba(11,79,216,0.18)",
              color: "#0b4fd8",
            }}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            真人客服
          </div>
          <h2 className="mt-4 text-[28px] font-bold leading-tight text-[#0b1f4a] md:text-[40px]">
            想快一点？直接加客服微信
          </h2>
          <p className="mt-3 max-w-[520px] text-[14.5px] leading-relaxed text-[#475467] md:text-[16px]">
            备注「酒店 + 目的地 + 日期」，客服可以更快帮你查。
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              "酒店核价",
              "房型对比",
              "多间房比价",
              "含早 / 取消政策",
              "接送机",
              "当地玩乐",
            ].map((x) => (
              <div
                key={x}
                className="inline-flex items-center gap-2 rounded-xl border border-[#e4e7ec] bg-white/90 px-3 py-2 text-[13px] font-medium text-[#344054] shadow-[0_2px_6px_-3px_rgba(11,79,216,0.12)] backdrop-blur"
              >
                <Check className="h-3.5 w-3.5 text-[#12b76a]" />
                {x}
              </div>
            ))}
          </div>
        </div>

        <FadeIn>
          <div className="rounded-[28px] border border-white bg-white p-6 shadow-[0_30px_60px_-24px_rgba(11,79,216,0.28)] ring-1 ring-[#e9edf5]">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf1ff] text-[#0b4fd8]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[12px] text-[#667085]">客服微信</div>
                <div className="text-[16px] font-semibold tracking-wide text-[#0b1f4a]">
                  {wechatId || "客服微信待配置"}
                </div>
              </div>
            </div>

            <div className="mt-5 grid place-items-center rounded-2xl border border-[#e9edf5] bg-[#f5f8ff] p-4">
              {qrUrl ? (
                <Image
                  src={qrUrl}
                  alt="客服微信二维码"
                  width={180}
                  height={180}
                  className="rounded-xl bg-white object-contain shadow-inner ring-1 ring-[#e4e7ec]"
                  unoptimized
                />
              ) : (
                <div className="grid h-[180px] w-[180px] place-items-center rounded-xl bg-white px-5 text-center text-[12px] leading-5 text-[#667085] ring-1 ring-[#e4e7ec]">提交旅行需求后，顾问会在站内跟进</div>
              )}
              <div className="mt-3 text-[12px] text-[#667085]">{qrUrl ? "微信扫一扫，添加客服" : "客服联系方式待配置"}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                onClick={onCopy}
                disabled={!wechatId}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#e4e7ec] bg-white py-3 text-[13.5px] font-semibold text-[#0b4fd8] transition hover:bg-[#eaf1ff]"
              >
                <Copy className="h-4 w-4" />
                复制微信号
              </button>
              <button
                onClick={onWechat}
                disabled={!qrUrl}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#ff7a1a] py-3 text-[13.5px] font-semibold text-white transition hover:bg-[#ff8a35]"
              >
                <Sparkles className="h-4 w-4" />
                {qrUrl ? "扫码添加客服" : "先提交旅行需求"}
              </button>
            </div>

            <p className="mt-3 text-center text-[11.5px] text-[#98a2b3]">
              添加后请备注你的目的地、入住日期和人数。
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* =========================================================================
   Question Templates
   ========================================================================= */

function TemplatesSection({ onPick }: { onPick: (t: string) => void }) {
  return (
    <section className="bg-[#f5f8ff] py-14 md:py-20">
      <div className="mx-auto max-w-[1240px] px-4 md:px-6">
        <SectionHeader
          eyebrow="问价模板"
          title="不知道怎么问？可以直接这样说"
          subtitle="选一个最像你的情况，客服收到后可以更快帮你查报价。"
        />

        <div className="grid gap-3 md:grid-cols-2">
          {TEMPLATES.map((t, i) => (
            <FadeIn key={t} delay={i * 0.03}>
              <div className="flex items-start gap-3 rounded-3xl bg-white p-4 ring-1 ring-black/[0.04] md:p-5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eaf1ff] text-[#0b4fd8]">
                  <MessageCircle className="h-[18px] w-[18px]" />
                </div>
                <div className="flex-1">
                  <div className="rounded-2xl rounded-tl-sm bg-[#f5f8ff] p-3 text-[14px] leading-relaxed text-[#172033]">
                    {t}
                  </div>
                  <div className="mt-2.5 flex justify-end">
                    <button
                      onClick={() => onPick(t)}
                      className="rounded-full border border-[#0b4fd8]/25 bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#0b4fd8] transition hover:bg-[#eaf1ff]"
                    >
                      用这个模板问价
                    </button>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   FAQ
   ========================================================================= */

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-t border-[#e9edf5] bg-white py-14 md:py-20">
      <div className="mx-auto max-w-[860px] px-4 md:px-6">
        <SectionHeader eyebrow="常见问题" title="常见问题" align="center" />

        <div className="space-y-2.5">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={`overflow-hidden rounded-2xl border transition ${
                  isOpen
                    ? "border-[#cfdcf5] bg-[#f5f8ff]"
                    : "border-[#e9edf5] bg-white"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-[14.5px] font-semibold text-[#0b1f4a] md:text-[15.5px]">
                    {f.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#475467] transition ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                    >
                      <div className="px-5 pb-4 text-[13.5px] leading-relaxed text-[#475467] md:text-[14.5px]">
                        {f.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   Footer
   ========================================================================= */

function Footer({ wechatId }: { wechatId: string }) {
  return (
    <footer className="bg-[#0b1f4a] pb-24 pt-14 text-white/80 md:pb-14">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 md:grid-cols-[1.2fr_2fr] md:px-6">
        <div>
          <Logo size={40} mode="dark" />
          <p className="mt-4 max-w-[320px] text-[14px] leading-relaxed text-white/70">
            订酒店前，先帮你查一版低价方案。
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          <FooterCol
            title="目的地"
            items={["日本", "泰国", "三亚", "迪士尼", "云南"]}
          />
          <FooterCol
            title="服务类型"
            items={["酒店低价", "机票低价", "跟团自由行", "定制旅行", "门票签证"]}
          />
          <FooterCol
            title="联系我们"
            items={[wechatId ? `客服微信 ${wechatId}` : "客服微信待配置", "提交需求后由顾问联系"]}
          />
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-[1240px] border-t border-white/10 px-4 pt-6 text-[12px] leading-relaxed text-white/50 md:px-6">
        价格和库存会随时间变化，最终报价以客服实时核价为准。
        <span className="mx-2 text-white/20">|</span>
        © {new Date().getFullYear()} 旅途
        <span className="mx-2 text-white/20">|</span>
        <Link href="/admin/hotel" className="transition hover:text-white/80">后台管理</Link>
        {ICP_NUMBER ? (
          <>
            <span className="mx-2 text-white/20">|</span>
            <a
              href={ICP_LINK}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-white/80"
            >
              {ICP_NUMBER}
            </a>
          </>
        ) : null}
        {PSB_NUMBER && PSB_LINK ? (
          <>
            <span className="mx-2 text-white/20">|</span>
            <a
              href={PSB_LINK}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-white/80"
            >
              {PSB_NUMBER}
            </a>
          </>
        ) : null}
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-[13px] font-semibold text-white">{title}</div>
      <ul className="mt-3 space-y-2 text-[13px] text-white/65">
        {items.map((i) => (
          <li key={i} className="transition hover:text-white">
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* =========================================================================
   Floating CTA (mobile)
   ========================================================================= */

function FloatingCTA({
  onWechat,
  onInquire,
}: {
  onWechat: () => void;
  onInquire: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e9edf5] bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-[480px] gap-2 px-4 py-2.5">
        <button
          onClick={onWechat}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-[#0b4fd8]/30 bg-white py-3 text-[14px] font-semibold text-[#0b4fd8] active:scale-[0.98]"
        >
          <MessageCircle className="h-4 w-4" />
          加客服微信
        </button>
        <button
          onClick={onInquire}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#ff7a1a] py-3 text-[14px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(255,122,26,0.55)] active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4" />
          免费查酒店低价
        </button>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}

/* =========================================================================
   Modals & Toast
   ========================================================================= */

function WechatModal({
  open,
  onClose,
  onCopy,
  wechatId,
  qrUrl,
}: {
  open: boolean;
  onClose: () => void;
  onCopy: () => void;
  wechatId: string;
  qrUrl: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[380px] rounded-[24px] bg-white p-6 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-[#98a2b3] hover:bg-[#f1f5fb]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center">
              <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-[#eaf1ff] px-2.5 py-1 text-[11px] font-medium text-[#0b4fd8]">
                <MessageCircle className="h-3 w-3" />
                添加客服微信
              </div>
              <h3 className="mt-3 text-[18px] font-bold text-[#0b1f4a]">
                扫码或复制微信号
              </h3>
              <p className="mt-1 text-[13px] text-[#667085]">
                添加后请备注：酒店 + 目的地 + 日期
              </p>
            </div>

            <div className="mt-5 grid place-items-center rounded-2xl bg-[#f5f8ff] p-5">
              {qrUrl ? (
                <Image
                  src={qrUrl}
                  alt="客服微信二维码"
                  width={220}
                  height={220}
                  className="rounded-xl bg-white object-contain shadow-inner ring-1 ring-[#e4e7ec]"
                  unoptimized
                />
              ) : (
                <div className="grid h-[180px] w-[180px] place-items-center rounded-xl bg-white px-5 text-center text-[12px] leading-5 text-[#667085] ring-1 ring-[#e4e7ec]">提交旅行需求后，顾问会在站内跟进</div>
              )}
              {wechatId ? <div className="mt-3 rounded-lg bg-white px-3 py-1.5 text-[13px] font-semibold tracking-wider text-[#0b1f4a] ring-1 ring-[#e4e7ec]">{wechatId}</div> : null}
            </div>

            <button
              onClick={onCopy}
              disabled={!wechatId}
              className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#0b4fd8] py-3 text-[14px] font-semibold text-white transition hover:bg-[#1056eb]"
            >
              <Copy className="h-4 w-4" />
              {wechatId ? "复制微信号" : "联系方式待配置"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.22 }}
          className="fixed left-1/2 top-6 z-[60] -translate-x-1/2 rounded-full bg-[#0b1f4a] px-4 py-2.5 text-[13px] font-medium text-white shadow-2xl"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================================
   Page
   ========================================================================= */

export default function LandingPage() {
  const [intent, setIntent] = useState<IntentForm>(EMPTY_INTENT);
  const [hotel, setHotel] = useState<HotelForm>(EMPTY_HOTEL);
  const [wechatOpen, setWechatOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(FALLBACK_SITE_CONFIG);
  const trackingRef = useRef<{
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
    landingPage?: string;
  }>({});
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/settings/public", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data) setSiteConfig({ ...FALLBACK_SITE_CONFIG, ...data });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    trackingRef.current = {
      utmSource: url.searchParams.get("utm_source") || undefined,
      utmMedium: url.searchParams.get("utm_medium") || undefined,
      utmCampaign: url.searchParams.get("utm_campaign") || undefined,
      referrer: document.referrer ? document.referrer.slice(0, 500) : undefined,
      landingPage: window.location.pathname.slice(0, 500),
    };
  }, []);

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const scrollToId = useCallback((id: string, offset = 80) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, []);

  const scrollToForm = useCallback(() => scrollToId("lead-form"), [scrollToId]);
  const scrollToHotelInquiry = useCallback(
    () => scrollToId("hotel-inquiry"),
    [scrollToId]
  );

  const openWechat = useCallback(() => setWechatOpen(true), []);

  const copyWechat = useCallback(() => {
    const text = siteConfig.wechatId;
    if (!text) {
      showToast("客服微信尚未配置，请先提交旅行需求");
      return;
    }
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard?.writeText
    ) {
      navigator.clipboard.writeText(text).catch(() => {});
    } else if (typeof document !== "undefined") {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {}
      document.body.removeChild(ta);
    }
    showToast("微信号已复制");
  }, [showToast, siteConfig.wechatId]);

  // 点击目的地卡：优先回填到「最上面的表单」—— 首屏意向；同时也填一份到酒店表单以便切换过去
  const handlePickDestination = (d: Destination) => {
    setIntent((prev) => ({ ...prev, destination: d.name }));
    setHotel((prev) => ({ ...prev, destination: d.name }));
    showToast(`已选择「${d.name}」，继续填写时间和人数`);
    scrollToForm();
  };

  const handlePickScenario = (s: Scenario) => {
    setIntent((prev) => ({
      ...prev,
      remark: s.hint + (prev.remark ? `\n${prev.remark}` : ""),
    }));
    setHotel((prev) => ({
      ...prev,
      remark: s.hint + (prev.remark ? `\n${prev.remark}` : ""),
    }));
    showToast(`已为你选择「${s.title}」`);
    scrollToForm();
  };

  const handlePickService = (s: Service) => {
    setHotel((prev) => ({
      ...prev,
      remark: prev.remark ? `${s.title}：${prev.remark}` : `想了解${s.title}`,
    }));
    showToast(`已选择「${s.title}」，已滚动到酒店询价板块`);
    scrollToHotelInquiry();
  };

  const handlePickTemplate = (t: string) => {
    // 模板是酒店向，放进详细表单的备注
    setHotel((prev) => ({
      ...prev,
      remark: prev.remark ? `${t}\n${prev.remark}` : t,
    }));
    showToast("模板已填入酒店询价单备注");
    scrollToHotelInquiry();
  };

  const WECHAT_KF_URL = "https://work.weixin.qq.com/kfid/kfc7e290edd33f220d2";

  const copyToClipboard = (text: string) => {
    // 用同步的 execCommand 确保在移动端手势上下文内复制成功
    if (typeof document !== "undefined") {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.opacity = "0";
      ta.style.pointerEvents = "none";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    // 同时尝试现代 API（桌面端）
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  // 轻量意向提交
  const submitIntent = async (f: IntentForm) => {
    if (submitting) return;
    setSubmitting(true);

    const summary = [
      `【出行意向咨询】`,
      `目的地：${f.destination.trim()}`,
      `出发时间：${f.timeframe}`,
      `出行人数：${f.guestCount}`,
      f.remark.trim() ? `备注：${f.remark.trim()}` : null,
      `联系方式（${f.contactType === "WECHAT" ? "微信" : "手机"}）：${f.contactValue.trim()}`,
    ].filter(Boolean).join("\n");

    const payload = {
      inquiryType: "INTENT" as const,
      destination: f.destination.trim(),
      timeframe: f.timeframe,
      guestCount: f.guestCount,
      contactType: f.contactType,
      contactValue: f.contactValue.trim(),
      remark: f.remark.trim(),
      source: "官网首页 · 意向",
      ...trackingRef.current,
    };
    try {
      // 先复制（需在用户手势上下文内），再异步提交，再跳转
      copyToClipboard(summary);
      fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
      window.location.href = WECHAT_KF_URL;
    } catch {
      showToast("跳转失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const submitHotel = async (f: HotelForm) => {
    if (submitting) return;
    setSubmitting(true);

    const summary = [
      `【酒店询价咨询】`,
      `目的地：${f.destination.trim()}`,
      f.checkInDate ? `入住日期：${f.checkInDate}` : null,
      f.checkOutDate ? `离店日期：${f.checkOutDate}` : null,
      f.roomCount ? `房间数：${f.roomCount}` : null,
      f.guestCount ? `入住人数：${f.guestCount}` : null,
      f.budget ? `预算：${f.budget}` : null,
      f.preferences.length ? `偏好：${f.preferences.join("、")}` : null,
      f.remark.trim() ? `备注：${f.remark.trim()}` : null,
      `联系方式（${f.contactType === "WECHAT" ? "微信" : "手机"}）：${f.contactValue.trim()}`,
    ].filter(Boolean).join("\n");

    const payload = {
      inquiryType: "HOTEL" as const,
      destination: f.destination.trim(),
      checkInDate: f.checkInDate,
      checkOutDate: f.checkOutDate,
      roomCount: f.roomCount,
      guestCount: f.guestCount,
      budget: f.budget,
      preferences: f.preferences,
      contactType: f.contactType,
      contactValue: f.contactValue.trim(),
      remark: f.remark.trim(),
      source: "官网首页 · 酒店询价",
      ...trackingRef.current,
    };
    try {
      copyToClipboard(summary);
      fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
      window.location.href = WECHAT_KF_URL;
    } catch {
      showToast("跳转失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8ff]">
      <Navbar onWechat={openWechat} onInquire={scrollToForm} />

      <main ref={mainRef}>
        <Hero
          form={intent}
          setForm={setIntent}
          onSubmit={submitIntent}
          onWechat={openWechat}
          onInquire={scrollToForm}
          onHotelInquiry={scrollToHotelInquiry}
          heroTitle={siteConfig.heroTitle}
          privacyText={siteConfig.privacyText}
          submitting={submitting}
        />
        <DestinationsSection onPick={handlePickDestination} />
        <ScenariosSection onPick={handlePickScenario} />
        <HotelBrandsSection />
        <ServicesSection onPick={handlePickService} />
        <WhyChooseSection />
        <HotelInquirySection
          form={hotel}
          setForm={setHotel}
          onSubmit={submitHotel}
          privacyText={siteConfig.privacyText}
          submitting={submitting}
        />
        <StepsSection onCta={scrollToForm} />
        <WechatSection
          onWechat={openWechat}
          onCopy={copyWechat}
          wechatId={siteConfig.wechatId}
          qrUrl={siteConfig.qrUrl}
        />
        <TemplatesSection onPick={handlePickTemplate} />
        <FAQSection />
      </main>

      <Footer wechatId={siteConfig.wechatId} />

      <FloatingCTA onWechat={openWechat} onInquire={scrollToForm} />

      <WechatModal
        open={wechatOpen}
        onClose={() => setWechatOpen(false)}
        onCopy={copyWechat}
        wechatId={siteConfig.wechatId}
        qrUrl={siteConfig.qrUrl}
      />
      <Toast message={toast} />
    </div>
  );
}
