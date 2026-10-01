import { describe, expect, it } from "vitest";
import { chooseTask, detectValueSignal, extractProfile, missingProfileFields } from "@/lib/ai-advisor/profile";

describe("AI旅行顾问画像解析", () => {
  it("从复杂中文需求中提取关键画像并路由到规划模型", () => {
    const messages = [{
      role: "user" as const,
      content: "夫妻两个人，从广州出发，国庆去三亚玩7天，预算10000元，不想太累，希望住好一点，还想去小众景点。",
    }];
    const profile = extractProfile(messages);
    expect(profile).toMatchObject({
      origin: "广州", destination: "三亚", travelTime: "国庆", travelers: 2,
      budget: "10,000元左右", travelType: "情侣", hotelLevel: "高端",
    });
    expect(profile.preferences).toEqual(expect.arrayContaining(["休闲", "小众", "景点"]));
    expect(missingProfileFields(profile)).toEqual([]);
    expect(chooseTask(messages, profile)).toBe("COMPLEX_PLAN");
  });

  it("识别高价值信号但不把普通咨询误判为成交动作", () => {
    expect(detectValueSignal("这个路线挺好，我要订，有没有优惠").highValue).toBe(true);
    expect(detectValueSignal("推荐一个适合秋天散步的城市").highValue).toBe(false);
  });

  it("多轮对话会保留已有画像并补全缺失项", () => {
    const profile = extractProfile(
      [{ role: "user", content: "从深圳出发" }, { role: "assistant", content: "想去哪里？" }, { role: "user", content: "去重庆，两个人，预算5000元" }],
      { travelTime: "下个月", preferences: ["美食"] },
    );
    expect(profile).toMatchObject({ origin: "深圳", destination: "重庆", travelers: 2, budget: "5,000元左右", travelTime: "下个月" });
    expect(profile.preferences).toContain("美食");
  });

  it("识别一家三口和成人儿童组合人数", () => {
    expect(extractProfile([{ role: "user", content: "一家三口从广州出发，国庆想轻松玩5天" }])).toMatchObject({
      origin: "广州", travelTime: "国庆", duration: "5天", travelers: 3, travelType: "家庭",
    });
    expect(extractProfile([{ role: "user", content: "想玩5天4晚，行程轻松一点，不赶路" }])).toMatchObject({ duration: "5天4晚" });
    expect(extractProfile([{ role: "user", content: "2大1小去三亚" }]).travelers).toBe(3);
  });

  it("不会把出发城市误判成目的地", () => {
    expect(extractProfile([{ role: "user", content: "上海出发" }])).toMatchObject({ origin: "上海" });
    expect(extractProfile([{ role: "user", content: "上海出发，明天去北京" }])).toMatchObject({ origin: "上海", destination: "北京", travelTime: "明天" });
  });
});
