export type NavItem = {
  href: string;
  label: string;
};

export const primaryNav: NavItem[] = [
  { href: "/", label: "首页" },
  { href: "/hotels", label: "酒店" },
  { href: "/flights", label: "机票" },
  { href: "/trains", label: "高铁" },
  { href: "/routes", label: "热门线路" },
  { href: "/request", label: "填写需求" },
];

export const scenarioButtons = [
  "周末短途",
  "特种兵一天",
  "宿舍拼团",
  "演唱会顺路玩",
  "情侣约会",
  "预算压到最低",
];

export const trustBadges = ["帮你做功课", "学生预算更清楚", "路线和住行一起看", "顾问可继续跟进"];

export type ServiceSlug = "hotel" | "flight" | "rail" | "package" | "pickup" | "concierge";

export const services: Array<{
  slug: ServiceSlug;
  name: string;
  summary: string;
  who: string[];
  process: string[];
  notes: string[];
  faq: Array<{ q: string; a: string }>;
}> = [
  {
    slug: "hotel",
    name: "学生酒店推荐",
    summary: "按预算、地铁距离、商圈和安全感帮你筛更适合学生住的酒店。",
    who: ["周末游", "考试后放松", "演唱会 / 漫展", "情侣出游"],
    process: ["客户提交酒店、日期、房型和人数", "旅途先查全网平台参考价", "继续匹配供应商或协议价", "客户确认后人工客服介入成交"],
    notes: ["优先推荐交通方便、晚到也好入住的房型", "会标清可取消和不可取消规则"],
    faq: [
      { q: "一定最便宜吗？", a: "不承诺绝对最低价，但会尽量给你更划算、更省心的选择。" },
      { q: "适合多人拼房吗？", a: "可以，会结合人数和预算推荐更合适的房型。" },
    ],
  },
  {
    slug: "flight",
    name: "机票比价建议",
    summary: "帮你看直飞、中转、红眼和行李额，适合学生党控制总预算。",
    who: ["跨省旅行", "假期回家", "演唱会跨城", "出境自由行"],
    process: ["客户提交出发地、目的地、日期和人数", "旅途搜索机票平台参考价", "结合行李、时间和协议资源继续核价", "客户确认后客服介入出票规则和成交"],
    notes: ["会显著提示红眼航班和超长中转", "重点看总花费而不是票面最低价"],
    faq: [
      { q: "能只看便宜的吗？", a: "可以，但也会提示体力消耗和额外花费风险。" },
      { q: "可以和酒店一起看吗？", a: "可以，我们会把住和行放在一起看。" },
    ],
  },
  {
    slug: "rail",
    name: "高铁出行方案",
    summary: "更适合大学生周末游和宿舍拼团，重点看车次、时段和到站后动线。",
    who: ["周边城市游", "多人拼团", "特种兵路线", "省内短途"],
    process: ["客户提交出发地、目的地、日期和人数", "旅途搜索高铁/火车参考价", "结合到站动线和组合资源继续核价", "客户确认后客服介入确认车次和订单"],
    notes: ["适合预算有限但想玩得更完整的人", "会提醒到站时间太晚的问题"],
    faq: [
      { q: "只做高铁吗？", a: "也可以和酒店、接送、路线建议一起打包看。" },
      { q: "适合当天往返吗？", a: "可以，尤其适合特种兵一天或短途打卡。" },
    ],
  },
  {
    slug: "package",
    name: "现成路线模板",
    summary: "把交通、住宿、吃喝玩顺手串起来，适合不想自己一条条做功课的人。",
    who: ["第一次出门玩", "想省时间", "宿舍集体出行", "情侣小旅行"],
    process: ["客户提交门票、乐园或当地项目需求", "旅途先查主流平台参考价", "继续匹配供应商套餐或协议价", "客户确认后客服核库存、规则并成交"],
    notes: ["重点是轻决策，不是堆很多复杂选项", "默认按学生预算做档位建议"],
    faq: [
      { q: "路线会不会很死板？", a: "不会，模板只是起点，你可以继续改偏好和预算。" },
      { q: "包含门票吗？", a: "当前以住行和路线建议为主，部分项目会作为可选项展示。" },
    ],
  },
  {
    slug: "pickup",
    name: "接送与本地协助",
    summary: "适合晚到、人生地不熟、多人出行或想省沟通成本的场景。",
    who: ["深夜到达", "第一次去陌生城市", "多人拼团", "重要约会 / 演出日"],
    process: ["客户提交接送、包车或本地协助需求", "旅途先看车型和平台参考价", "继续匹配合作司机或供应商报价", "客户确认后客服核时间、联系人并成交"],
    notes: ["不是每次都需要，但在关键节点很有用", "适合作为路线加购项展示"],
    faq: [
      { q: "学生会用到吗？", a: "会，特别是深夜到达、多人行李多或赶活动时。" },
      { q: "能单独下单吗？", a: "可以，也能和酒店或路线一起看。" },
    ],
  },
  {
    slug: "concierge",
    name: "顾问协助",
    summary: "适合纠结、需求复杂、多人沟通很乱，或者想有人帮你把规则讲清楚的时候。",
    who: ["多人出行", "预算卡得很紧", "第一次出境", "临时改计划"],
    process: ["客户提交复杂需求或预算", "旅途整理需求并查全网参考价", "人工继续匹配协议资源和可行方案", "客户确认后客服推进订单成交"],
    notes: ["平台价值不只在比价，也在把沟通成本降下来", "会在后台记录每次跟进"],
    faq: [
      { q: "多久能回？", a: "试运营阶段会尽量快，建议提交后再加微信沟通。" },
      { q: "适合宿舍一起出游吗？", a: "很适合，尤其适合统一需求和减少反复确认。" },
    ],
  },
];

