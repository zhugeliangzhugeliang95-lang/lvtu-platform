"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Clipboard,
  Headphones,
  Loader2,
  Plus,
  ShieldCheck,
  TrendingDown,
  UsersRound,
} from "lucide-react";
import { AppBottomNav } from "@/components/AppBottomNav";
import { serviceCatalog } from "@/lib/travelData";

type ServiceKey = (typeof serviceCatalog)[number]["key"] | "group" | "combo";
type DetailValues = Record<string, string>;
type FormState = {
  services: ServiceKey[];
  destination: string;
  fromCity: string;
  startDate: string;
  endDate: string;
  people: string;
  budget: string;
  preference: string;
  publicPrice: string;
  notes: string;
  name: string;
  phone: string;
  details: DetailValues;
};
type Question = {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "date" | "number";
  source?: "state" | "detail";
};

const serviceLabels: Record<string, string> = Object.fromEntries(
  serviceCatalog.map((item) => [item.key, item.label]),
);
const budgetChoices = [
  "3000元以内/人",
  "3000-6000元/人",
  "6000-10000元/人",
  "先看方案再定",
];
const serviceQuestionSets: Record<
  string,
  { title: string; fields: Question[] }
> = {
  hotel: {
    title: "酒店信息",
    fields: [
      {
        key: "destination",
        label: "城市或酒店名称",
        placeholder: "例如：三亚 / 海棠湾",
        source: "state",
      },
      {
        key: "startDate",
        label: "入住日期",
        placeholder: "",
        type: "date",
        source: "state",
      },
      {
        key: "endDate",
        label: "离店日期",
        placeholder: "",
        type: "date",
        source: "state",
      },
      {
        key: "roomCount",
        label: "房间数量",
        placeholder: "例如：2",
        type: "number",
      },
      {
        key: "childCount",
        label: "儿童数量",
        placeholder: "没有可填 0",
        type: "number",
      },
      {
        key: "roomType",
        label: "房型或床型",
        placeholder: "大床 / 双床 / 家庭房",
      },
      {
        key: "breakfast",
        label: "早餐需求",
        placeholder: "双早 / 无早 / 待确认",
      },
    ],
  },
  flight: {
    title: "机票信息",
    fields: [
      {
        key: "fromCity",
        label: "出发城市",
        placeholder: "例如：广州",
        source: "state",
      },
      { key: "toCity", label: "到达城市", placeholder: "例如：三亚" },
      {
        key: "startDate",
        label: "出发日期",
        placeholder: "",
        type: "date",
        source: "state",
      },
      { key: "tripType", label: "单程还是往返", placeholder: "例如：往返" },
      { key: "cabin", label: "舱位偏好", placeholder: "经济舱 / 商务舱" },
      {
        key: "luggage",
        label: "行李需求",
        placeholder: "例如：每人1件托运行李",
      },
    ],
  },
  train: {
    title: "火车票信息",
    fields: [
      { key: "fromStation", label: "出发站", placeholder: "例如：虎门站" },
      { key: "toStation", label: "到达站", placeholder: "例如：香港西九龙" },
      {
        key: "startDate",
        label: "出发日期",
        placeholder: "",
        type: "date",
        source: "state",
      },
      {
        key: "timeRange",
        label: "时间范围",
        placeholder: "上午 / 下午 / 不限",
      },
      { key: "seatType", label: "席别", placeholder: "二等座 / 一等座" },
    ],
  },
  ticket: {
    title: "门票与玩乐",
    fields: [
      {
        key: "destination",
        label: "城市或景区",
        placeholder: "例如：广州长隆",
        source: "state",
      },
      {
        key: "projectName",
        label: "项目名称",
        placeholder: "乐园 / 景区 / 演出",
      },
      {
        key: "startDate",
        label: "使用日期",
        placeholder: "",
        type: "date",
        source: "state",
      },
      {
        key: "ticketPeople",
        label: "成人与儿童人数",
        placeholder: "例如：2成人1儿童",
      },
      { key: "session", label: "场次或套餐偏好", placeholder: "不限也可以" },
    ],
  },
  buffet: {
    title: "自助餐信息",
    fields: [
      {
        key: "destination",
        label: "城市或酒店餐厅",
        placeholder: "例如：三亚海棠湾",
        source: "state",
      },
      {
        key: "startDate",
        label: "用餐日期",
        placeholder: "",
        type: "date",
        source: "state",
      },
      {
        key: "buffetPeople",
        label: "用餐人数",
        placeholder: "例如：4",
        type: "number",
      },
    ],
  },
  lounge: {
    title: "贵宾厅信息",
    fields: [
      {
        key: "loungeLocation",
        label: "机场或车站",
        placeholder: "例如：白云机场T1",
      },
      {
        key: "startDate",
        label: "使用日期",
        placeholder: "",
        type: "date",
        source: "state",
      },
      {
        key: "loungePeople",
        label: "使用人数",
        placeholder: "例如：2",
        type: "number",
      },
    ],
  },
  transfer: {
    title: "接送信息",
    fields: [
      { key: "pickup", label: "接送路线", placeholder: "例如：机场到酒店" },
      {
        key: "transferTime",
        label: "接送日期与时间",
        placeholder: "例如：9月18日 14:00",
      },
      {
        key: "transferPeople",
        label: "乘客人数",
        placeholder: "例如：3",
        type: "number",
      },
      { key: "luggageCount", label: "行李数量", placeholder: "例如：2件" },
    ],
  },
  charter: {
    title: "包车信息",
    fields: [
      {
        key: "destination",
        label: "行程范围",
        placeholder: "例如：大理环洱海",
        source: "state",
      },
      {
        key: "startDate",
        label: "出发日期",
        placeholder: "",
        type: "date",
        source: "state",
      },
      { key: "duration", label: "用车时长", placeholder: "半天 / 1天 / 多日" },
      {
        key: "vehicleType",
        label: "车型与人数",
        placeholder: "例如：5座，4人",
      },
    ],
  },
  group: {
    title: "旅行团信息",
    fields: [
      {
        key: "destination",
        label: "目的地",
        placeholder: "例如：云南",
        source: "state",
      },
      {
        key: "startDate",
        label: "计划出发日期",
        placeholder: "",
        type: "date",
        source: "state",
      },
      {
        key: "endDate",
        label: "预计结束日期",
        placeholder: "",
        type: "date",
        source: "state",
      },
    ],
  },
};

