export type PriceState = "REFERENCE" | "ESTIMATED" | "PENDING_CONFIRMATION" | "CONFIRMED";

export const priceLabels: Record<PriceState, string> = {
  REFERENCE: "参考价",
  ESTIMATED: "预估价",
  PENDING_CONFIRMATION: "待确认",
  CONFIRMED: "已确认",
};

export type Tour = {
  slug: string;
  name: string;
  destination: string;
  departure: string;
  days: number;
  type: string;
  tags: string[];
  audience: string;
  image: string;
  price: number;
  priceState: PriceState;
  summary: string;
  departures: { date: string; price: number; status: string }[];
  itinerary: { day: string; title: string; city: string; detail: string }[];
}

export const tours: Tour[] = [
  { slug: "sanya-island-5d", name: "三亚海岛 5 天游 · 轻松度假小团", destination: "三亚", departure: "广州", days: 5, type: "精品小团", tags: ["海岛度假", "亲子友好"], audience: "情侣、亲子、朋友出行", image: "/travel-home/sanya-coast.jpg", price: 3299, priceState: "REFERENCE", summary: "把时间留给海风与阳光，含接送机与精选海景酒店。", departures: [{ date: "2026-10-02", price: 3299, status: "可报名" }, { date: "2026-10-16", price: 3599, status: "即将成团" }, { date: "2026-11-06", price: 2999, status: "待确认" }], itinerary: [{ day: "Day 1", title: "抵达三亚，入住海棠湾", city: "三亚", detail: "接机后入住酒店，傍晚自由享受海边日落。" }, { day: "Day 2", title: "蜈支洲岛一日", city: "海棠湾", detail: "含往返船票，可选潜水等水上项目。" }, { day: "Day 3", title: "亚龙湾慢游", city: "亚龙湾", detail: "森林公园与沙滩散步，节奏轻松。" }, { day: "Day 4", title: "自由安排", city: "三亚湾", detail: "顾问提供当地玩乐清单，可按兴趣选择。" }, { day: "Day 5", title: "送机返程", city: "三亚", detail: "根据航班时间安排送机。" }] },
  { slug: "xinjiang-north-8d", name: "新疆北疆 8 日精品小团", destination: "新疆", departure: "乌鲁木齐", days: 8, type: "精品小团", tags: ["自然风光", "摄影"], audience: "朋友结伴、摄影爱好者", image: "/travel-home/mountains.jpg", price: 6999, priceState: "REFERENCE", summary: "喀纳斯、禾木与独库公路，一次看遍北疆高光风景。", departures: [{ date: "2026-09-20", price: 6999, status: "名额紧张" }, { date: "2026-09-27", price: 7299, status: "可报名" }, { date: "2026-10-15", price: 6599, status: "待确认" }], itinerary: [{ day: "Day 1", title: "乌鲁木齐集合", city: "乌鲁木齐", detail: "专人接站，入住市区酒店。" }, { day: "Day 2", title: "可可托海", city: "富蕴", detail: "沿额尔齐斯河欣赏峡谷风光。" }, { day: "Day 3", title: "喀纳斯湖", city: "喀纳斯", detail: "入住景区周边，留足观景时间。" }, { day: "Day 4", title: "禾木村", city: "禾木", detail: "木屋、晨雾与牧民生活。" }, { day: "Day 5", title: "魔鬼城", city: "克拉玛依", detail: "雅丹地貌日落。" }, { day: "Day 6", title: "赛里木湖", city: "博乐", detail: "环湖公路与湖畔草原。" }, { day: "Day 7", title: "独库公路", city: "那拉提", detail: "根据路况安排沿线体验。" }, { day: "Day 8", title: "返程", city: "乌鲁木齐", detail: "送站结束行程。" }] },
  { slug: "tokyo-hakone-6d", name: "东京 + 箱根 6 日慢旅行", destination: "日本", departure: "深圳", days: 6, type: "半自由行", tags: ["温泉", "城市漫游"], audience: "情侣、首次日本旅行", image: "/travel-home/tokyo.jpg", price: 7999, priceState: "PENDING_CONFIRMATION", summary: "城市与温泉平衡安排，适合第一次去日本的旅行者。", departures: [{ date: "2026-10-01", price: 7999, status: "待确认" }, { date: "2026-11-12", price: 7399, status: "可报名" }], itinerary: [{ day: "Day 1", title: "抵达东京", city: "东京", detail: "机场接驳建议与酒店入住。" }, { day: "Day 2", title: "浅草与上野", city: "东京", detail: "寺庙、街区与美食。" }, { day: "Day 3", title: "涩谷漫游", city: "东京", detail: "留白半天自由探索。" }, { day: "Day 4", title: "前往箱根", city: "箱根", detail: "浪漫特快 + 温泉旅馆。" }, { day: "Day 5", title: "富士山景观日", city: "箱根", detail: "根据天气灵活调整。" }, { day: "Day 6", title: "返程", city: "东京", detail: "送往机场。" }] },
  { slug: "chengdu-food-4d", name: "成都美食与熊猫 4 日游", destination: "成都", departure: "广州", days: 4, type: "当地参团", tags: ["美食", "城市漫游"], audience: "朋友、学生旅行", image: "/travel-home/kyoto.jpg", price: 2199, priceState: "ESTIMATED", summary: "熊猫基地、城市老街与地道川味，轻松不赶路。", departures: [{ date: "2026-10-03", price: 2199, status: "可报名" }, { date: "2026-10-24", price: 1999, status: "可报名" }], itinerary: [{ day: "Day 1", title: "春熙路集合", city: "成都", detail: "顾问推荐晚餐路线。" }, { day: "Day 2", title: "熊猫基地", city: "成都", detail: "早起避开人流。" }, { day: "Day 3", title: "宽窄巷子与茶馆", city: "成都", detail: "老城慢游。" }, { day: "Day 4", title: "自由活动返程", city: "成都", detail: "按航班安排送站。" }] },
  { slug: "bali-relax-6d", name: "巴厘岛 6 日松弛度假小团", destination: "巴厘岛", departure: "广州", days: 6, type: "精品小团", tags: ["海岛度假", "情侣旅行"], audience: "情侣、朋友出行", image: "/travel-home/bali.jpg", price: 6299, priceState: "REFERENCE", summary: "乌布田园、南部海岸与两晚度假酒店，留足自由时间。", departures: [{ date: "2026-10-18", price: 6299, status: "可报名" }, { date: "2026-11-08", price: 5999, status: "即将成团" }], itinerary: [{ day: "Day 1", title: "抵达巴厘岛", city: "登巴萨", detail: "接机后入住南部海岸酒店。" }, { day: "Day 2", title: "乌布田园", city: "乌布", detail: "梯田、手作村与当地餐厅。" }, { day: "Day 3", title: "乌布自由日", city: "乌布", detail: "可选瑜伽、漂流或咖啡体验。" }, { day: "Day 4", title: "南部海岸", city: "乌鲁瓦图", detail: "悬崖海景与日落。" }, { day: "Day 5", title: "酒店度假", city: "努沙杜瓦", detail: "整日自由安排。" }, { day: "Day 6", title: "返程", city: "登巴萨", detail: "根据航班安排送机。" }] },
  { slug: "singapore-family-5d", name: "新加坡亲子探索 5 日半自由行", destination: "新加坡", departure: "深圳", days: 5, type: "亲子团", tags: ["亲子旅行", "城市漫游"], audience: "有 4-12 岁儿童的家庭", image: "/travel-home/singapore.jpg", price: 5699, priceState: "REFERENCE", summary: "动物园、滨海湾与圣淘沙，行程紧凑度适合带娃家庭。", departures: [{ date: "2026-10-02", price: 5999, status: "名额紧张" }, { date: "2026-11-14", price: 5699, status: "可报名" }], itinerary: [{ day: "Day 1", title: "抵达新加坡", city: "滨海湾", detail: "中文接机与酒店入住。" }, { day: "Day 2", title: "动物园与夜间动物园", city: "万礼", detail: "亲子友好的全天安排。" }, { day: "Day 3", title: "圣淘沙自由日", city: "圣淘沙", detail: "可选环球影城或海洋馆。" }, { day: "Day 4", title: "城市探索", city: "新加坡", detail: "滨海湾花园与街区漫游。" }, { day: "Day 5", title: "返程", city: "樟宜", detail: "预留机场探索时间。" }] },
  { slug: "yunnan-slow-6d", name: "大理丽江 6 日慢旅行", destination: "云南", departure: "昆明", days: 6, type: "私家团", tags: ["自然风光", "情侣旅行"], audience: "情侣、家庭、朋友出行", image: "/travel-home/mountains.jpg", price: 4899, priceState: "ESTIMATED", summary: "洱海、古城与雪山组合，专车小团，减少购物与赶路。", departures: [{ date: "2026-10-12", price: 4899, status: "待确认" }, { date: "2026-11-02", price: 4599, status: "可报名" }], itinerary: [{ day: "Day 1", title: "昆明接站", city: "昆明", detail: "入住市区酒店。" }, { day: "Day 2", title: "前往大理", city: "大理", detail: "洱海与古城慢游。" }, { day: "Day 3", title: "环洱海", city: "大理", detail: "双廊、喜洲与湖畔咖啡。" }, { day: "Day 4", title: "丽江古城", city: "丽江", detail: "下午自由探索。" }, { day: "Day 5", title: "玉龙雪山", city: "丽江", detail: "根据天气与身体状态调整。" }, { day: "Day 6", title: "返程", city: "丽江", detail: "送往机场或车站。" }] },
  { slug: "chongqing-weekend-4d", name: "重庆山城周末 4 日小团", destination: "重庆", departure: "广州", days: 4, type: "当地参团", tags: ["美食", "周末旅行"], audience: "朋友、学生、情侣", image: "/Chongqing.jpg", price: 2399, priceState: "REFERENCE", summary: "轻轨穿楼、江景夜色与地道火锅，适合第一次到重庆。", departures: [{ date: "2026-10-23", price: 2399, status: "可报名" }, { date: "2026-11-13", price: 2199, status: "可报名" }], itinerary: [{ day: "Day 1", title: "抵达重庆", city: "渝中", detail: "入住解放碑附近酒店。" }, { day: "Day 2", title: "山城步道", city: "重庆", detail: "李子坝、鹅岭与江岸夜景。" }, { day: "Day 3", title: "武隆一日", city: "武隆", detail: "天生三桥自然景观。" }, { day: "Day 4", title: "老街与返程", city: "重庆", detail: "上午自由活动后送站。" }] },
  { slug: "iceland-aurora-8d", name: "冰岛南岸极光 8 日精品团", destination: "冰岛", departure: "上海", days: 8, type: "出境跟团", tags: ["自然风光", "极光"], audience: "自然爱好者、摄影旅行者", image: "/travel-home/aurora.jpg", price: 23800, priceState: "PENDING_CONFIRMATION", summary: "黄金圈、冰河湖与南岸瀑布，冬季极光行程由当地合作旅行社履约。", departures: [{ date: "2026-11-20", price: 23800, status: "待确认" }, { date: "2026-12-18", price: 25900, status: "即将成团" }], itinerary: [{ day: "Day 1", title: "出发前往冰岛", city: "雷克雅未克", detail: "国际航班与转机说明由顾问确认。" }, { day: "Day 2", title: "城市休整", city: "雷克雅未克", detail: "市区漫步与行前说明。" }, { day: "Day 3", title: "黄金圈", city: "南部区", detail: "间歇泉、黄金瀑布与国家公园。" }, { day: "Day 4", title: "南岸瀑布", city: "维克", detail: "黑沙滩与沿途瀑布。" }, { day: "Day 5", title: "冰河湖", city: "杰古沙龙", detail: "蓝冰湖与钻石沙滩。" }, { day: "Day 6", title: "返回雷克雅未克", city: "雷克雅未克", detail: "沿途机动追光。" }, { day: "Day 7", title: "蓝湖体验", city: "雷克雅内斯", detail: "按预约时段入场。" }, { day: "Day 8", title: "返程", city: "雷克雅未克", detail: "送机结束服务。" }] },
  { slug: "kyoto-autumn-5d", name: "京都奈良秋日 5 日文化小团", destination: "日本", departure: "杭州", days: 5, type: "精品小团", tags: ["文化体验", "城市漫游"], audience: "情侣、朋友、文化旅行者", image: "/travel-home/kyoto.jpg", price: 7299, priceState: "REFERENCE", summary: "寺院、町屋与奈良公园，中文小团兼顾讲解和自由时间。", departures: [{ date: "2026-11-10", price: 7299, status: "名额紧张" }, { date: "2026-11-24", price: 7599, status: "可报名" }], itinerary: [{ day: "Day 1", title: "抵达关西", city: "京都", detail: "机场接驳与酒店入住。" }, { day: "Day 2", title: "东山寺院", city: "京都", detail: "清水寺与祇园步行路线。" }, { day: "Day 3", title: "岚山慢游", city: "京都", detail: "竹林、庭院与河畔自由时间。" }, { day: "Day 4", title: "奈良一日", city: "奈良", detail: "公园、寺院与町街。" }, { day: "Day 5", title: "返程", city: "大阪", detail: "根据航班安排送机。" }] },
];