export type DestinationSlug = "hangzhou" | "nanjing" | "qingdao" | "chengdu" | "changsha" | "xiamen" | "chongqing" | "shanghai";

export const destinations: Array<{
  slug: DestinationSlug;
  name: string;
  days: string;
  budget: string;
  season: string;
  imageUrl: string;
  imageCreditUrl: string;
  transport: string[];
  hotelTips: string[];
  highlights: string[];
  visa: string;
  taxRefund: string;
}> = [
  {
    slug: "hangzhou",
    name: "杭州",
    days: "2天1晚 / 3天2晚",
    budget: "¥500–¥1300/人",
    season: "春天和秋天最舒服",
    imageUrl: "https://images.pexels.com/photos/36893307/pexels-photo-36893307.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCreditUrl: "https://www.pexels.com/photo/urban-lakeside-skyline-in-hangzhou-china-36893307/",
    transport: ["高铁最方便", "周五晚出发体验最好", "住地铁边能省很多通勤时间"],
    hotelTips: ["西湖边会贵，地铁一两站外更划算", "适合晚到入住的酒店更重要"],
    highlights: ["周末散心", "拍照出片", "轻松逛吃"],
    visa: "国内城市，无签证要求。",
    taxRefund: "不涉及退税，以住宿和玩法建议为主。",
  },
  {
    slug: "nanjing",
    name: "南京",
    days: "2天1晚",
    budget: "¥450–¥1100/人",
    season: "春秋更适合步行和夜游",
    imageUrl: "https://images.pexels.com/photos/31133706/pexels-photo-31133706.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCreditUrl: "https://www.pexels.com/photo/city-wall-and-lake-scenery-in-nanjing-31133706/",
    transport: ["高铁班次多", "适合周末短途", "地铁覆盖好"],
    hotelTips: ["新街口附近最省心", "夫子庙周边适合第一次去"],
    highlights: ["人文氛围", "夜景", "短途轻松"],
    visa: "国内城市，无签证要求。",
    taxRefund: "不涉及退税。",
  },
  {
    slug: "qingdao",
    name: "青岛",
    days: "2天1晚 / 3天2晚",
    budget: "¥600–¥1500/人",
    season: "春夏更热门，海边氛围更好",
    imageUrl: "https://images.pexels.com/photos/19334674/pexels-photo-19334674.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCreditUrl: "https://www.pexels.com/photo/qingdao-city-at-foot-of-mountain-in-china-19334674/",
    transport: ["沿海高铁可选", "跨省更适合飞机"],
    hotelTips: ["海边酒店溢价高，建议别住太靠一线", "拍照型路线适合住景点中间位置"],
    highlights: ["海边", "周末放松", "朋友结伴"],
    visa: "国内城市，无签证要求。",
    taxRefund: "不涉及退税。",
  },
  {
    slug: "chengdu",
    name: "成都",
    days: "3天2晚",
    budget: "¥800–¥1800/人",
    season: "全年都能玩，节假日人会多",
    imageUrl: "https://images.pexels.com/photos/12810829/pexels-photo-12810829.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCreditUrl: "https://www.pexels.com/photo/bridge-and-city-buildings-12810829/",
    transport: ["高铁和飞机都行", "更适合三天两晚"],
    hotelTips: ["春熙路和太古里周边最方便", "多人住建议优先看隔音和房型"],
    highlights: ["美食", "城市慢游", "适合宿舍拼团"],
    visa: "国内城市，无签证要求。",
    taxRefund: "不涉及退税。",
  },
  {
    slug: "changsha",
    name: "长沙",
    days: "2天1晚",
    budget: "¥500–¥1200/人",
    season: "秋冬和节假日最热门",
    imageUrl: "https://images.pexels.com/photos/35422098/pexels-photo-35422098.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCreditUrl: "https://www.pexels.com/photo/cityscape-and-river-at-sunset-35422098/",
    transport: ["高铁很友好", "很适合周末快闪"],
    hotelTips: ["五一广场附近最适合学生党", "夜宵回酒店方便很重要"],
    highlights: ["夜生活", "逛吃", "低预算快乐"],
    visa: "国内城市，无签证要求。",
    taxRefund: "不涉及退税。",
  },
  {
    slug: "xiamen",
    name: "厦门",
    days: "2天1晚 / 3天2晚",
    budget: "¥700–¥1700/人",
    season: "春秋更舒服，夏天更适合海边",
    imageUrl: "https://images.pexels.com/photos/5999495/pexels-photo-5999495.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCreditUrl: "https://www.pexels.com/photo/scenic-view-of-the-coastline-in-xiamen-5999495/",
    transport: ["华南华东高铁也方便", "跨省可直飞"],
    hotelTips: ["住岛内更省时间", "想看海不一定要海景房"],
    highlights: ["海边散心", "情侣约会", "拍照路线"],
    visa: "国内城市，无签证要求。",
    taxRefund: "不涉及退税。",
  },
  {
    slug: "chongqing",
    name: "重庆",
    days: "3天2晚",
    budget: "¥700–¥1600/人",
    season: "秋冬更舒服，暑期偏热",
    imageUrl: "https://images.pexels.com/photos/32709740/pexels-photo-32709740.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCreditUrl: "https://www.pexels.com/photo/skyline-of-chongqing-with-yangtze-river-view-32709740/",
    transport: ["高铁和飞机都适合", "山城动线更需要提前规划"],
    hotelTips: ["解放碑附近更省心", "住轻轨边能少走很多冤枉路"],
    highlights: ["夜景", "火锅", "朋友一起更有氛围"],
    visa: "国内城市，无签证要求。",
    taxRefund: "不涉及退税。",
  },
  {
    slug: "shanghai",
    name: "上海",
    days: "2天1晚 / 3天2晚",
    budget: "¥800–¥2000/人",
    season: "全年可玩，活动特别多",
    imageUrl: "https://images.pexels.com/photos/28445268/pexels-photo-28445268.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCreditUrl: "https://www.pexels.com/photo/colorful-shanghai-skyline-at-night-28445268/",
    transport: ["高铁和飞机都方便", "适合演唱会和活动顺路玩"],
    hotelTips: ["人民广场、静安和徐汇更适合学生游客", "活动散场后的回程方便很关键"],
    highlights: ["演出活动", "城市打卡", "节奏快"],
    visa: "国内城市，无签证要求。",
    taxRefund: "不涉及退税。",
  },
];