function initialServices(value: string | null): ServiceKey[] {
  if (!value || value === "all") return ["hotel"];
  if (value === "combo" || value === "hotel-package") return ["combo"];
  if (value === "group") return ["group"];
  return [value as ServiceKey];
}

function getInitialState(
  params: ReturnType<typeof useSearchParams>,
): FormState {
  const legacyTransport = params.get("transport") || "";
  const requestedService =
    params.get("service") ||
    (legacyTransport.includes("火车") || legacyTransport.includes("高铁")
      ? "train"
      : legacyTransport.includes("机票")
        ? "flight"
        : null);
  const service =
    requestedService === "rail"
      ? "train"
      : requestedService === "package"
        ? "ticket"
        : requestedService;
  const subject = params.get("subject") || params.get("notes") || "";
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const details: DetailValues = {};

  if (service === "flight") details.toCity = to;
  if (service === "train") {
    details.fromStation = from;
    details.toStation = to;
  }
  if (service === "ticket" && subject) details.projectName = subject;
  if (service === "transfer" && (from || to))
    details.pickup = [from, to].filter(Boolean).join(" → ");

  return {
    services: initialServices(service),
    destination:
      service === "hotel" || service === "ticket" || service === "charter"
        ? to || subject
        : "",
    fromCity: service === "flight" ? from : "",
    startDate: "",
    endDate: "",
    people: "2",
    budget: "",
    preference: "",
    publicPrice: "",
    notes: subject ? `参考内容：${subject}` : "",
    name: "",
    phone: "",
    details,
  };
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-[#475467]">
        {question.label}
      </span>
      <input
        type={question.type || "text"}
        inputMode={question.type === "number" ? "numeric" : undefined}
        value={value}
        onChange={(event) =>
          onChange(
            question.type === "number"
              ? event.target.value.replace(/\D/g, "").slice(0, 3)
              : event.target.value,
          )
        }
        placeholder={question.placeholder}
        className="min-h-12 w-full rounded-xl border border-[#d8e1ed] bg-white px-4 text-sm outline-none transition focus:border-[#1769e0]"
      />
    </label>
  );
}

