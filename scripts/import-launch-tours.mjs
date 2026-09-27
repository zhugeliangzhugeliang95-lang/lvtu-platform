import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const atShanghaiNoon = (month, day) => new Date(`2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00+08:00`);

function departure(month, day, price, note) {
  return {
    departureDate: atShanghaiNoon(month, day),
    adultPrice: price,
    status: "PENDING_CONFIRMATION",
    note,
  };
}

const tours = [
  {
    slug: "tanmi-sidao-5d-2026-autumn",
    name: "探秘四稻 · 川西5日游",
    destination: "四姑娘山·稻城亚丁·康定",
    departureCity: "成都",
    days: 5,
    tourType: "精品小团",
    audience: "适合希望一次走完川西经典线路、可适应高原行程的旅行者",
    summary: "四姑娘山、墨石公园、稻城亚丁与康定情歌串联，2+1陆地头等舱，含藏家歌舞晚会与藏式土火锅。",
    coverImage: "/travel-home/mountains.jpg",
    tags: ["川西秋色", "2+1保姆车", "高原路线"],
    recommended: true,
    departures: [
      departure(9, 27, 1680, "舒适型参考；轻奢型1780元/人，尊享型1980元/人"),
      departure(9, 28, 1880, "舒适型参考；轻奢型1980元/人，尊享型2180元/人"),
      departure(9, 29, 1980, "舒适型参考；轻奢型2080元/人，尊享型2280元/人"),
      departure(9, 30, 2180, "舒适型参考；轻奢型2280元/人，尊享型2480元/人"),
      departure(10, 1, 2280, "舒适型参考；轻奢型2480元/人，尊享型2680元/人"),
      departure(10, 2, 2280, "舒适型参考；轻奢型2480元/人，尊享型2680元/人"),
      departure(10, 3, 2180, "舒适型参考；轻奢型2280元/人，尊享型2480元/人"),
      departure(10, 4, 1980, "舒适型参考；轻奢型2080元/人，尊享型2280元/人"),
      departure(10, 5, 1880, "舒适型参考；轻奢型1980元/人，尊享型2180元/人"),
      departure(10, 6, 1680, "舒适型参考；轻奢型1780元/人，尊享型1980元/人"),
    ],
    itinerary: [
      { day: 1, title: "成都—四姑娘山双桥沟—丹巴/八美", city: "四姑娘山·丹巴", attractions: "猫鼻梁观景台、双桥沟", transport: "2+1陆地头等舱", meals: "中餐、晚餐", hotel: "丹巴/八美参考住宿", detail: "成都指定地点集合，经猫鼻梁观景台进入双桥沟，游览后前往丹巴或八美入住。" },
      { day: 2, title: "丹巴/八美—墨石公园—稻城", city: "墨石公园·稻城", attractions: "墨石公园、新都桥、理塘", transport: "旅游用车", meals: "早餐、中餐、晚餐", hotel: "稻城含氧参考住宿", detail: "沿川西景观大道前往稻城，途中串联墨石公园、新都桥、雅江与理塘。" },
      { day: 3, title: "稻城—亚丁景区—香格里拉镇", city: "稻城亚丁", attractions: "亚丁景区", transport: "旅游用车及景区交通", meals: "早餐、晚餐", hotel: "香格里拉镇四钻参考住宿", detail: "进入亚丁景区游览，实际线路与停留时间以当日景区开放及团队安排为准。" },
      { day: 4, title: "香格里拉镇—仲堆民俗村—雅江/新都桥", city: "稻城·新都桥", attractions: "仲堆民俗村、理塘", transport: "旅游用车", meals: "早餐、中餐、晚餐", hotel: "雅江/新都桥参考住宿", detail: "由香格里拉镇返程，经民俗村、稻城和理塘，前往雅江或新都桥入住。" },
      { day: 5, title: "雅江/新都桥—康定情歌—成都", city: "康定·成都", attractions: "康定情歌景区", transport: "旅游用车", meals: "早餐", hotel: "不含", detail: "游览康定情歌相关景区后返回成都；建议返程大交通预留至次日。" },
    ],
  },
  {
    slug: "changxiang-jiuzhai-3d-2026-autumn",
    name: "畅享九寨 · 3日精品小团",
    destination: "九寨沟",
    departureCity: "成都",
    days: 3,
    tourType: "精品小团",
    audience: "适合时间紧凑、希望用小团方式游览九寨沟的旅行者",
    summary: "成都出发，7—9座保姆车，8人以内小团；舒适、轻奢与豪华三档住宿可选。",
    coverImage: "/travel-home/mountains.jpg",
    tags: ["九寨沟", "8人小团", "保姆车"],
    recommended: true,
    departures: [
      ...[25, 26, 27].map((day) => departure(9, day, 1150, "舒适型参考；轻奢型1300元/人，豪华型1550元/人")),
      departure(9, 28, 1300, "舒适型参考；轻奢型1400元/人，豪华型1700元/人"),
      departure(9, 29, 1300, "舒适型参考；轻奢型1380元/人，豪华型1800元/人"),
      departure(9, 30, 1500, "舒适型参考；轻奢型1600元/人，豪华型1900元/人"),
      departure(10, 1, 1650, "舒适型参考；轻奢型1800元/人，豪华型2100元/人"),
      departure(10, 2, 1650, "舒适型参考；轻奢型1800元/人，豪华型2100元/人"),
      departure(10, 3, 1600, "舒适型参考；轻奢型1750元/人，豪华型2100元/人"),
      departure(10, 4, 1500, "舒适型参考；轻奢型1650元/人，豪华型2000元/人"),
      departure(10, 5, 1350, "舒适型参考；轻奢型1500元/人，豪华型1800元/人"),
      departure(10, 6, 1350, "舒适型参考；轻奢型1500元/人，豪华型1800元/人"),
    ],
    itinerary: [],
  },
  {
    slug: "western-sichuan-loop-4d-2026-autumn",
    name: "川西小环线 · 4日精品小团",
    destination: "四姑娘山·姑弄村",
    departureCity: "成都",
    days: 4,
    tourType: "精品小团",
    audience: "适合初次体验川西秋色、偏好小团与灵活节奏的旅行者",
    summary: "四姑娘山与姑弄村方向，7—9座保姆车，8人以内小团；三档住宿标准可选。",
    coverImage: "/travel-home/mountains.jpg",
    tags: ["川西环线", "四姑娘山", "8人小团"],
    recommended: false,
    departures: [
      ...[25, 26, 27].map((day) => departure(9, day, 1130, "舒适型参考；轻奢型1230元/人，豪华型1380元/人")),
      departure(9, 28, 1180, "舒适型参考；轻奢型1280元/人，豪华型1430元/人"),
      departure(9, 29, 1380, "舒适型参考；轻奢型1580元/人，豪华型1780元/人"),
      departure(9, 30, 1580, "舒适型参考；轻奢型1880元/人，豪华型2180元/人"),
      ...[1, 2, 3].map((day) => departure(10, day, 1850, "舒适型参考；轻奢型2150元/人，豪华型2450元/人")),
      departure(10, 4, 1650, "舒适型参考；轻奢型1850元/人，豪华型2050元/人"),
      departure(10, 5, 1380, "舒适型参考；轻奢型1580元/人，豪华型1780元/人"),
      departure(10, 6, 1180, "舒适型参考；轻奢型1280元/人，豪华型1430元/人"),
    ],
    itinerary: [],
  },
  {
    slug: "quye-shuanghu-7d-2026-autumn",
    name: "趣野双湖 · 北疆7日",
    destination: "喀纳斯·禾木·赛里木湖",
    departureCity: "乌鲁木齐",
    days: 7,
    tourType: "自然风光",
    audience: "适合喜爱湖泊、森林与秋季北疆风光的旅行者",
    summary: "乌鲁木齐起止，1+1用车，安排四钻及特色住宿；9月25日至10月5日价格区间以顾问确认班期为准。",
    coverImage: "/travel-home/aurora.jpg",
    tags: ["北疆秋色", "双湖路线", "乌市起止"],
    recommended: true,
    departures: [departure(9, 25, 4980, "9月25日至10月5日公开参考价；具体出发日期、名额与住宿由顾问确认")],
    itinerary: [],
  },
  {
    slug: "quye-shuanghu-8d-2026-autumn",
    name: "趣野双湖 · 北疆8日",
    destination: "喀纳斯·禾木·赛里木湖",
    departureCity: "乌鲁木齐",
    days: 8,
    tourType: "自然风光",
    audience: "适合希望放慢节奏、增加北疆停留时间的旅行者",
    summary: "乌鲁木齐起止，1+1用车，四钻与景区特色住宿组合；国庆区间班期需二次确认。",
    coverImage: "/travel-home/aurora.jpg",
    tags: ["北疆深度", "双湖路线", "8日行程"],
    recommended: false,
    departures: [departure(9, 25, 5680, "9月25日至10月5日公开参考价；具体出发日期、名额与住宿由顾问确认")],
    itinerary: [],
  },
  {
    slug: "qiuyu-aertai-8d-2026-autumn",
    name: "秋遇阿尔泰 · 北疆8日",
    destination: "阿尔泰·喀纳斯·禾木",
    departureCity: "乌鲁木齐",
    days: 8,
    tourType: "自然风光",
    audience: "适合以阿尔泰秋色、村落与森林景观为重点的旅行者",
    summary: "乌鲁木齐起止，1+1用车，5晚四钻、1晚禾木景区与1晚喀纳斯景区住宿组合。",
    coverImage: "/travel-home/aurora.jpg",
    tags: ["阿尔泰秋色", "景区住宿", "乌市起止"],
    recommended: false,
    departures: [departure(9, 25, 5890, "9月25日至10月5日公开参考价；具体出发日期、名额与住宿由顾问确认")],
    itinerary: [],
  },
];