export const activities = [
  { slug: "wuzhizhou-island", name: "蜈支洲岛一日体验", location: "三亚·海棠湾", category: "景区", image: "/travel-home/tropical-beach.jpg", price: 158, summary: "含往返船票与接送建议，适合海岛半日或一日安排。", rules: "需提前 1 天预约，具体以景区通知为准。" },
  { slug: "universal-studios", name: "新加坡环球影城", location: "新加坡·圣淘沙", category: "乐园", image: "/travel-home/singapore.jpg", price: 399, summary: "热门主题园区门票与入园攻略。", rules: "实名制票品，退改以确认单为准。" },
  { slug: "kyoto-tea", name: "京都茶道与町屋体验", location: "日本·京都", category: "当地体验", image: "/travel-home/kyoto.jpg", price: 299, summary: "在町屋里体验茶道，适合情侣与亲子。", rules: "中文预约，活动时长约 90 分钟。" },
  { slug: "sanya-sailing", name: "三亚湾落日帆船", location: "三亚·三亚湾", category: "水上项目", image: "/travel-home/sanya-coast.jpg", price: 268, summary: "小团出海看落日，提供安全讲解。", rules: "受天气影响可改期或取消。" },
];

export const packages = [
  { slug: "sanya-hotel-breakfast", name: "三亚海棠湾酒店 + 双早", hotel: "海棠湾度假酒店", benefits: ["海景房 2 晚", "双人早餐", "接送机优惠"], image: "/travel-home/hotel-suite.jpg", price: 1299, rules: "入住日期需提前确认，节假日可能补差。" },
  { slug: "kyoto-stay-tea", name: "京都町屋住宿 + 茶道体验", hotel: "京都町屋精选", benefits: ["町屋住宿 2 晚", "茶道体验 1 次", "中文礼宾"], image: "/travel-home/kyoto.jpg", price: 2399, rules: "需至少提前 7 天确认，价格为参考价。" },
  { slug: "singapore-family", name: "新加坡亲子酒店 + 环球影城", hotel: "圣淘沙亲子酒店", benefits: ["家庭房 3 晚", "环球影城门票 2 张", "机场接送"], image: "/travel-home/singapore.jpg", price: 4899, rules: "票品一经确认不可退，房态需人工确认。" },
];

