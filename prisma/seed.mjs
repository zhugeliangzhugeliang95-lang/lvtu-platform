// @ts-check
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function base64url(input) {
  return input.toString("base64url");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `scrypt$${base64url(salt)}$${base64url(derived)}`;
}

async function main() {
  console.log("🌱 开始写入种子数据...\n");

  // ─── 清空数据 ───────────────────────────────────────────────────
  await prisma.notification.deleteMany();
  await prisma.supplierInquiryResult.deleteMany();
  await prisma.estimateResult.deleteMany();
  await prisma.marketPriceSnapshot.deleteMany();
  await prisma.estimateRule.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.customerService.deleteMany();
  await prisma.tourItineraryDay.deleteMany();
  await prisma.tourDeparture.deleteMany();
  await prisma.tourProduct.deleteMany();
  await prisma.activityProduct.deleteMany();
  await prisma.packageProduct.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.order.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.hotelLeadStatusLog.deleteMany();
  await prisma.hotelLeadNote.deleteMany();
  await prisma.hotelLead.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.homeBanner.deleteMany();
  await prisma.routePackage.deleteMany();
  await prisma.trainDeal.deleteMany();
  await prisma.flightDeal.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ 清空旧数据");

  // ─── 管理员账号 ─────────────────────────────────────────────────
  const admins = await prisma.adminUser.createManyAndReturn({
    data: [
      {
        username: "admin",
        passwordHash: hashPassword("admin123456"),
        role: "SUPER_ADMIN",
        realName: "超级管理员",
        mobile: "13800000001",
        status: "ACTIVE",
      },
      {
        username: "ops",
        passwordHash: hashPassword("12345678"),
        role: "OPS",
        realName: "运营管理员",
        mobile: "13800000002",
        status: "ACTIVE",
      },
      {
        username: "staff",
        passwordHash: hashPassword("staff123456"),
        role: "SUPPORT",
        realName: "客服小李",
        mobile: "13800000003",
        status: "ACTIVE",
      },
      {
        username: "xiaozhou",
        passwordHash: hashPassword("staff123456"),
        role: "SUPPORT",
        realName: "小周",
        mobile: "13800000005",
        status: "ACTIVE",
      },
      {
        username: "xiaolin",
        passwordHash: hashPassword("staff123456"),
        role: "SUPPORT",
        realName: "小林",
        mobile: "13800000006",
        status: "ACTIVE",
      },
      {
        username: "order",
        passwordHash: hashPassword("12345678"),
        role: "ORDER",
        realName: "订单专员",
        mobile: "13800000004",
        status: "ACTIVE",
      },
    ],
  });
  console.log(`✅ 管理员账号: ${admins.length} 条`);

  // ─── 前台用户 ────────────────────────────────────────────────────
  const users = await prisma.user.createManyAndReturn({
    data: [
      {
        email: "user1@test.com",
        mobile: "13900000001",
        nickname: "小明同学",
        passwordHash: hashPassword("12345678"),
        status: "ACTIVE",
      },
      {
        email: "user2@test.com",
        mobile: "13900000002",
        nickname: "旅行达人",
        passwordHash: hashPassword("12345678"),
        status: "ACTIVE",
      },
      {
        email: "user3@test.com",
        mobile: "13900000003",
        nickname: "周末出游",
        passwordHash: hashPassword("12345678"),
        status: "ACTIVE",
      },
    ],
  });
  console.log(`✅ 前台用户: ${users.length} 条`);

  // ─── 酒店数据 ────────────────────────────────────────────────────
  const hotels = await prisma.hotel.createManyAndReturn({
    data: [
      {
        name: "成都IFS精品酒店",
        city: "成都",
        district: "锦江区",
        address: "成都市锦江区红星路三段1号",
        starLevel: 5,
        coverImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
          "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
        ]),
        priceStart: 388,
        description: "坐落于成都CBD核心地带，毗邻成都国际金融中心，地铁直达，步行可达太古里、春熙路。",
        facilities: JSON.stringify(["免费WiFi", "健身房", "游泳池", "早餐", "停车场", "行李寄存"]),
        roomTypes: JSON.stringify([
          { name: "标准大床房", price: 388, size: "28㎡" },
          { name: "豪华大床房", price: 528, size: "35㎡" },
          { name: "商务套房", price: 888, size: "60㎡" },
        ]),
        cancelPolicy: "入住前48小时可免费取消",
        tags: JSON.stringify(["近地铁", "市中心", "五星", "早餐可选"]),
        status: "ONLINE",
        sortOrder: 100,
      },
      {
        name: "重庆解放碑嘉途酒店",
        city: "重庆",
        district: "渝中区",
        address: "重庆市渝中区民族路38号",
        starLevel: 4,
        coverImage: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
          "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
        ]),
        priceStart: 268,
        description: "位于解放碑核心商圈，步行5分钟到洪崖洞，江景房夜晚绝美，是重庆旅游必住选择。",
        facilities: JSON.stringify(["免费WiFi", "24h前台", "早餐", "洗衣服务"]),
        roomTypes: JSON.stringify([
          { name: "江景标间", price: 268, size: "26㎡" },
          { name: "江景大床房", price: 328, size: "32㎡" },
        ]),
        cancelPolicy: "入住前24小时可免费取消",
        tags: JSON.stringify(["江景", "近洪崖洞", "四星", "性价比高"]),
        status: "ONLINE",
        sortOrder: 95,
      },
      {
        name: "杭州西湖喜来登酒店",
        city: "杭州",
        district: "西湖区",
        address: "杭州市西湖区北山街78号",
        starLevel: 5,
        coverImage: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
          "https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=800&q=80",
        ]),
        priceStart: 698,
        description: "坐拥西湖美景，湖景房可直视断桥残雪，是情侣出游、家庭度假的首选高端酒店。",
        facilities: JSON.stringify(["免费WiFi", "游泳池", "SPA", "多餐厅", "停车场"]),
        roomTypes: JSON.stringify([
          { name: "西湖景双床房", price: 698, size: "38㎡" },
          { name: "西湖景大床房", price: 798, size: "38㎡" },
          { name: "湖景套房", price: 1688, size: "80㎡" },
        ]),
        cancelPolicy: "入住前72小时可免费取消",
        tags: JSON.stringify(["湖景", "五星", "情侣", "西湖边"]),
        status: "ONLINE",
        sortOrder: 90,
      },
      {
        name: "长沙橘子洲青年精品酒店",
        city: "长沙",
        district: "岳麓区",
        address: "长沙市岳麓区橘子洲路168号",
        starLevel: 3,
        coverImage: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
        ]),
        priceStart: 168,
        description: "近橘子洲头，设计风格清新，适合年轻人和学生群体，性价比极高，步行可达岳麓山。",
        facilities: JSON.stringify(["免费WiFi", "公共休息区", "行李寄存", "自助早餐"]),
        roomTypes: JSON.stringify([
          { name: "大床房", price: 168, size: "22㎡" },
          { name: "双床房", price: 188, size: "24㎡" },
        ]),
        cancelPolicy: "入住前24小时可免费取消",
        tags: JSON.stringify(["近景区", "学生友好", "性价比", "设计感"]),
        status: "ONLINE",
        sortOrder: 85,
      },
      {
        name: "南京夫子庙秦淮河畔酒店",
        city: "南京",
        district: "秦淮区",
        address: "南京市秦淮区贡院街88号",
        starLevel: 4,
        coverImage: "https://images.unsplash.com/photo-1543968996-ee822b8176ba?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=800&q=80",
        ]),
        priceStart: 298,
        description: "紧邻夫子庙景区和秦淮河，感受六朝古都文化，步行可达老门东、中华门。",
        facilities: JSON.stringify(["免费WiFi", "停车场", "早餐", "茶室"]),
        roomTypes: JSON.stringify([
          { name: "标准双人房", price: 298, size: "28㎡" },
          { name: "河景大床房", price: 398, size: "32㎡" },
        ]),
        cancelPolicy: "入住前48小时可免费取消",
        tags: JSON.stringify(["古城风情", "四星", "近夫子庙", "文化游"]),
        status: "ONLINE",
        sortOrder: 80,
      },
      {
        name: "西安钟楼万达假日酒店",
        city: "西安",
        district: "碑林区",
        address: "西安市碑林区东大街298号",
        starLevel: 4,
        coverImage: "https://images.unsplash.com/photo-1559508551-44bff1de756b?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1587213811864-464e908c23ad?w=800&q=80",
        ]),
        priceStart: 318,
        description: "钟楼步行5分钟，地铁直达兵马俑，是西安旅游的绝佳落脚点，回民街美食近在咫尺。",
        facilities: JSON.stringify(["免费WiFi", "停车场", "早餐", "商务中心"]),
        roomTypes: JSON.stringify([
          { name: "标准大床房", price: 318, size: "30㎡" },
          { name: "城景套房", price: 588, size: "55㎡" },
        ]),
        cancelPolicy: "入住前24小时可免费取消",
        tags: JSON.stringify(["近钟楼", "地铁方便", "四星", "文化古迹"]),
        status: "ONLINE",
        sortOrder: 75,
      },
      {
        name: "上海外滩茂悦大酒店",
        city: "上海",
        district: "黄浦区",
        address: "上海市黄浦区外马路199号",
        starLevel: 5,
        coverImage: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
        ]),
        priceStart: 988,
        description: "俯瞰黄浦江与外滩万国建筑群，距南外滩仅数步之遥，奢华配置适合商务出行和高端度假。",
        facilities: JSON.stringify(["免费WiFi", "无边泳池", "米其林餐厅", "SPA", "停车场"]),
        roomTypes: JSON.stringify([
          { name: "外滩景大床房", price: 988, size: "42㎡" },
          { name: "江景豪华套房", price: 2888, size: "100㎡" },
        ]),
        cancelPolicy: "入住前48小时可免费取消",
        tags: JSON.stringify(["外滩", "五星奢华", "江景", "网红打卡"]),
        status: "ONLINE",
        sortOrder: 70,
      },
      {
        name: "北京王府井全季酒店",
        city: "北京",
        district: "东城区",
        address: "北京市东城区王府井大街138号",
        starLevel: 3,
        coverImage: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1631049552240-59c37f38802b?w=800&q=80",
        ]),
        priceStart: 328,
        description: "王府井商圈核心位置，地铁站旁，步行可达故宫、天安门，交通极为方便，性价比高。",
        facilities: JSON.stringify(["免费WiFi", "24h前台", "行李寄存", "早餐自助"]),
        roomTypes: JSON.stringify([
          { name: "大床房", price: 328, size: "26㎡" },
          { name: "双床房", price: 348, size: "28㎡" },
        ]),
        cancelPolicy: "入住前24小时可免费取消",
        tags: JSON.stringify(["近故宫", "王府井", "性价比", "地铁方便"]),
        status: "ONLINE",
        sortOrder: 65,
      },
      {
        name: "厦门鼓浪屿风情客栈",
        city: "厦门",
        district: "思明区",
        address: "厦门市思明区鼓浪屿笔山路22号",
        starLevel: 3,
        coverImage: "https://images.unsplash.com/photo-1535827841776-24afc1e255ac?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80",
        ]),
        priceStart: 238,
        description: "鼓浪屿岛上的百年老宅改建，保留南洋风格建筑，私人庭院，无车岛屿安静惬意。",
        facilities: JSON.stringify(["免费WiFi", "庭院", "行李寄存", "自助早餐"]),
        roomTypes: JSON.stringify([
          { name: "标准大床房", price: 238, size: "20㎡" },
          { name: "海景阳台房", price: 388, size: "26㎡" },
        ]),
        cancelPolicy: "入住前48小时可免费取消",
        tags: JSON.stringify(["鼓浪屿", "海岛", "文艺", "民宿风"]),
        status: "ONLINE",
        sortOrder: 60,
      },
      {
        name: "桂林漓江山水悦度假酒店",
        city: "桂林",
        district: "秀峰区",
        address: "桂林市秀峰区漓江路8号",
        starLevel: 4,
        coverImage: "https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
        ]),
        priceStart: 458,
        description: "坐拥漓江山水第一排视野，清晨从阳台看云雾漓江，乘竹筏游览阳朔近在眼前。",
        facilities: JSON.stringify(["免费WiFi", "无边泳池", "早餐", "竹筏接送"]),
        roomTypes: JSON.stringify([
          { name: "山水景大床房", price: 458, size: "35㎡" },
          { name: "漓江江景房", price: 688, size: "45㎡" },
        ]),
        cancelPolicy: "入住前48小时可免费取消",
        tags: JSON.stringify(["漓江", "山水", "度假", "情侣"]),
        status: "ONLINE",
        sortOrder: 55,
      },
    ],
  });
  console.log(`✅ 酒店数据: ${hotels.length} 条`);

  // ─── 机票数据 ────────────────────────────────────────────────────
  const flights = await prisma.flightDeal.createManyAndReturn({
    data: [
      { departureCity: "北京", arrivalCity: "成都", airline: "四川航空", cabinType: "经济舱", priceReference: 380, directFlag: true, description: "北京首都→成都天府，每日多班，飞行约2.5小时，早班性价比高", tags: JSON.stringify(["直飞", "热门", "特价"]), status: "ONLINE", sortOrder: 100 },
      { departureCity: "上海", arrivalCity: "重庆", airline: "重庆航空", cabinType: "经济舱", priceReference: 310, directFlag: true, description: "上海浦东→重庆江北，约2小时直飞，周末特价常有低至200元以下票", tags: JSON.stringify(["直飞", "特价", "周末推荐"]), status: "ONLINE", sortOrder: 95 },
      { departureCity: "广州", arrivalCity: "杭州", airline: "海南航空", cabinType: "经济舱", priceReference: 290, directFlag: true, description: "广州白云→杭州萧山，约1.5小时，是南北联动最热门路线之一", tags: JSON.stringify(["直飞", "热门"]), status: "ONLINE", sortOrder: 90 },
      { departureCity: "北京", arrivalCity: "西安", airline: "中国东方航空", cabinType: "经济舱", priceReference: 260, directFlag: true, description: "北京首都→西安咸阳，约1.5小时，适合快速往返", tags: JSON.stringify(["直飞", "短途"]), status: "ONLINE", sortOrder: 85 },
      { departureCity: "成都", arrivalCity: "三亚", airline: "三亚航空", cabinType: "经济舱", priceReference: 420, directFlag: true, description: "冬季保暖逃逸特价，成都双流→三亚凤凰，约2.5小时", tags: JSON.stringify(["直飞", "冬季热门", "海岛"]), status: "ONLINE", sortOrder: 80 },
      { departureCity: "上海", arrivalCity: "厦门", airline: "厦门航空", cabinType: "经济舱", priceReference: 270, directFlag: true, description: "上海虹桥→厦门高崎，约1.5小时，厦航直飞性价比高", tags: JSON.stringify(["直飞", "厦航优选"]), status: "ONLINE", sortOrder: 75 },
      { departureCity: "北京", arrivalCity: "桂林", airline: "桂林航空", cabinType: "经济舱", priceReference: 450, directFlag: false, description: "北京出发前往桂林，中转长沙，全程约4小时，价格比直飞优惠40%", tags: JSON.stringify(["中转", "省钱", "山水之旅"]), status: "ONLINE", sortOrder: 70 },
      { departureCity: "成都", arrivalCity: "北京", airline: "中国国际航空", cabinType: "商务舱", priceReference: 1680, directFlag: true, description: "成都→北京商务舱，宽敞舒适，适合出差人士，含餐食优先登机", tags: JSON.stringify(["直飞", "商务舱", "出差"]), status: "ONLINE", sortOrder: 65 },
      { departureCity: "南京", arrivalCity: "成都", airline: "四川航空", cabinType: "经济舱", priceReference: 350, directFlag: true, description: "南京禄口→成都天府，约2.5小时直飞，节假日提前购更划算", tags: JSON.stringify(["直飞", "节假日推荐"]), status: "ONLINE", sortOrder: 60 },
      { departureCity: "武汉", arrivalCity: "三亚", airline: "海南航空", cabinType: "经济舱", priceReference: 480, directFlag: true, description: "冬季南逃热门路线，武汉天河→三亚凤凰，约2小时直飞", tags: JSON.stringify(["直飞", "冬季热门"]), status: "ONLINE", sortOrder: 55 },
    ],
  });
  console.log(`✅ 机票数据: ${flights.length} 条`);

  // ─── 高铁数据 ────────────────────────────────────────────────────
  const trains = await prisma.trainDeal.createManyAndReturn({
    data: [
      { departureCity: "上海", arrivalCity: "南京", seatType: "二等座", priceReference: 69, description: "沪宁线高频次，全程约1小时，周末往返非常方便", tags: JSON.stringify(["高频", "短途", "性价比"]), status: "ONLINE", sortOrder: 100 },
      { departureCity: "北京", arrivalCity: "上海", seatType: "二等座", priceReference: 553, description: "京沪高铁标杆线路，全程约4.5小时，每日数十班次", tags: JSON.stringify(["京沪", "热门", "快速"]), status: "ONLINE", sortOrder: 95 },
      { departureCity: "成都", arrivalCity: "重庆", seatType: "二等座", priceReference: 106, description: "成渝线40分钟即可抵达，是中国最繁忙的高铁线路之一", tags: JSON.stringify(["超短途", "成渝", "高频"]), status: "ONLINE", sortOrder: 90 },
      { departureCity: "北京", arrivalCity: "西安", seatType: "一等座", priceReference: 515, description: "京西高铁舒适出行，一等座宽敞，全程约5小时", tags: JSON.stringify(["一等座", "舒适", "长途"]), status: "ONLINE", sortOrder: 85 },
      { departureCity: "杭州", arrivalCity: "长沙", seatType: "二等座", priceReference: 298, description: "沪昆高铁，全程约2.5小时，是长三角到湘粤的热门线路", tags: JSON.stringify(["中途", "热门"]), status: "ONLINE", sortOrder: 80 },
      { departureCity: "武汉", arrivalCity: "广州", seatType: "二等座", priceReference: 463, description: "武广高铁约3.5小时，是中部到华南的主力交通方式", tags: JSON.stringify(["武广", "重要线路"]), status: "ONLINE", sortOrder: 75 },
      { departureCity: "北京", arrivalCity: "天津", seatType: "二等座", priceReference: 54, description: "京津城际超高频，30分钟直达，适合一日游", tags: JSON.stringify(["超短途", "高频", "一日游"]), status: "ONLINE", sortOrder: 70 },
      { departureCity: "上海", arrivalCity: "杭州", seatType: "二等座", priceReference: 78, description: "沪杭半小时，周末出游首选，班次密集方便灵活", tags: JSON.stringify(["热门", "半小时", "周末出游"]), status: "ONLINE", sortOrder: 65 },
      { departureCity: "成都", arrivalCity: "西安", seatType: "一等座", priceReference: 349, description: "成西高铁全程约3小时，穿越秦岭美景，适合欣赏沿途风光", tags: JSON.stringify(["景观路线", "推荐"]), status: "ONLINE", sortOrder: 60 },
      { departureCity: "南京", arrivalCity: "武汉", seatType: "商务座", priceReference: 820, description: "宁汉线商务座，宽敞豪华，全程约2小时，适合出差商务人士", tags: JSON.stringify(["商务座", "出差"]), status: "ONLINE", sortOrder: 55 },
    ],
  });
  console.log(`✅ 高铁数据: ${trains.length} 条`);

  // ─── 线路数据 ────────────────────────────────────────────────────
  const routes = await prisma.routePackage.createManyAndReturn({
    data: [
      {
        title: "成都·重庆双城5日4晚特惠套餐",
        subtitle: "火锅+麻辣+洪崖洞，川渝文化深度游",
        departureCity: "上海",
        destinationCity: "成都/重庆",
        days: 5,
        nights: 4,
        coverImage: "https://images.unsplash.com/photo-1590246814883-57c511e470aa?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80",
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
        ]),
        price: 3980,
        discountPrice: 2980,
        routeType: "经典观光",
        description: "川渝联游，涵盖成都宽窄巷子、锦里、都江堰，重庆洪崖洞、解放碑、磁器口，打卡网红景点，体验麻辣美食文化。",
        itinerary: JSON.stringify([
          { day: 1, title: "抵达成都", content: "抵达成都，入住酒店，晚上游览宽窄巷子，品尝串串香" },
          { day: 2, title: "成都全天", content: "上午大熊猫基地，下午锦里古街，晚上品尝正宗四川火锅" },
          { day: 3, title: "成都→都江堰", content: "上午都江堰水利工程，下午青城山，返回成都" },
          { day: 4, title: "成都→重庆", content: "高铁前往重庆，游览洪崖洞、解放碑步行街" },
          { day: 5, title: "重庆→返程", content: "上午磁器口古镇，下午乘机返回" },
        ]),
        includeItems: JSON.stringify(["往返机票", "4晚酒店（早餐）", "景区门票", "专属导游", "接送机服务"]),
        excludeItems: JSON.stringify(["个人消费", "自选餐费", "签证（如需）"]),
        notice: "出发前请确认身份证有效期，儿童需提供户口本",
        tags: JSON.stringify(["热门", "学生推荐", "网红打卡", "美食之旅"]),
        status: "ONLINE",
        sortOrder: 100,
        startTime: new Date("2025-01-01"),
        endTime: new Date("2025-12-31"),
      },
      {
        title: "张家界·凤凰古城4日3晚精品游",
        subtitle: "天门山玻璃栈道+苗族风情，惊险与文化的完美融合",
        departureCity: "全国",
        destinationCity: "张家界",
        days: 4,
        nights: 3,
        coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
        ]),
        price: 3280,
        discountPrice: 2480,
        routeType: "自然风光",
        description: "游览张家界国家森林公园、天门山、黄龙洞，再赴凤凰古城感受苗族文化，沿沱江古城灯火阑珊。",
        itinerary: JSON.stringify([
          { day: 1, title: "抵达张家界", content: "抵达后入住，晚上游览张家界市区" },
          { day: 2, title: "张家界国家森林公园", content: "全天游览袁家界、十里画廊、黄石寨" },
          { day: 3, title: "天门山+凤凰古城", content: "上午天门山索道玻璃栈道，下午前往凤凰古城" },
          { day: 4, title: "凤凰古城→返程", content: "沱江泛舟，游历古城后踏上归途" },
        ]),
        includeItems: JSON.stringify(["往返高铁/机票", "3晚酒店（早餐）", "景区门票", "专车接送"]),
        excludeItems: JSON.stringify(["个人消费", "午晚餐", "玻璃栈道门票（可选购）"]),
        notice: "天门山玻璃栈道对身体条件有一定要求，心脏病患者请注意",
        tags: JSON.stringify(["自然", "周末精选", "情侣推荐", "刺激"]),
        status: "ONLINE",
        sortOrder: 95,
        startTime: new Date("2025-01-01"),
        endTime: new Date("2025-12-31"),
      },
      {
        title: "西安古都历史文化3日游",
        subtitle: "兵马俑+华清宫+回民街，穿越千年帝都",
        departureCity: "全国",
        destinationCity: "西安",
        days: 3,
        nights: 2,
        coverImage: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1526130672714-e3af9b5e6d5f?w=800&q=80",
        ]),
        price: 2380,
        discountPrice: 1680,
        routeType: "历史文化",
        description: "深度游览西安十三朝古都精华，兵马俑震撼人心，大唐不夜城繁华再现，回民街美食飘香。",
        itinerary: JSON.stringify([
          { day: 1, title: "抵达西安", content: "抵达入住，下午游览钟鼓楼、回民街，晚上大唐不夜城" },
          { day: 2, title: "兵马俑+华清宫", content: "上午秦始皇帝陵博物院，下午华清宫，晚上城墙骑行" },
          { day: 3, title: "陕西历史博物馆→返程", content: "上午陕西历史博物馆，午后返程" },
        ]),
        includeItems: JSON.stringify(["往返交通", "2晚四星酒店", "景区门票", "导游服务"]),
        excludeItems: JSON.stringify(["个人消费", "餐费", "西安博物馆院内参观车（可选）"]),
        notice: "兵马俑景区禁止携带危险物品入内",
        tags: JSON.stringify(["历史", "文化", "学生推荐", "节假日热门"]),
        status: "ONLINE",
        sortOrder: 90,
        startTime: new Date("2025-01-01"),
        endTime: new Date("2025-12-31"),
      },
      {
        title: "三亚·亚龙湾5日4晚海岛度假",
        subtitle: "碧海蓝天+深潜浮潜，冬季逃暖首选",
        departureCity: "全国",
        destinationCity: "三亚",
        days: 5,
        nights: 4,
        coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80",
          "https://images.unsplash.com/photo-1468413253578-31b27ec9285f?w=800&q=80",
        ]),
        price: 5980,
        discountPrice: 4280,
        routeType: "海岛度假",
        description: "入住三亚一线海景酒店，畅享亚龙湾/天涯海角/蜈支洲岛海上运动，深潜浮潜均可安排。",
        itinerary: JSON.stringify([
          { day: 1, title: "抵达三亚", content: "抵达后入住一线海景酒店，享受下午茶时光" },
          { day: 2, title: "蜈支洲岛", content: "游览蜈支洲岛，参与浮潜/深潜体验" },
          { day: 3, title: "亚龙湾", content: "亚龙湾海滩自由活动，可选购水上活动项目" },
          { day: 4, title: "天涯海角+南山文化苑", content: "天涯海角观光，南山寺祈福" },
          { day: 5, title: "自由活动→返程", content: "上午自由购物，下午返程" },
        ]),
        includeItems: JSON.stringify(["往返机票", "4晚一线海景酒店（早餐）", "景区门票", "接送机"]),
        excludeItems: JSON.stringify(["水上活动项目（可选购）", "午晚餐", "个人消费"]),
        notice: "浮潜/深潜需提前预约，不会游泳者请告知",
        tags: JSON.stringify(["海岛", "情侣", "家庭", "冬季热门"]),
        status: "ONLINE",
        sortOrder: 85,
        startTime: new Date("2024-11-01"),
        endTime: new Date("2025-03-31"),
      },
      {
        title: "杭州·西湖·乌镇3日周末精选",
        subtitle: "江南水乡+西子湖畔，最美周末出游",
        departureCity: "上海/北京",
        destinationCity: "杭州",
        days: 3,
        nights: 2,
        coverImage: "https://images.unsplash.com/photo-1574236170878-97f5c485a5e2?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80",
        ]),
        price: 1980,
        discountPrice: 1480,
        routeType: "周末短途",
        description: "游西湖断桥荷花，住河坊街精品民宿，再去乌镇水乡感受江南古镇晨雾之美。",
        itinerary: JSON.stringify([
          { day: 1, title: "抵达杭州", content: "到达杭州，游览西湖、断桥残雪、雷峰塔，晚上河坊街美食" },
          { day: 2, title: "乌镇古镇", content: "前往乌镇，游览东栅西栅，体验水乡风情" },
          { day: 3, title: "灵隐寺→返程", content: "上午灵隐寺祈福，逛茶叶市场，下午返程" },
        ]),
        includeItems: JSON.stringify(["往返高铁", "2晚精品民宿", "西湖游船票", "乌镇门票"]),
        excludeItems: JSON.stringify(["餐费", "个人消费"]),
        notice: "乌镇旺季建议提前购票",
        tags: JSON.stringify(["周末精选", "学生推荐", "情侣", "江南水乡"]),
        status: "ONLINE",
        sortOrder: 80,
        startTime: new Date("2025-01-01"),
        endTime: new Date("2025-12-31"),
      },
      {
        title: "云南大理·丽江·香格里拉8日深度游",
        subtitle: "苍山洱海+纳西文化+高原圣地",
        departureCity: "全国",
        destinationCity: "大理/丽江",
        days: 8,
        nights: 7,
        coverImage: "https://images.unsplash.com/photo-1470217957101-da7150b9d681?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=800&q=80",
          "https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80",
        ]),
        price: 7980,
        discountPrice: 5980,
        routeType: "深度游",
        description: "云南精华三城深度游，苍山洱海骑行，丽江古城酒吧街，香格里拉独克宗古城，高原转山祈福。",
        itinerary: JSON.stringify([
          { day: 1, title: "抵达大理", content: "抵达大理，入住古城民宿" },
          { day: 2, title: "苍山洱海", content: "洱海环岛骑行，游览双廊古镇" },
          { day: 3, title: "大理古城", content: "参观大理崇圣寺三塔，游览大理古城" },
          { day: 4, title: "大理→丽江", content: "前往丽江，游览古城四方街" },
          { day: 5, title: "玉龙雪山", content: "游览玉龙雪山，参加纳西文化体验" },
          { day: 6, title: "丽江→香格里拉", content: "前往香格里拉，游览独克宗古城" },
          { day: 7, title: "普达措国家公园", content: "游览普达措，感受高原原始风光" },
          { day: 8, title: "返程", content: "抵达昆明后飞回出发地" },
        ]),
        includeItems: JSON.stringify(["往返机票", "7晚精选酒店/民宿", "景区门票", "专业导游", "包车服务"]),
        excludeItems: JSON.stringify(["餐费", "个人消费", "高原反应药物"]),
        notice: "香格里拉海拔3300米，请提前备好高原反应药物",
        tags: JSON.stringify(["深度游", "自然", "文化", "打卡圣地"]),
        status: "ONLINE",
        sortOrder: 75,
        startTime: new Date("2025-04-01"),
        endTime: new Date("2025-10-31"),
      },
      {
        title: "北京故宫·长城·颐和园4日经典游",
        subtitle: "皇城根下，感受中华文明五千年",
        departureCity: "全国",
        destinationCity: "北京",
        days: 4,
        nights: 3,
        coverImage: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1523112784166-c04db3a3bb7c?w=800&q=80",
        ]),
        price: 3280,
        discountPrice: 2380,
        routeType: "历史文化",
        description: "北京精华四日，游览天安门广场、故宫博物院、八达岭长城、颐和园，体验帝都皇城文化。",
        itinerary: JSON.stringify([
          { day: 1, title: "抵达北京", content: "抵达北京，游览天安门广场，王府井购物" },
          { day: 2, title: "故宫+景山", content: "全天游览故宫博物院，登景山俯瞰故宫全景" },
          { day: 3, title: "八达岭长城", content: "上午八达岭长城，下午明十三陵定陵" },
          { day: 4, title: "颐和园→返程", content: "上午颐和园昆明湖游船，下午前往机场/火车站" },
        ]),
        includeItems: JSON.stringify(["往返交通", "3晚四星酒店（早餐）", "景区门票", "专属导游"]),
        excludeItems: JSON.stringify(["午晚餐", "个人消费"]),
        notice: "故宫参观需提前网上预约，请配合安检要求",
        tags: JSON.stringify(["历史文化", "家庭", "亲子", "节假日热门"]),
        status: "ONLINE",
        sortOrder: 70,
        startTime: new Date("2025-01-01"),
        endTime: new Date("2025-12-31"),
      },
      {
        title: "厦门·鼓浪屿·土楼精品4日游",
        subtitle: "海岛文艺+客家土楼，闽南味道最完整体验",
        departureCity: "全国",
        destinationCity: "厦门",
        days: 4,
        nights: 3,
        coverImage: "https://images.unsplash.com/photo-1547637589-f54c34f5d7a4?w=800&q=80",
        galleryImages: JSON.stringify([
          "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
        ]),
        price: 2880,
        discountPrice: 2180,
        routeType: "休闲度假",
        description: "厦大校园漫步，鼓浪屿岛上骑行，南靖土楼世界文化遗产，集美嘉庚建筑风格大观。",
        itinerary: JSON.stringify([
          { day: 1, title: "抵达厦门", content: "到达厦门，游览厦大校园，曾厝垵文艺村" },
          { day: 2, title: "鼓浪屿全天", content: "乘轮渡至鼓浪屿，骑行探岛，体验钢琴岛音乐" },
          { day: 3, title: "南靖土楼", content: "专车前往南靖土楼，世界遗产深度游览" },
          { day: 4, title: "集美→返程", content: "集美嘉庚建筑群，在厦门南站乘车返程" },
        ]),
        includeItems: JSON.stringify(["往返机票/高铁", "3晚酒店（早餐）", "鼓浪屿船票", "土楼门票", "包车服务"]),
        excludeItems: JSON.stringify(["午晚餐", "个人消费"]),
        notice: "鼓浪屿为无车岛屿，请轻装前往",
        tags: JSON.stringify(["文艺", "周末精选", "情侣", "世界遗产"]),
        status: "ONLINE",
        sortOrder: 65,
        startTime: new Date("2025-01-01"),
        endTime: new Date("2025-12-31"),
      },
    ],
  });
  console.log(`✅ 线路数据: ${routes.length} 条`);

  // ─── 需求单数据 ──────────────────────────────────────────────────
  const user1 = users[0];
  const user2 = users[1];
  const user3 = users[2];
  const serviceAdmin = admins.find(a => a.role === "SUPPORT");

  const leads = await prisma.lead.createManyAndReturn({
    data: [
      {
        userId: user1.id,
        type: "CUSTOM",
        name: "张小明",
        phone: "13900000001",
        wechat: "zhangxiaoming2024",
        fromCity: "上海",
        toCity: "成都",
        departDate: new Date("2025-05-01"),
        returnDate: new Date("2025-05-05"),
        peopleCount: 4,
        budgetMin: 2000,
        budgetMax: 3000,
        requestTypes: JSON.stringify(["HOTEL", "FLIGHT"]),
        hotelNeeds: JSON.stringify({ budget: 200, type: "大床房", district: "近地铁" }),
        notes: "宿舍四人出游，学生党，预算有限，酒店要有地铁直达市区",
        status: "NEW",
        assignedStaffId: serviceAdmin?.id,
        sourceChannel: "官网",
      },
      {
        userId: user2.id,
        type: "ROUTE",
        name: "李旅游",
        phone: "13900000002",
        wechat: "liyoutravel",
        fromCity: "北京",
        toCity: "西安",
        departDate: new Date("2025-04-25"),
        returnDate: new Date("2025-04-28"),
        peopleCount: 2,
        budgetMin: 3000,
        budgetMax: 5000,
        requestTypes: JSON.stringify(["HOTEL", "TRAIN", "ROUTE"]),
        notes: "情侣出行，想看兵马俑，预算不超过5000，酒店要有设计感",
        status: "CONTACTED",
        assignedStaffId: serviceAdmin?.id,
        lastFollowUpAt: new Date("2025-04-20"),
        sourceChannel: "官网",
      },
      {
        userId: user3.id,
        type: "HOTEL",
        name: "王出游",
        phone: "13900000003",
        wechat: "wangchuanyou",
        fromCity: "南京",
        toCity: "杭州",
        departDate: new Date("2025-05-15"),
        returnDate: new Date("2025-05-17"),
        peopleCount: 1,
        budgetMin: 300,
        budgetMax: 500,
        requestTypes: JSON.stringify(["HOTEL"]),
        hotelNeeds: JSON.stringify({ budget: 350, type: "大床房", district: "西湖边", nearSubway: true }),
        notes: "一个人去杭州，想住西湖附近有设计感的酒店，预算350左右",
        status: "PLANNING",
        assignedStaffId: serviceAdmin?.id,
        lastFollowUpAt: new Date("2025-04-22"),
        sourceChannel: "官网",
      },
      {
        type: "FLIGHT",
        name: "陈游客",
        phone: "13811111111",
        fromCity: "广州",
        toCity: "三亚",
        departDate: new Date("2025-07-01"),
        returnDate: new Date("2025-07-07"),
        peopleCount: 3,
        budgetMin: 4000,
        budgetMax: 6000,
        requestTypes: JSON.stringify(["FLIGHT", "HOTEL"]),
        notes: "三口之家暑期三亚游，孩子8岁，需要家庭房或相邻两间",
        status: "QUOTED",
        sourceChannel: "官网",
      },
      {
        type: "TRAIN",
        name: "刘同学",
        phone: "15500000001",
        fromCity: "武汉",
        toCity: "长沙",
        departDate: new Date("2025-05-10"),
        peopleCount: 6,
        budgetMin: 1000,
        budgetMax: 2000,
        requestTypes: JSON.stringify(["TRAIN", "HOTEL"]),
        notes: "大学宿舍六人五一出游，预算每人300以内，高铁+经济酒店",
        status: "CONVERTED",
        sourceChannel: "官网",
      },
      {
        type: "CUSTOM",
        name: "赵商务",
        phone: "13600000001",
        fromCity: "北京",
        toCity: "上海",
        departDate: new Date("2025-04-30"),
        returnDate: new Date("2025-05-02"),
        peopleCount: 1,
        budgetMin: 5000,
        budgetMax: 10000,
        requestTypes: JSON.stringify(["FLIGHT", "HOTEL"]),
        notes: "商务出行，需要商务舱机票和五星酒店，有发票要求",
        status: "CONTACTED",
        sourceChannel: "官网",
      },
      {
        type: "ROUTE",
        name: "孙女士",
        phone: "15800000001",
        fromCity: "成都",
        toCity: "云南",
        departDate: new Date("2025-08-01"),
        returnDate: new Date("2025-08-10"),
        peopleCount: 5,
        budgetMin: 15000,
        budgetMax: 25000,
        requestTypes: JSON.stringify(["FLIGHT", "HOTEL", "ROUTE"]),
        notes: "家庭五口，带两位老人和一个小孩，云南全程定制，老人需要无障碍服务",
        status: "NEW",
        sourceChannel: "官网",
      },
      {
        type: "HOTEL",
        name: "黄学生",
        phone: "13700000001",
        fromCity: "郑州",
        toCity: "重庆",
        departDate: new Date("2025-06-20"),
        returnDate: new Date("2025-06-22"),
        peopleCount: 2,
        budgetMin: 400,
        budgetMax: 600,
        requestTypes: JSON.stringify(["HOTEL"]),
        notes: "毕业旅行，两个同学，想住洪崖洞附近，预算200/人/晚",
        status: "PENDING_CONTACT",
        sourceChannel: "官网",
      },
    ],
  });
  console.log(`✅ 需求单数据: ${leads.length} 条`);

  // ─── 订单数据 ────────────────────────────────────────────────────
  function orderNo() {
    return "LYT" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  }

  const orderAdmin = admins.find(a => a.role === "ORDER");
  const convertedLead = leads.find(l => l.status === "CONVERTED");

  await prisma.order.createMany({
    data: [
      {
        orderNo: orderNo(),
        userId: user1.id,
        leadId: convertedLead?.id,
        orderType: "HOTEL",
        productId: hotels[0].id,
        productName: hotels[0].name,
        amount: 1164,
        costAmount: 900,
        grossProfit: 264,
        paymentStatus: "PAID",
        orderStatus: "COMPLETED",
        serviceStaffId: orderAdmin?.id,
        travelDate: new Date("2025-04-15"),
        remark: "3晚标准大床房，客户满意度高",
      },
      {
        orderNo: orderNo(),
        userId: user2.id,
        orderType: "ROUTE",
        productId: routes[0].id,
        productName: routes[0].title,
        amount: 5960,
        costAmount: 4500,
        grossProfit: 1460,
        paymentStatus: "PAID",
        orderStatus: "PROCESSING",
        serviceStaffId: orderAdmin?.id,
        travelDate: new Date("2025-05-01"),
        remark: "成都重庆双城游，2人成行",
      },
      {
        orderNo: orderNo(),
        userId: user3.id,
        orderType: "FLIGHT",
        productId: flights[0].id,
        productName: "北京→成都 四川航空 经济舱",
        amount: 760,
        costAmount: 600,
        grossProfit: 160,
        paymentStatus: "PAID",
        orderStatus: "COMPLETED",
        serviceStaffId: orderAdmin?.id,
        travelDate: new Date("2025-04-10"),
      },
      {
        orderNo: orderNo(),
        userId: user1.id,
        orderType: "TRAIN",
        productId: trains[0].id,
        productName: "上海→南京 二等座 2人",
        amount: 138,
        costAmount: 110,
        grossProfit: 28,
        paymentStatus: "PAID",
        orderStatus: "COMPLETED",
        travelDate: new Date("2025-04-05"),
      },
      {
        orderNo: orderNo(),
        userId: user2.id,
        orderType: "HOTEL",
        productId: hotels[2].id,
        productName: hotels[2].name,
        amount: 2094,
        costAmount: 1600,
        grossProfit: 494,
        paymentStatus: "UNPAID",
        orderStatus: "PENDING_PAYMENT",
        serviceStaffId: orderAdmin?.id,
        travelDate: new Date("2025-05-20"),
        remark: "3晚西湖景大床房，等待客户付款",
      },
      {
        orderNo: orderNo(),
        userId: user3.id,
        orderType: "ROUTE",
        productId: routes[4].id,
        productName: routes[4].title,
        amount: 2960,
        costAmount: 2200,
        grossProfit: 760,
        paymentStatus: "PAID",
        orderStatus: "CANCELLED",
        travelDate: new Date("2025-04-20"),
        remark: "客户因故取消，已全额退款",
      },
      {
        orderNo: orderNo(),
        userId: user1.id,
        orderType: "ROUTE",
        productId: routes[2].id,
        productName: routes[2].title,
        amount: 3360,
        costAmount: 2600,
        grossProfit: 760,
        paymentStatus: "PAID",
        orderStatus: "PAID",
        serviceStaffId: orderAdmin?.id,
        travelDate: new Date("2025-05-03"),
        remark: "西安古都3日游，2人，等待出发",
      },
      {
        orderNo: orderNo(),
        userId: user2.id,
        orderType: "HOTEL",
        productId: hotels[6].id,
        productName: hotels[6].name,
        amount: 1976,
        costAmount: 1500,
        grossProfit: 476,
        paymentStatus: "PAID",
        orderStatus: "AFTERSALE",
        serviceStaffId: orderAdmin?.id,
        travelDate: new Date("2025-04-08"),
        remark: "客户反映房间噪音问题，正在处理中",
      },
    ],
  });
  console.log("✅ 订单数据: 8 条");

  // ─── 反馈数据 ────────────────────────────────────────────────────
  const handledAdmin = admins.find(a => a.role === "SUPPORT");
  await prisma.feedback.createMany({
    data: [
      {
        userId: user1.id,
        feedbackType: "REVIEW",
        title: "成都行程安排得非常好",
        content: "顾问小李非常专业，酒店推荐很合适，交通安排也很顺畅，朋友们都说值！",
        needCallback: false,
        status: "CLOSED",
        replyContent: "感谢您的支持！期待下次为您服务！",
        handledById: handledAdmin?.id,
        handledAt: new Date("2025-04-18"),
      },
      {
        userId: user2.id,
        feedbackType: "COMPLAINT",
        title: "外滩酒店与宣传不符",
        content: "酒店说有江景，但实际上我的房间根本看不到江，感觉被坑了，希望平台核实。",
        images: JSON.stringify(["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"]),
        needCallback: true,
        status: "PROCESSING",
        replyContent: "您好，我们已核实情况并与酒店沟通，酒店方表示将安排换房，如有问题请联系我们客服。",
        handledById: handledAdmin?.id,
        handledAt: new Date("2025-04-22"),
      },
      {
        userId: user3.id,
        feedbackType: "SUGGESTION",
        title: "建议增加学生专属折扣",
        content: "作为大学生，平台如果能提供学生证认证后的额外折扣就更好了！",
        needCallback: false,
        status: "REPLIED",
        replyContent: "感谢您的宝贵建议！我们正在规划学生专属权益体系，请持续关注平台公告。",
        handledById: handledAdmin?.id,
        handledAt: new Date("2025-04-20"),
      },
      {
        userId: user1.id,
        feedbackType: "SUGGESTION",
        title: "希望增加西藏线路",
        content: "平台现在没有西藏方向的线路，很多同学想去布达拉宫，能上架吗？",
        needCallback: false,
        status: "UNPROCESSED",
      },
      {
        userId: user2.id,
        feedbackType: "REVIEW",
        title: "张家界行程服务棒",
        content: "全程导游非常耐心，玻璃栈道体验太刺激了！下次还选旅途！",
        needCallback: false,
        status: "CLOSED",
        replyContent: "非常感谢！欢迎下次再来！",
        handledById: handledAdmin?.id,
        handledAt: new Date("2025-04-15"),
      },
      {
        userId: user3.id,
        feedbackType: "COMPLAINT",
        title: "预订流程不够顺畅",
        content: "提交需求后一直没人联系，等了2天才有顾问跟进，建议改进响应速度。",
        needCallback: true,
        status: "REPLIED",
        replyContent: "非常抱歉给您带来不好的体验！我们已优化工单分配流程，承诺4小时内响应。",
        handledById: handledAdmin?.id,
        handledAt: new Date("2025-04-21"),
      },
    ],
  });
  console.log("✅ 反馈数据: 6 条");

  // ─── 收藏数据 ────────────────────────────────────────────────────
  await prisma.favorite.createMany({
    data: [
      { userId: user1.id, productType: "HOTEL", productId: hotels[0].id },
      { userId: user1.id, productType: "HOTEL", productId: hotels[3].id },
      { userId: user1.id, productType: "ROUTE", productId: routes[0].id },
      { userId: user2.id, productType: "HOTEL", productId: hotels[2].id },
      { userId: user2.id, productType: "ROUTE", productId: routes[1].id },
      { userId: user2.id, productType: "ROUTE", productId: routes[5].id },
      { userId: user3.id, productType: "HOTEL", productId: hotels[8].id },
      { userId: user3.id, productType: "ROUTE", productId: routes[4].id },
    ],
  });
  console.log("✅ 收藏数据: 8 条");

  // ─── 消息通知数据 ────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: user1.id, title: "您的需求已收到", content: "您提交的成都出行需求已收到，顾问将在24小时内与您联系。", type: "SYSTEM", isRead: false },
      { userId: user1.id, title: "订单状态更新", content: "您的订单（成都IFS精品酒店，3晚）已确认完成，欢迎评价！", type: "ORDER", isRead: true },
      { userId: user1.id, title: "五一特惠活动上线", content: "五一黄金周热门线路特惠，限量名额，先到先得！点击查看详情。", type: "ACTIVITY", isRead: false },
      { userId: user2.id, title: "您的反馈已回复", content: "您关于外滩酒店的反馈，客服已给出处理方案，请查看。", type: "FEEDBACK", isRead: false },
      { userId: user2.id, title: "订单状态更新", content: "您的西安古都3日游订单已进入处理中状态，出行前顾问将联系确认行程。", type: "ORDER", isRead: true },
      { userId: user3.id, title: "欢迎注册旅途", content: "感谢注册旅途！填写您的出行需求，我们的专属顾问随时待命。", type: "SYSTEM", isRead: true },
      { userId: user3.id, title: "您的需求有新进展", content: "您提交的杭州酒店需求，顾问已为您筛选出3套方案，请查看详情。", type: "SYSTEM", isRead: false },
    ],
  });
  console.log("✅ 通知数据: 7 条");

  // ─── Banner 数据 ─────────────────────────────────────────────────
  await prisma.homeBanner.createMany({
    data: [
      { title: "五一黄金周特惠出发", subtitle: "热门线路立减最高1000元，名额有限", imageUrl: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80", linkUrl: "/routes", status: "ONLINE", sortOrder: 100 },
      { title: "暑期早鸟价开抢", subtitle: "提前锁定7-8月黄金假期，享全年最低价", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80", linkUrl: "/routes", status: "ONLINE", sortOrder: 90 },
      { title: "学生专属优惠来袭", subtitle: "凭学生证核验，享额外9折优惠", imageUrl: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&q=80", linkUrl: "/request", status: "ONLINE", sortOrder: 80 },
    ],
  });
  console.log("✅ Banner数据: 3 条");

  // ─── 活动数据 ────────────────────────────────────────────────────
  await prisma.activity.createMany({
    data: [
      { title: "五一假期特惠专题", subtitle: "全国热门线路五一出发专属折扣", coverImage: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80", startTime: new Date("2025-04-25"), endTime: new Date("2025-05-05"), status: "ONLINE", sortOrder: 100, productRefs: JSON.stringify([routes[0].id, routes[1].id, routes[2].id]) },
      { title: "暑假出行早鸟计划", subtitle: "7-8月出行立即锁定，享早鸟价", coverImage: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80", startTime: new Date("2025-05-01"), endTime: new Date("2025-06-30"), status: "ONLINE", sortOrder: 90, productRefs: JSON.stringify([routes[3].id, routes[5].id]) },
      { title: "冬季逃暖·南方温暖游", subtitle: "三亚·厦门·广州暖冬特惠", coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80", startTime: new Date("2024-11-01"), endTime: new Date("2025-02-28"), status: "OFFLINE", sortOrder: 70, productRefs: JSON.stringify([routes[3].id]) },
    ],
  });
  console.log("✅ 活动数据: 3 条");

  // ─── 旅途酒店 CRM · 系统设置 ───────────────────────────────────
  await prisma.siteSetting.createMany({
    data: [
      { key: "hotel.wechatId", value: "", description: "客服微信号（待配置）" },
      { key: "hotel.qrUrl", value: "", description: "客服二维码图片 URL" },
      { key: "hotel.webhookUrl", value: "", description: "新线索通知 Webhook（企业微信/飞书）" },
      { key: "hotel.heroTitle", value: "旅行出发前，先让旅途帮你查一版更划算的方案", description: "首页主标题（可选覆盖）" },
      { key: "hotel.privacyText", value: "提交后仅用于酒店询价和客服沟通，不会公开你的个人信息。", description: "表单底部隐私提示" },
      { key: "hotel.autoAssign", value: "off", description: "新线索自动分配：off / round_robin" },
    ],
  });
  console.log("✅ 系统设置: 6 条");

  // ─── 旅途酒店 CRM · 线索数据 ───────────────────────────────────
  const supportAdmins = admins.filter(a => a.role === "SUPPORT");
  const xiaoZhou = admins.find(a => a.realName === "小周");
  const xiaoLin = admins.find(a => a.realName === "小林");
  const xiaoLi = admins.find(a => a.realName === "客服小李");

  function dt(/** @type {number} */ daysFromNow, /** @type {number} */ hour = 12) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, 0, 0, 0);
    return d;
  }
  function leadNo(/** @type {number} */ idx) {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    return `LT${ymd}${String(idx + 1).padStart(4, "0")}`;
  }
  function nightsBetween(/** @type {Date} */ start, /** @type {Date} */ end) {
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  }

  const hotelLeadSeed = [
    { destination: "三亚",       checkIn: dt(7),   checkOut: dt(10),  rooms: "1间",       guests: "2人",        budget: "500-800元/晚",   prefs: ["海景房", "含早餐", "可取消"], contact: "WECHAT", value: "tina_summer", remark: "想住亚龙湾边，海景房，2大人，孩子小不算人头",       status: "NEW",        assignTo: null,           src: "官网首页" },
    { destination: "上海迪士尼", checkIn: dt(14),  checkOut: dt(16),  rooms: "1间",       guests: "3-4人",      budget: "800-1500元/晚",  prefs: ["亲子友好", "近地铁", "含早餐"], contact: "MOBILE", value: "13900110001", remark: "一家三口，孩子5岁，想住园区附近，玩两天",       status: "NEW",        assignTo: null,           src: "小红书" },
    { destination: "香港",       checkIn: dt(20),  checkOut: dt(23),  rooms: "2间",       guests: "3-4人",      budget: "500-800元/晚",   prefs: ["位置方便", "近地铁"], contact: "WECHAT", value: "lily_hk_2025", remark: "三大一小，希望两间相邻，铜锣湾或尖沙咀都行",     status: "ADDED",      assignTo: xiaoZhou?.id,   src: "微信群" },
    { destination: "澳门",       checkIn: dt(5),   checkOut: dt(7),   rooms: "1间",       guests: "2人",        budget: "800-1500元/晚",  prefs: ["位置方便", "高星酒店"], contact: "WECHAT", value: "rose_abc", remark: "情侣周末玩两天，想住威尼斯人或新濠天地", status: "ADDED",      assignTo: xiaoLin?.id,    src: "官网首页" },
    { destination: "东京",       checkIn: dt(28),  checkOut: dt(33),  rooms: "1间",       guests: "2人",        budget: "500-800元/晚",   prefs: ["近地铁", "可取消"], contact: "MOBILE", value: "13800220002", remark: "情侣东京自由行，希望住新宿或银座附近",   status: "CONTACTED",  assignTo: xiaoZhou?.id,   src: "抖音" },
    { destination: "大阪",       checkIn: dt(30),  checkOut: dt(34),  rooms: "1间",       guests: "2人",        budget: "300-500元/晚",   prefs: ["价格优先", "近地铁"], contact: "WECHAT", value: "japanfan_88", remark: "学生预算，关西4晚，想离环球影城近一点", status: "CONTACTED",  assignTo: xiaoLi?.id,     src: "小红书" },
    { destination: "首尔",       checkIn: dt(10),  checkOut: dt(13),  rooms: "1间",       guests: "2人",        budget: "300-500元/晚",   prefs: ["近地铁", "位置方便"], contact: "WECHAT", value: "seoul_traveler", remark: "想住明洞或弘大，方便逛街吃饭",            status: "QUOTED",     assignTo: xiaoLin?.id,    src: "官网首页" },
    { destination: "曼谷",       checkIn: dt(18),  checkOut: dt(22),  rooms: "1间",       guests: "2人",        budget: "300-500元/晚",   prefs: ["高星酒店", "含早餐"], contact: "WECHAT", value: "bkk_lover_jj", remark: "曼谷5晚，想住五星但预算控制400/晚",       status: "QUOTED",     assignTo: xiaoZhou?.id,   src: "百度搜索" },
    { destination: "新加坡",     checkIn: dt(40),  checkOut: dt(44),  rooms: "1间",       guests: "3-4人",      budget: "1500元以上/晚",  prefs: ["亲子友好", "高星酒店"], contact: "MOBILE", value: "13822330003", remark: "一家四口，想住圣淘沙或滨海湾金沙",       status: "DEAL",       assignTo: xiaoLin?.id,    src: "朋友推荐" },
    { destination: "云南",       checkIn: dt(15),  checkOut: dt(19),  rooms: "3间",       guests: "5人及以上",   budget: "300-500元/晚",   prefs: ["价格优先", "民宿公寓"], contact: "WECHAT", value: "graduation_yn6", remark: "毕业旅行 6 人，大理丽江各两晚，多间能不能便宜点", status: "DEAL", assignTo: xiaoZhou?.id, src: "小红书" },
    { destination: "三亚",       checkIn: dt(60),  checkOut: dt(63),  rooms: "1间",       guests: "2人",        budget: "1500元以上/晚",  prefs: ["海景房", "高星酒店"], contact: "WECHAT", value: "honeymoon_2025", remark: "蜜月旅行，亚龙湾五星海景，含早晚餐更好", status: "DEAL", assignTo: xiaoLi?.id, src: "官网首页" },
    { destination: "上海迪士尼", checkIn: dt(3),   checkOut: dt(5),   rooms: "1间",       guests: "2人",        budget: "300-500元/晚",   prefs: ["价格优先"], contact: "WECHAT", value: "broke_student_01", remark: "学生预算，迪士尼周边300以下能不能搞定", status: "LOST", assignTo: xiaoLi?.id, src: "微信群" },
    { destination: "香港",       checkIn: dt(8),   checkOut: dt(10),  rooms: "1间",       guests: "2人",        budget: "300-500元/晚",   prefs: [], contact: "WECHAT", value: "hk_lowbudget", remark: "香港预算太低没匹配到合适房型，客户决定不订",        status: "LOST",       assignTo: xiaoZhou?.id,   src: "百度搜索" },
    { destination: "测试目的地", checkIn: dt(2),   checkOut: dt(3),   rooms: "1间",       guests: "1人",        budget: "先看看报价",      prefs: [], contact: "MOBILE", value: "12345678901", remark: "联系方式打不通，疑似机器人提交",                  status: "INVALID",    assignTo: null,           src: "官网首页" },
    { destination: "三亚",       checkIn: dt(12),  checkOut: dt(15),  rooms: "2间",       guests: "3-4人",      budget: "800-1500元/晚",  prefs: ["海景房", "亲子友好"], contact: "MOBILE", value: "13744550006", remark: "亲子两间房，孩子8岁要加床",                          status: "NEW",        assignTo: null,           src: "官网首页" },
    { destination: "云南",       checkIn: dt(35),  checkOut: dt(40),  rooms: "1间",       guests: "2人",        budget: "500-800元/晚",   prefs: ["位置方便", "可取消"], contact: "WECHAT", value: "yn_couple", remark: "情侣大理丽江5晚，想各住一晚不同酒店", status: "ADDED",      assignTo: xiaoLin?.id,    src: "小红书" },
    { destination: "东京",       checkIn: dt(50),  checkOut: dt(54),  rooms: "1间",       guests: "2人",        budget: "800-1500元/晚",  prefs: ["近地铁", "高星酒店"], contact: "WECHAT", value: "tokyo_tourist", remark: "想住新宿王子或东京安达仕",            status: "CONTACTED",  assignTo: xiaoZhou?.id,   src: "抖音" },
    { destination: "大阪",       checkIn: dt(45),  checkOut: dt(48),  rooms: "2间",       guests: "3-4人",      budget: "500-800元/晚",   prefs: ["亲子友好", "近地铁"], contact: "MOBILE", value: "13966770008", remark: "三大一小亲子，关西机场附近一晚 + 大阪市区两晚", status: "QUOTED", assignTo: xiaoLi?.id, src: "朋友推荐" },
    { destination: "新加坡",     checkIn: dt(25),  checkOut: dt(28),  rooms: "1间",       guests: "2人",        budget: "1500元以上/晚",  prefs: ["高星酒店", "可取消"], contact: "WECHAT", value: "sg_premier", remark: "情侣周末新加坡，希望滨海湾金沙",            status: "DEAL",       assignTo: xiaoZhou?.id,   src: "官网首页" },
    { destination: "首尔",       checkIn: dt(55),  checkOut: dt(58),  rooms: "1间",       guests: "2人",        budget: "500-800元/晚",   prefs: ["近地铁", "含早餐"], contact: "WECHAT", value: "korea_couple", remark: "情侣首尔3晚，明洞或弘大都可以",      status: "NEW",        assignTo: null,           src: "微信群" },
  ];

  const createdLeads = [];
  for (let i = 0; i < hotelLeadSeed.length; i++) {
    const s = hotelLeadSeed[i];
    const nights = nightsBetween(s.checkIn, s.checkOut);
    const isDeal = s.status === "DEAL";
    const lead = await prisma.hotelLead.create({
      data: {
        leadNo: leadNo(i),
        destination: s.destination,
        checkInDate: s.checkIn,
        checkOutDate: s.checkOut,
        nights,
        roomCount: s.rooms,
        guestCount: s.guests,
        budget: s.budget,
        preferences: JSON.stringify(s.prefs),
        contactType: s.contact,
        contactValue: s.value,
        remark: s.remark,
        source: s.src,
        landingPage: "/",
        status: s.status,
        assignedToId: s.assignTo,
        lastFollowedAt: ["ADDED", "CONTACTED", "QUOTED", "DEAL", "LOST"].includes(s.status)
          ? new Date(Date.now() - (i + 1) * 3600_000)
          : null,
        dealAmount: isDeal ? Math.floor(2000 + Math.random() * 8000) * 100 : null,
        dealRemark: isDeal ? "已私域成交，已收款" : null,
        dealAt: isDeal ? new Date(Date.now() - i * 7200_000) : null,
        createdAt: new Date(Date.now() - (hotelLeadSeed.length - i) * 3600_000 * 6),
      },
    });
    createdLeads.push(lead);
  }
  console.log(`✅ 酒店线索: ${createdLeads.length} 条`);

  // 状态变更日志（每条非 NEW 线索一条）
  const statusFlow = ["NEW", "ADDED", "CONTACTED", "QUOTED", "DEAL"];
  for (const lead of createdLeads) {
    if (lead.status === "NEW") continue;
    if (lead.status === "INVALID" || lead.status === "LOST") {
      await prisma.hotelLeadStatusLog.create({
        data: {
          leadId: lead.id,
          fromStatus: "NEW",
          toStatus: lead.status,
          operatorId: lead.assignedToId,
          createdAt: new Date(lead.createdAt.getTime() + 3600_000),
        },
      });
      continue;
    }
    const idx = statusFlow.indexOf(lead.status);
    for (let i = 1; i <= idx; i++) {
      await prisma.hotelLeadStatusLog.create({
        data: {
          leadId: lead.id,
          fromStatus: statusFlow[i - 1],
          toStatus: statusFlow[i],
          operatorId: lead.assignedToId,
          createdAt: new Date(lead.createdAt.getTime() + i * 3600_000),
        },
      });
    }
  }

  // 跟进备注（给已添加微信及以后的线索）
  const noteSamples = [
    "客户加上了微信，正在确认日期和酒店偏好。",
    "客户回复说预算可以稍微上调一点，已发 3 个备选方案。",
    "客户在比较两个方案，明天给最终答复。",
    "酒店有早鸟价，已通知客户可以锁定。",
    "客户决定下单 2 晚海景房，正在收款。",
  ];
  for (const lead of createdLeads) {
    if (["NEW", "INVALID"].includes(lead.status)) continue;
    const noteCount = lead.status === "DEAL" ? 3 : lead.status === "QUOTED" ? 2 : 1;
    for (let i = 0; i < noteCount; i++) {
      await prisma.hotelLeadNote.create({
        data: {
          leadId: lead.id,
          adminUserId: lead.assignedToId || supportAdmins[0]?.id,
          content: noteSamples[Math.min(i, noteSamples.length - 1)],
          createdAt: new Date(lead.createdAt.getTime() + (i + 1) * 7200_000),
        },
      });
    }
  }
  console.log("✅ 状态日志 & 跟进备注已写入");

  // ─── 旅行团产品（Product 与 Departure 分离，开发测试数据） ───
  const tour = await prisma.tourProduct.upsert({
    where: { slug: "sanya-island-5d" },
    update: {},
    create: { slug: "sanya-island-5d", name: "三亚海岛 5 天游 · 轻松度假小团", destination: "三亚", departureCity: "广州", days: 5, tourType: "精品小团", audience: "情侣、亲子、朋友出行", summary: "开发测试数据：海岛度假与精选住宿。", coverImage: "/travel-home/sanya-coast.jpg", tags: JSON.stringify(["海岛度假", "亲子友好"]), status: "ONLINE", recommended: true },
  });
  await prisma.tourDeparture.createMany({ data: [{ productId: tour.id, departureDate: new Date("2026-10-02"), adultPrice: 3299, status: "OPEN" }, { productId: tour.id, departureDate: new Date("2026-10-16"), adultPrice: 3599, status: "PENDING_CONFIRMATION" }] });
  await prisma.tourItineraryDay.createMany({ data: [{ productId: tour.id, day: 1, title: "抵达三亚，入住海棠湾", city: "三亚", detail: "接机后入住酒店。" }, { productId: tour.id, day: 2, title: "蜈支洲岛一日", city: "海棠湾", detail: "含往返船票。" }] });
  console.log("✅ 旅行团测试产品与班期已写入");

  // ─── 可解释预估价格（仅开发环境 Mock） ─────────────────────────
  if (process.env.NODE_ENV !== "production") {
    await prisma.estimateRule.createMany({ data: [
      { productType: "HOTEL", minFactor: 0.65, maxFactor: 0.72, confidence: "HIGH", notes: "开发 Mock：正式上线前由运营复核", isMock: true },
      { productType: "FLIGHT", minFactor: 0.88, maxFactor: 0.97, confidence: "LOW", notes: "开发 Mock：机票波动较大", isMock: true },
      { productType: "TRAIN", minFactor: 0.95, maxFactor: 1, confidence: "LOW", notes: "开发 Mock：正式上线前由运营复核", isMock: true },
      { productType: "ACTIVITY", minFactor: 0.75, maxFactor: 0.90, confidence: "MEDIUM", notes: "开发 Mock：正式上线前由运营复核", isMock: true },
      { productType: "CAR", minFactor: 0.82, maxFactor: 0.95, confidence: "MEDIUM", notes: "开发 Mock：正式上线前由运营复核", isMock: true },
      { productType: "PACKAGE", minFactor: 0.70, maxFactor: 0.85, confidence: "MEDIUM", notes: "开发 Mock：正式上线前由运营复核", isMock: true },
      { productType: "LOUNGE", minFactor: 0.80, maxFactor: 0.92, confidence: "MEDIUM", notes: "开发 Mock：正式上线前由运营复核", isMock: true },
    ] });
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const hotelPrices = {
      三亚: [["携程", 3200], ["飞猪", 3080], ["其他公开渠道", 3350]],
      上海: [["携程", 2680], ["美团", 2590], ["同程", 2750]],
      东京: [["Booking", 4200], ["Agoda", 3980], ["其他公开渠道", 4350]],
      澳门: [["携程", 3600], ["飞猪", 3480], ["其他公开渠道", 3720]],
    };
    await prisma.marketPriceSnapshot.createMany({ data: Object.entries(hotelPrices).flatMap(([destination, rows]) => rows.map(([sourceName, price]) => ({ productType: "HOTEL", destination, sourceName, price: Number(price), currency: "CNY", conditions: "开发 Mock：示例行程总价", expiresAt, isMock: true }))) });
    console.log("✅ 开发环境预估规则与公开价格 Mock 已写入");
  }

  console.log("\n🎉 种子数据写入完成！\n");
  console.log("═══════════════════════════════════════════");
  console.log("  默认账号");
  console.log("═══════════════════════════════════════════");
  console.log("  后台管理员：");
  console.log("    admin / admin123456 （超级管理员）");
  console.log("    staff / staff123456 （客服）");
  console.log("    xiaozhou / staff123456 （客服 · 小周）");
  console.log("    xiaolin / staff123456  （客服 · 小林）");
  console.log("    ops / 12345678        （运营）");
  console.log("    order / 12345678      （订单专员）");
  console.log("  前台测试用户（密码 12345678）：");
  console.log("    user1@test.com  user2@test.com  user3@test.com");
  console.log("═══════════════════════════════════════════\n");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