async function main() {
  await prisma.tourProduct.updateMany({
    where: { slug: "sanya-island-5d" },
    data: { status: "OFFLINE", recommended: false },
  });

  for (const source of tours) {
    const { departures, itinerary, tags, ...product } = source;
    const saved = await prisma.tourProduct.upsert({
      where: { slug: product.slug },
      create: {
        ...product,
        tags: JSON.stringify(tags),
        purchaseMode: "CONSULT",
        status: "ONLINE",
      },
      update: {
        ...product,
        tags: JSON.stringify(tags),
        purchaseMode: "CONSULT",
        status: "ONLINE",
      },
    });
    await prisma.$transaction([
      prisma.tourDeparture.deleteMany({ where: { productId: saved.id } }),
      prisma.tourItineraryDay.deleteMany({ where: { productId: saved.id } }),
    ]);
    if (departures.length) {
      await prisma.tourDeparture.createMany({
        data: departures.map((item) => ({ ...item, productId: saved.id })),
      });
    }
    if (itinerary.length) {
      await prisma.tourItineraryDay.createMany({
        data: itinerary.map((item) => ({ ...item, productId: saved.id })),
      });
    }
  }

  console.log(`Imported ${tours.length} verified launch products.`);
}

main().finally(() => prisma.$disconnect());