export const featuredDeals = [
  {
    type: "周末低价",
    title: "杭州 2 天 1 晚轻松档",
    price: "¥699 / 人起",
    note: "适合周五晚出发，地铁边酒店更省心",
    imageUrl: "https://images.pexels.com/photos/36893307/pexels-photo-36893307.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCreditUrl: "https://www.pexels.com/photo/urban-lakeside-skyline-in-hangzhou-china-36893307/",
  },
  {
    type: "拼团友好",
    title: "成都 3 天 2 晚宿舍出游",
    price: "¥1199 / 人起",
    note: "多人房型和高铁时段更适合学生拼团",
    imageUrl: "https://images.pexels.com/photos/12810829/pexels-photo-12810829.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCreditUrl: "https://www.pexels.com/photo/bridge-and-city-buildings-12810829/",
  },
  {
    type: "演出顺路玩",
    title: "上海活动日 2 天路线",
    price: "¥899 / 人起",
    note: "重点解决散场后住宿和返程衔接",
    imageUrl: "https://images.pexels.com/photos/28445268/pexels-photo-28445268.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCreditUrl: "https://www.pexels.com/photo/colorful-shanghai-skyline-at-night-28445268/",
  },
];

export const plannerTabs = [
  {
    key: "itinerary",
    label: "怎么玩",
    items: ["把每天安排拆开，不让行程太挤", "优先兼顾体力、预算和拍照/吃喝体验", "会给上午、下午、晚上三段建议"],
  },
  {
    key: "traffic",
    label: "怎么去",
    items: ["高铁、机票一起看，不只盯单价", "会提醒红眼、晚到和转车风险", "更适合学生党控制总成本"],
  },
  {
    key: "stay",
    label: "住哪里",
    items: ["优先地铁边、商圈附近和回程方便", "会区分情侣、多人拼团和单人出行", "标清取消规则和房型风险"],
  },
  {
    key: "extras",
    label: "还要注意什么",
    items: ["会提示旺季、节假日、散场时间和返程衔接", "能加顾问继续帮你确认", "需要时再补接送和本地协助"],
  },
];