function ServiceStep({
  state,
  toggle,
}: {
  state: FormState;
  toggle: (key: ServiceKey) => void;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-[#1769e0]">01 / 04</p>
      <h1 className="mt-2 text-[25px] font-bold tracking-[-0.03em]">
        你想让我们帮什么？
      </h1>
      <p className="mt-2 text-sm leading-6 text-[#667085]">
        可多选，一次说清会自动组成一张需求卡。不确定也没关系，选“组合询价”。
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {serviceCatalog.map((item) => {
          const selected = state.services.includes(item.key);
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => toggle(item.key)}
              className={`relative min-h-[104px] rounded-[16px] border p-4 text-left transition active:scale-[0.98] ${selected ? "border-[#1769e0] bg-[#eff6ff]" : "border-[#e3e9f1] bg-white"}`}
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#1769e0] shadow-sm">
                <Plus
                  size={17}
                  className={selected ? "rotate-45 transition" : "transition"}
                />
              </span>
              <span className="mt-3 block text-sm font-bold text-[#172033]">
                {item.label}
              </span>
              <span className="mt-1 block text-[11px] text-[#8d98a8]">
                {item.description}
              </span>
              {selected ? (
                <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-[#1769e0] text-white">
                  <Check size={13} />
                </span>
              ) : null}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => toggle("combo")}
          className={`col-span-2 flex min-h-[66px] items-center gap-3 rounded-[16px] border p-4 text-left transition ${state.services.includes("combo") ? "border-[#1769e0] bg-[#eff6ff]" : "border-dashed border-[#bad4f8] bg-white"}`}
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#dcebff] text-[#104da6]">
            <Plus size={18} />
          </span>
          <span>
            <span className="block text-sm font-bold">组合询价</span>
            <span className="mt-1 block text-[11px] text-[#8d98a8]">
              例如：机票 + 酒店 + 接送机 + 门票
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

function CoreStep({
  state,
  update,
  updateDetail,
}: {
  state: FormState;
  update: (key: keyof FormState, value: string) => void;
  updateDetail: (key: string, value: string) => void;
}) {
  const activeServices = state.services.includes("combo")
    ? ["hotel", "flight", "ticket", "transfer"]
    : state.services;
  const shown = new Set<string>();
  const valueFor = (question: Question) =>
    question.source === "state"
      ? (state[question.key as keyof FormState] as string) || ""
      : state.details[question.key] || "";
  const change = (question: Question, value: string) =>
    question.source === "state"
      ? update(question.key as keyof FormState, value)
      : updateDetail(question.key, value);
  return (
    <div>
      <p className="text-xs font-bold text-[#1769e0]">02 / 04</p>
      <h1 className="mt-2 text-[25px] font-bold tracking-[-0.03em]">
        按服务问几个关键问题
      </h1>
      <p className="mt-2 text-sm leading-6 text-[#667085]">
        只收集你所选业务真正需要的信息，避免一次填一大张后台表单。
      </p>
      <div className="mt-6 space-y-4">
        {activeServices.map((service) => {
          const set = serviceQuestionSets[service] || serviceQuestionSets.group;
          const fields = set.fields.filter((question) => {
            const duplicate =
              question.source === "state" && shown.has(question.key);
            if (!duplicate && question.source === "state")
              shown.add(question.key);
            return !duplicate;
          });
          return (
            <section
              key={service}
              className="rounded-[16px] border border-[#dce8f8] bg-white p-4"
            >
              <h2 className="text-sm font-bold text-[#172033]">{set.title}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {fields.map((question) => (
                  <QuestionField
                    key={`${service}-${question.key}`}
                    question={question}
                    value={valueFor(question)}
                    onChange={(value) => change(question, value)}
                  />
                ))}
              </div>
            </section>
          );
        })}
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-[#475467]">
            出行人数
          </span>
          <div className="relative">
            <UsersRound
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8d98a8]"
            />
            <input
              inputMode="numeric"
              value={state.people}
              onChange={(event) =>
                update(
                  "people",
                  event.target.value.replace(/\D/g, "").slice(0, 2),
                )
              }
              placeholder="例如：2"
              className="min-h-12 w-full rounded-xl border border-[#d8e1ed] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#1769e0]"
            />
          </div>
        </label>
      </div>
    </div>
  );
}

function PreferenceStep({
  state,
  update,
  estimateEligible,
}: {
  state: FormState;
  update: (key: keyof FormState, value: string) => void;
  estimateEligible: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-[#1769e0]">03 / 04</p>
      <h1 className="mt-2 text-[25px] font-bold tracking-[-0.03em]">
        补充公开原价与偏好
      </h1>
      <p className="mt-2 text-sm leading-6 text-[#667085]">
        {estimateEligible
          ? "填写你在公开平台看到的同规格总价，旅途会按稳定规则生成预估区间。"
          : "标准票务价格和退改规则波动较大，将直接进入顾问确认，不自动套用折扣。"}
      </p>
      <div className="mt-6">
        {estimateEligible ? (
          <label className="block rounded-[18px] border border-[#bcd8fb] bg-[#f5faff] p-4">
            <span className="mb-2 block text-xs font-bold text-[#174f91]">
              你看到的公开总价 *
            </span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#1769e0]">
                ¥
              </span>
              <input
                inputMode="decimal"
                value={state.publicPrice}
                onChange={(event) =>
                  update(
                    "publicPrice",
                    event.target.value.replace(/[^\d.]/g, "").slice(0, 10),
                  )
                }
                placeholder="例如：5000"
                className="min-h-12 w-full rounded-xl border border-[#cddff4] bg-white pl-9 pr-4 text-base font-semibold outline-none focus:border-[#1769e0]"
              />
            </div>
            <span className="mt-2 block text-[10px] leading-5 text-[#6c8199]">
              请按同日期、同人数、同房型或同套餐口径填写；顾问会再次核对。
            </span>
          </label>
        ) : null}
        <div className="mt-6">
          <span className="mb-3 block text-xs font-semibold text-[#475467]">
            预算范围（可不选）
          </span>
          <div className="grid grid-cols-2 gap-2">
            {budgetChoices.map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() =>
                  update("budget", state.budget === choice ? "" : choice)
                }
                className={`min-h-11 rounded-xl border px-3 text-xs font-semibold transition ${state.budget === choice ? "border-[#1769e0] bg-[#eff6ff] text-[#104da6]" : "border-[#d8e1ed] bg-white text-[#667085]"}`}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
        <label className="mt-6 block">
          <span className="mb-2 block text-xs font-semibold text-[#475467]">
            偏好或特殊需求
          </span>
          <textarea
            value={state.preference}
            onChange={(event) => update("preference", event.target.value)}
            placeholder="例如：需要含早餐、带儿童座椅、希望可取消……"
            rows={4}
            className="w-full resize-none rounded-xl border border-[#d8e1ed] bg-white p-4 text-sm leading-6 outline-none focus:border-[#1769e0]"
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-2 block text-xs font-semibold text-[#475467]">
            还有什么想说？
          </span>
          <input
            value={state.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="可留空"
            className="min-h-12 w-full rounded-xl border border-[#d8e1ed] bg-white px-4 text-sm outline-none focus:border-[#1769e0]"
          />
        </label>
      </div>
    </div>
  );
}

type EstimateView = {
  id?: string;
  marketReferencePrice: number | null;
  estimatedMinPrice: number | null;
  estimatedMaxPrice: number | null;
  savingsMin: number | null;
  savingsMax: number | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  priceStatus: string;
  explanation: string;
  sampleSize?: number;
  factorRange?: string;
  estimatedServiceFeeMin?: number;
  estimatedServiceFeeMax?: number;
  serviceFeeRate?: number;
};

type PlatformQuote = {
  platform: string;
  platformLabel?: string;
  hotelName: string;
  roomType?: string;
  pricePerNight: number;
  totalPrice: number;
  breakfastIncluded?: boolean;
  cancellable?: boolean;
  confidence?: string;
  source?: string;
  notice?: string;
};

function yuan(value: number | null) {
  return typeof value === "number"
    ? `¥${value.toLocaleString("zh-CN")}`
    : "待确认";
}

const WECHAT_KF_URL = "https://work.weixin.qq.com/kfid/kfc7e290edd33f220d2";

function PriceStep({
  state,
  selectedLabels,
  estimate,
  loading,
  platformQuotes,
  onCopy,
  copied,
}: {
  state: FormState;
  selectedLabels: string;
  estimate: EstimateView | null;
  loading: boolean;
  platformQuotes: PlatformQuote[];
  onCopy: () => void;
  copied: boolean;
}) {
  const destination =
    state.destination ||
    state.details.toCity ||
    state.details.toStation ||
    state.details.projectName ||
    state.details.loungeLocation ||
    state.details.pickup ||
    "待确认目的地";
  const available =
    estimate?.priceStatus === "ESTIMATED" &&
    estimate.estimatedMinPrice !== null &&
    estimate.estimatedMaxPrice !== null;
  return (
    <div>
      <p className="text-xs font-bold text-[#1769e0]">04 / 04</p>
      <h1 className="mt-2 text-[25px] font-bold tracking-[-0.03em]">
        先看一版旅途预估
      </h1>
      <p className="mt-2 text-sm leading-6 text-[#667085]">
        按你填写的公开原价，以稳定的 70%～80% 规则生成区间，最终仍由顾问确认。
      </p>
      <div className="mt-6 overflow-hidden rounded-[24px] bg-[#0d315d] text-white shadow-[0_20px_50px_rgba(13,49,93,.18)]">
        <div className="p-5">
          <p className="text-[11px] text-white/55">
            {destination} · {selectedLabels} · {state.people || "?"}人
          </p>
          {loading ? (
            <div className="grid min-h-48 place-items-center">
              <Loader2 size={25} className="animate-spin text-[#8cc8ff]" />
            </div>
          ) : available ? (
            <>
              <div className="mt-6 grid grid-cols-2 gap-5">
                <div>
                  <p className="text-[10px] text-white/55">你填写的公开原价</p>
                  <p className="mt-2 text-[22px] font-semibold">
                    {yuan(estimate.marketReferencePrice)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#9dd2ff]">
                    预估价（70%～80%）
                  </p>
                  <p className="mt-2 text-[25px] font-semibold text-white">
                    {yuan(estimate.estimatedMinPrice)}～
                    {yuan(estimate.estimatedMaxPrice)}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-[16px] bg-white/10 p-4">
                <span className="grid size-10 place-items-center rounded-[13px] bg-[#1683ff] text-white">
                  <TrendingDown size={19} />
                </span>
                <div>
                  <p className="text-[10px] text-white/55">预计节省区间</p>
                  <p className="mt-1 text-[17px] font-semibold">
                    {yuan(estimate.savingsMin)}～{yuan(estimate.savingsMax)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-10">
              <p className="text-[20px] font-semibold">待顾问确认</p>
              <p className="mt-3 text-[12px] leading-6 text-white/65">
                这类服务不自动套用预估规则。提交需求后，顾问会确认最终价格、库存和退改规则。
              </p>
            </div>
          )}
        </div>
        <div className="border-t border-white/10 bg-white/5 px-5 py-4 text-[10px] leading-5 text-white/62">
          当前状态：{available ? "预估价" : "待确认"}
          。预估价不是售价，不会自动扣款或锁定库存；顾问核实后会单独展示“最终确认价”。
        </div>
      </div>
      {available ? (
        <section className="mt-4 rounded-[20px] border border-[#dce8f8] bg-white p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#1769e0]" />
            <div>
              <p className="text-sm font-bold text-[#172033]">
                服务费规则透明可算
              </p>
              <p className="mt-2 text-[11px] leading-5 text-[#667085]">
                普通用户仅在最终成交后，按实际节省金额的 35%
                收取平台服务费；当前估算约{" "}
                {yuan(estimate.estimatedServiceFeeMin ?? null)}～
                {yuan(estimate.estimatedServiceFeeMax ?? null)}
                。旅途会员使用绑定手机号预订，可免平台服务费。
              </p>
            </div>
          </div>
        </section>
      ) : null}
      {platformQuotes.length ? (
        <section className="mt-4 rounded-[20px] border border-[#dce8f8] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#172033]">公开价格参考</p>
              <p className="mt-1 text-[10px] text-[#8d98a8]">
                顾问会按同日期、同规格再次核对
              </p>
            </div>
            <span className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-[10px] font-semibold text-[#1769e0]">
              仅作参考
            </span>
          </div>
        </section>
      ) : null}
      <div className="mt-4 flex gap-3 rounded-[18px] bg-[#eef7ff] p-4 text-[10px] leading-5 text-[#53677e]">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#1677ff]" />
        <span>
          认可预估后再提交咨询；最终价格、服务内容和退改规则以顾问确认结果为准。
        </span>
      </div>
      <a
        href={WECHAT_KF_URL}
        target="_blank"
        rel="noreferrer"
        onClick={onCopy}
        className="mt-4 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#07b95a] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(7,185,90,.18)] transition hover:bg-[#069f4e] active:scale-[.98]"
      >
        <Clipboard size={17} />
        {copied ? "需求已复制，正在打开客服" : "复制需求并联系顾问"}
      </a>
    </div>
  );
}

export function QuoteWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [estimate, setEstimate] = useState<EstimateView | null>(null);
  const [platformQuotes, setPlatformQuotes] = useState<PlatformQuote[]>([]);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<FormState>(() => getInitialState(params));
  const update = (key: keyof FormState, value: string) =>
    setState((current) => ({ ...current, [key]: value }));
  const updateDetail = (key: string, value: string) =>
    setState((current) => ({
      ...current,
      details: { ...current.details, [key]: value },
    }));
  const toggle = (key: ServiceKey) =>
    setState((current) => {
      if (key === "combo")
        return {
          ...current,
          services: current.services.includes("combo") ? ["hotel"] : ["combo"],
        };
      const services = current.services.filter((item) => item !== "combo");
      return {
        ...current,
        services: services.includes(key)
          ? services.filter((item) => item !== key).length
            ? services.filter((item) => item !== key)
            : [key]
          : [...services, key],
      };
    });
  const selectedLabels = useMemo(
    () =>
      state.services
        .map((key) =>
          key === "combo"
            ? "组合询价"
            : key === "group"
              ? "旅行团"
              : serviceLabels[key],
        )
        .join(" · "),
    [state.services],
  );
  const hasDestination = Boolean(
    state.destination.trim() ||
    state.details.toCity?.trim() ||
    state.details.toStation?.trim() ||
    state.details.projectName?.trim() ||
    state.details.loungeLocation?.trim() ||
    state.details.pickup?.trim(),
  );
  const estimateEligible = !state.services.some(
    (service) =>
      service === "flight" || service === "train" || service === "group",
  );

  useEffect(() => {
    if (step !== 4) return;
    const primaryService = state.services[0] || "hotel";
    if (primaryService === "group") return;
    const destination =
      state.destination.trim() ||
      state.details.toCity ||
      state.details.toStation ||
      state.details.projectName ||
      state.details.loungeLocation ||
      state.details.pickup ||
      "";
    let alive = true;
    const timer = window.setTimeout(() => {
      setEstimateLoading(true);
      setEstimate(null);
      setPlatformQuotes([]);
      setError("");
      const today = new Date();
      const fallbackStart = today.toISOString().slice(0, 10);
      const fallbackEndDate = new Date(today.getTime() + 86_400_000 * 2);
      const compareType =
        primaryService === "flight" || primaryService === "train"
          ? "transport"
          : primaryService === "ticket" ||
              primaryService === "buffet" ||
              primaryService === "lounge" ||
              primaryService === "transfer" ||
              primaryService === "charter"
            ? "project"
            : "hotel";
      const nights = Math.max(
        1,
        state.startDate && state.endDate
          ? Math.round(
              (new Date(state.endDate).getTime() -
                new Date(state.startDate).getTime()) /
                86_400_000,
            )
          : 1,
      );
      fetch("/api/inquiry/price-compare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          searchType: compareType,
          hotelName: destination,
          roomType: state.details.roomType || undefined,
          projectType: serviceLabels[primaryService] || undefined,
          city: state.destination || undefined,
          transportType:
            primaryService === "flight"
              ? "机票"
              : primaryService === "train"
                ? "高铁/火车"
                : undefined,
          fromCity: state.fromCity || state.details.fromStation || undefined,
          toCity:
            state.details.toCity || state.details.toStation || destination,
          checkInDate: state.startDate || fallbackStart,
          checkOutDate:
            state.endDate || fallbackEndDate.toISOString().slice(0, 10),
          nights,
          guestCount: Number(state.people) || 2,
          roomCount: Number(state.details.roomCount) || 1,
          publicReferencePrice: Number(state.publicPrice) || undefined,
        }),
      })
        .then(async (response) => {
          const json = await response.json();
          if (!response.ok) throw new Error(json.error || "预估暂不可用");
          if (alive) {
            setPlatformQuotes(
              (json.results || []).map(
                (item: PlatformQuote, index: number) => ({
                  ...item,
                  platform: `${item.platform}-${index}`,
                }),
              ),
            );
            if (json.travelEstimate)
              setEstimate({
                ...json.travelEstimate,
                confidence:
                  json.travelEstimate.sampleSize >= 3 ? "HIGH" : "MEDIUM",
                priceStatus: "ESTIMATED",
                explanation: json.notice || "根据多个平台参考价计算",
              });
          }
        })
        .catch((reason) => {
          if (alive)
            setError(reason instanceof Error ? reason.message : "预估暂不可用");
        })
        .finally(() => {
          if (alive) setEstimateLoading(false);
        });
    }, 0);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [step, state]);

  async function copyCustomerSummary() {
    const destination =
      state.destination.trim() ||
      state.details.toCity ||
      state.details.toStation ||
      state.details.projectName ||
      state.details.loungeLocation ||
      state.details.pickup ||
      "待确认";
    const detailLines = Object.entries(state.details)
      .filter(([, value]) => value.trim())
      .map(([key, value]) => `${key}：${value}`);
    const quoteLines = platformQuotes
      .slice(0, 5)
      .map(
        (quote) =>
          `${quote.platformLabel || quote.platform} ${quote.roomType || "参考方案"} ¥${Math.round(quote.totalPrice).toLocaleString("zh-CN")}`,
      );
    const text = [
      "【旅途需求咨询】",
      `服务：${selectedLabels}`,
      `目的地/项目：${destination}`,
      state.fromCity ? `出发地：${state.fromCity}` : "",
      state.startDate
        ? `日期：${state.startDate}${state.endDate ? ` 至 ${state.endDate}` : ""}`
        : "",
      `人数：${state.people || "待确认"}人`,
      state.budget ? `预算：${state.budget}` : "",
      state.publicPrice
        ? `用户填写的公开原价：¥${Number(state.publicPrice).toLocaleString("zh-CN")}`
        : "",
      state.preference ? `偏好：${state.preference}` : "",
      state.notes ? `备注：${state.notes}` : "",
      detailLines.length ? `详细信息：\n${detailLines.join("\n")}` : "",
      quoteLines.length ? `平台参考价：\n${quoteLines.join("\n")}` : "",
      estimate?.estimatedMinPrice && estimate?.estimatedMaxPrice
        ? `旅途预估：¥${estimate.estimatedMinPrice.toLocaleString("zh-CN")}～¥${estimate.estimatedMaxPrice.toLocaleString("zh-CN")}（公开原价的70%～80%，当前为预估价）`
        : "",
      "服务费：普通用户按最终实际节省金额的35%收取；有效会员使用绑定手机号预订免平台服务费。",
      "请客服帮忙确认最终价格、库存、服务内容和退改规则。",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2400);
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] pb-[calc(82px+env(safe-area-inset-bottom))]">
      <div className="sticky top-0 z-20 border-b border-[#e3e9f1] bg-white/94 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between">
          <button
            type="button"
            onClick={() =>
              step > 1 ? setStep((value) => value - 1) : router.back()
            }
            className="grid h-11 w-11 place-items-center rounded-xl text-[#667085] hover:bg-[#eff6ff]"
            aria-label="返回"
          >
            <ArrowLeft size={19} />
          </button>
          <div className="text-sm font-bold text-[#172033]">
            旅途预估{" "}
            <span className="ml-1 text-xs font-normal text-[#8d98a8]">
              {step}/4
            </span>
          </div>
          <a
            href={WECHAT_KF_URL}
            target="_blank"
            rel="noreferrer"
            className="grid h-11 w-11 place-items-center rounded-xl text-[#07a957]"
            aria-label="打开企业微信客服"
          >
            <Headphones size={18} />
          </a>
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-7 sm:py-10">
        <div className="mb-8 flex gap-1.5" aria-label="询价步骤">
          {[1, 2, 3, 4].map((item) => (
            <span
              key={item}
              className={`h-1.5 flex-1 rounded-full ${item <= step ? "bg-[#1769e0]" : "bg-[#dce4ef]"}`}
            />
          ))}
        </div>
        <div className="animate-rise-in">
          {step === 1 ? (
            <ServiceStep state={state} toggle={toggle} />
          ) : step === 2 ? (
            <CoreStep
              state={state}
              update={update}
              updateDetail={updateDetail}
            />
          ) : step === 3 ? (
            <PreferenceStep
              state={state}
              update={update}
              estimateEligible={estimateEligible}
            />
          ) : (
            <PriceStep
              state={state}
              selectedLabels={selectedLabels}
              estimate={estimate}
              loading={estimateLoading}
              platformQuotes={platformQuotes}
              onCopy={copyCustomerSummary}
              copied={copied}
            />
          )}
        </div>
        {error ? (
          <p className="mt-5 flex items-center gap-2 rounded-xl bg-[#fff1f1] px-3 py-3 text-xs font-medium text-[#b33434]">
            <CircleHelp size={15} />
            {error}
          </p>
        ) : null}
        {step < 4 ? (
          <div className="mt-8 flex items-center justify-between gap-3">
            <span className="max-w-[180px] text-[11px] leading-5 text-[#8d98a8]">
              下一步只需填最必要的信息
            </span>
            <button
              type="button"
              onClick={() => {
                if (step === 2 && !hasDestination) {
                  setError("请先填写目的地、到达城市或服务地点");
                  return;
                }
                if (
                  step === 3 &&
                  estimateEligible &&
                  !(Number(state.publicPrice) > 0)
                ) {
                  setError("请填写你看到的公开总价");
                  return;
                }
                setError("");
                setStep((value) => value + 1);
              }}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#1769e0] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(23,105,224,0.2)] transition hover:bg-[#104da6] active:scale-95"
            >
              下一步
              <ArrowRight size={17} />
            </button>
          </div>
        ) : null}
      </div>
      <AppBottomNav active="low-price" />
    </div>
  );
}