export const guides = [
  { slug: "sanya-5-days", title: "5000 元，两个人在三亚怎么玩？", summary: "把预算花在海景、交通和真正值得的体验上。", tag: "海岛度假", image: "/travel-home/sanya-coast.jpg", body: ["三亚适合把节奏放慢，建议 5 天 4 晚分住海棠湾与三亚湾。", "预算有限时，不必每天安排景点，留半天给海边和酒店本身。", "交通上优先确认接送机和景区往返，能减少临时沟通成本。"] },
  { slug: "tokyo-slow-walk", title: "东京街头漫游指南", summary: "咖啡、书店与夜景路线，留一点空白给自己。", tag: "城市漫游", image: "/travel-home/tokyo.jpg", body: ["东京适合按片区安排，每天 1-2 个重点区域即可。", "住在山手线或地铁换乘方便的位置，能显著减少体力消耗。"] },
  { slug: "family-hotel-guide", title: "带娃去哪玩？亲子酒店怎么选", summary: "从房型、早餐、交通和儿童权益四个方面做判断。", tag: "亲子旅行", image: "/travel-home/hotel-suite.jpg", body: ["亲子出行优先选择空间和早餐稳定的酒店。", "把玩乐安排在酒店周边，旅程会更从容。"] },
];

export const notifications = [
  { id: "n1", title: "行程提醒", content: "三亚海岛假期将在 34 天后出发，记得查看证件与交通安排。", type: "行程", time: "今天" },
  { id: "n2", title: "顾问消息", content: "你的东京与箱根方案已更新，酒店房型正在确认中。", type: "顾问", time: "昨天" },
];
