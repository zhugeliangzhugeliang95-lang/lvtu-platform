export type PriceType = "参考价" | "起价" | "最近成交参考" | "待人工确认";

export type TourGroup = {
  id: string;
  title: string;
  route: string;
  departure: string;
  days: string;
  nextDate: string;
  price: string;
  priceType: PriceType;
  type: string;
  audience: string;
  visa: string;
  image: string;
  highlights: string[];
};

export type TestedRoute = {
  id: string;
  title: string;
  destination: string;
  days: string;
  audience: string;
  budget: string;
  testedAt: string;
  updatedAt: string;
  image: string;
  keyExperience: string;
};

export const serviceCatalog = [
  { key: "hotel", label: "酒店", description: "房型与取消规则" },
  { key: "flight", label: "机票", description: "直飞、行李与时间" },
  { key: "train", label: "火车票", description: "车次与替代方案" },
  { key: "ticket", label: "门票玩乐", description: "乐园、景区与演出" },
  { key: "buffet", label: "自助餐", description: "酒店餐厅与套餐" },
  { key: "lounge", label: "贵宾厅", description: "机场与高铁站" },
  { key: "transfer", label: "接送机", description: "机场、车站接送" },
  { key: "charter", label: "包车", description: "市内、跨城与多日" },
] as const;

export const tourGroups: TourGroup[] = [
  {
    id: "yunnan-small-group",
    title: "大理丽江雪山6日小团",
    route: "大理 · 沙溪 · 丽江 · 玉龙雪山",
    departure: "广州出发",
    days: "6天5晚",
    nextDate: "8月18日起可询",
    price: "¥3,280起",
    priceType: "参考价",
    type: "8人小团",
    audience: "情侣 / 朋友",
    visa: "无需签证",
    image: "/Chongqing.jpg",
    highlights: ["不赶早购物店", "沙溪古镇住一晚", "雪山索道待确认"],
  },
  {
    id: "singapore-family",
    title: "新加坡亲子半自由行5日",
    route: "滨海湾 · 圣淘沙 · 动物园",
    departure: "深圳出发",
    days: "5天4晚",
    nextDate: "9月团期待确认",
    price: "¥5,980起",
    priceType: "参考价",
    type: "半自由行",
    audience: "亲子家庭",
    visa: "需护照",
    image: "/castle.avif",
    highlights: ["一天自由活动", "亲子友好酒店", "含部分景点交通"],
  },
  {
    id: "guizhou-summer",
    title: "贵州黄果树荔波西江5日",
    route: "贵阳 · 黄果树 · 荔波 · 西江",
    departure: "东莞集合",
    days: "5天4晚",
    nextDate: "每周三、六可询",
    price: "暂无确认报价",
    priceType: "待人工确认",
    type: "精选跟团",
    audience: "家庭 / 父母",
    visa: "无需签证",
    image: "/hotelout.jpg",
    highlights: ["景区间交通统一安排", "行程强度适中", "供应状态待确认"],
  },
];

export const testedRoutes: TestedRoute[] = [
  {
    id: "chongqing-3d",
    title: "重庆3天2晚：山城步行与夜景",
    destination: "重庆",
    days: "3天2晚",
    audience: "首次去、朋友同行",
    budget: "实测总预算 ¥1,360/人",
    testedAt: "2026年5月",
    updatedAt: "2026年7月",
    image: "/Chongqing.jpg",
    keyExperience: "不走回头路的渝中步行线，洪崖洞不在最拥挤时段硬挤。",
  },
  {
    id: "sanya-4d",
    title: "三亚4天3晚：一半海边一半度假",
    destination: "三亚",
    days: "4天3晚",
    audience: "情侣、不想赶行程",
    budget: "实测总预算 ¥2,480/人",
    testedAt: "2026年3月",
    updatedAt: "2026年6月",
    image: "/swimmingpool.jpg",
    keyExperience: "前两晚住市区控制预算，最后一晚换海棠湾度假酒店。",
  },
  {
    id: "hongkong-2d",
    title: "香港2天1晚：港岛慢走与九龙夜景",
    destination: "香港",
    days: "2天1晚",
    audience: "大湾区周末游",
    budget: "实测总预算 ¥1,180/人",
    testedAt: "2026年4月",
    updatedAt: "2026年7月",
    image: "/highspeedtrain.jpg",
    keyExperience: "高铁到西九龙后先放行李，下午将动线集中在港岛。",
  },
];

export const progressDemo = {
  title: "三亚4天3晚组合询价",
  number: "DEMO-IQ-20260807",
  status: "询价中",
  updatedAt: "今日 18:40 更新",
  nextAction: "等待顾问回填酒店与接送机报价",
  events: ["需求已提交", "AI已整理", "客服已查看", "供应商询价中"],
};