export const hotelCollections = [
  { name: "地铁边住得省心", description: "适合第一次去、不想绕路的学生用户。", tags: ["交通方便", "晚到可住", "预算友好"], price: "¥180 / 晚起" },
  { name: "多人拼房更划算", description: "适合宿舍拼团，重点看房型、床位和沟通成本。", tags: ["多人出行", "拼团友好", "性价比"], price: "¥260 / 晚起" },
  { name: "约会和纪念日升级", description: "预算稍高一点，但更适合约会、纪念日和氛围感路线。", tags: ["情侣", "氛围好", "体验优先"], price: "¥380 / 晚起" },
];

export const flightCollections = [
  { name: "最低总花费", description: "适合预算很卡的学生党，但会提醒时间成本。", tags: ["低预算", "错峰", "别只看票面价"] },
  { name: "时间更顺手", description: "适合周末快闪，不想把时间浪费在路上。", tags: ["少折腾", "更省时间", "周末友好"] },
  { name: "活动 / 节假日方案", description: "适合演唱会、漫展、节假日这种时间点卡得很死的场景。", tags: ["活动日", "防踩坑", "回程衔接"] },
];

export const routeProducts = [
  {
    slug: "hangzhou-weekend",
    title: "杭州 2 天 1 晚轻松周末线",
    crowd: "周末散心 / 情侣 / 朋友结伴",
    duration: "2天1晚",
    budget: "¥699 / 人起",
    imageUrl: "https://images.pexels.com/photos/36893307/pexels-photo-36893307.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCreditUrl: "https://www.pexels.com/photo/urban-lakeside-skyline-in-hangzhou-china-36893307/",
    highlights: ["周五晚出发最合适", "地铁边住宿", "轻松不赶路"],
  },
  {
    slug: "changsha-night",
    title: "长沙 2 天 1 晚逛吃夜游线",
    crowd: "朋友组队 / 宿舍拼团",
    duration: "2天1晚",
    budget: "¥799 / 人起",
    imageUrl: "https://images.pexels.com/photos/35422098/pexels-photo-35422098.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCreditUrl: "https://www.pexels.com/photo/cityscape-and-river-at-sunset-35422098/",
    highlights: ["夜生活友好", "五一广场附近更方便", "预算清晰"],
  },
  {
    slug: "chengdu-group",
    title: "成都 3 天 2 晚宿舍出游线",
    crowd: "宿舍拼团 / 朋友出游",
    duration: "3天2晚",
    budget: "¥1299 / 人起",
    imageUrl: "https://images.pexels.com/photos/12810829/pexels-photo-12810829.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCreditUrl: "https://www.pexels.com/photo/bridge-and-city-buildings-12810829/",
    highlights: ["多人住更划算", "吃喝路线顺", "不容易散"],
  },
];

