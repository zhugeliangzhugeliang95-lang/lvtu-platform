export const appImages = {
  santorini: "/travel-home/santorini.jpg",
  coast: "/travel-home/hero-coast.jpg",
  sanya: "/travel-home/sanya-coast.jpg",
  beach: "/travel-home/tropical-beach.jpg",
  kyoto: "/travel-home/kyoto.jpg",
  japan: "/travel-home/japan.jpg",
  singapore: "/travel-home/singapore.jpg",
  tokyo: "/travel-home/tokyo.jpg",
  aurora: "/travel-home/aurora.jpg",
  mountains: "/travel-home/mountains.jpg",
  hotel: "/travel-home/hotel-suite.jpg",
};

export const exploreDestinations = [
  { name: "圣托里尼", country: "希腊", season: "5-10月", image: appImages.santorini, href: "/discover?place=santorini" },
  { name: "京都", country: "日本", season: "春秋最佳", image: appImages.kyoto, href: "/discover?place=kyoto" },
  { name: "新加坡", country: "新加坡", season: "全年适合", image: appImages.singapore, href: "/discover?place=singapore" },
  { name: "雷克雅未克", country: "冰岛", season: "极光季", image: appImages.aurora, href: "/discover?place=iceland" },
];

export const inspirationStories = [
  { eyebrow: "海岛度假", title: "把一半时间留给海风", note: "三亚 5 天 4 晚慢旅行", destination: "三亚", image: appImages.sanya },
  { eyebrow: "城市漫游", title: "东京街头的松弛一天", note: "咖啡、书店与夜景路线", destination: "东京", image: appImages.tokyo },
  { eyebrow: "自然路线", title: "在雪山脚下醒来", note: "适合第一次长线自驾", destination: "云南", image: appImages.mountains },
];

export const plannerShortcuts = ["情侣旅行", "亲子旅行", "周末旅行", "海岛度假"];

export const tripTimeline = [
  { time: "09:20", title: "抵达三亚凤凰机场", note: "专车将在 2 号门等候", state: "已确认" },
  { time: "11:00", title: "入住海棠湾度假酒店", note: "海景大床房 · 含双早", state: "已确认" },
  { time: "16:30", title: "海边日落散步", note: "步行 6 分钟到沙滩", state: "建议" },
];