export const reviews = [
  { name: "小林，大二", quote: "以前出去玩最烦的是查太多平台，这版至少先把住、行和预算放在一起看清楚了。" },
  { name: "阿欣，研一", quote: "最适合我们这种周末想出去但不想做太多攻略的人，路线和酒店位置都很实用。" },
  { name: "阿泽，大三", quote: "多人出行最怕来回讨论，这种先出一版清晰方案再改的方式会省很多时间。" },
];

export const guarantees = [
  "不只讲低价，也讲清楚规则和限制",
  "适合学生预算，不让页面看起来像大而全 OTA",
  "可以先提交需求，再转人工继续确认",
  "重点解决大学生最常见的短途、拼团和周末出行问题",
];

export const memberBenefits = [
  "收藏路线和历史方案，下次复用更快",
  "低价提醒和活动档提醒",
  "优先看到适合学生的路线模板",
];

export const enterpriseFeatures = [
  "如果以后要做社团出游、班级活动或学生组织团建，这里可以继续扩展。",
  "当前先不作为前台重点入口，避免把站点做得太杂。",
  "后续更适合改成“多人拼团 / 社团活动”能力，而不是企业差旅。",
  "保留页面只是为了后续扩展，不影响现在的大学生定位。",
];

export const caseStudies = [
  {
    title: "周末 2 天 1 晚：不想做太多攻略",
    scene: "周五晚上走，周日下午回，预算不高但想住得舒服一点。",
    need: "交通别太折腾，酒店别太偏，整体支出要能接受。",
    plan: "先给出高铁和酒店组合，再补一份轻松路线建议。",
    result: "沟通次数少很多，出发前就知道大概要花多少钱。",
  },
  {
    title: "宿舍拼团：每个人预算不一样",
    scene: "四五个人一起出门，时间、预算、房型偏好都不一样。",
    need: "想有一个统一版本，别在群里聊半天还定不下来。",
    plan: "先按预算分层做方案，再推荐更适合拼房的住法和车次。",
    result: "统一沟通口径后更容易定下来，也更适合继续交给顾问跟进。",
  },
  {
    title: "演唱会顺路玩：重点是别踩坑",
    scene: "为了活动跨城，最怕散场后回不去、酒店太远、第二天太累。",
    need: "住得离场馆或地铁近，返程和预算要好控制。",
    plan: "把活动时间和预算写清楚，重点优化住宿位置和返程方式。",
    result: "不只是玩得更顺，也减少了活动日最容易出问题的环节。",
  },
];
