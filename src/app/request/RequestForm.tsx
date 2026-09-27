"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BedDouble,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Headphones,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

type RequirementType =
  | "HOTEL"
  | "FLIGHT"
  | "TRAIN"
  | "ACTIVITY"
  | "CUSTOM_TRIP"
  | "CAR"
  | "PACKAGE"
  | "LOUNGE"
  | "OTHER";

type EstimateDraft = {
  version?: number;
  savedAt?: number;
  destination?: string;
  productType?: string;
  selectedLabels?: string;
  state?: {
    destination?: string;
    fromCity?: string;
    startDate?: string;
    endDate?: string;
    people?: string;
    budget?: string;
    preference?: string;
    notes?: string;
    name?: string;
    phone?: string;
    details?: Record<string, string>;
  };
  estimate?: {
    id?: string;
    marketReferencePrice?: number | null;
    estimatedMinPrice?: number | null;
    estimatedMaxPrice?: number | null;
    confidence?: "HIGH" | "MEDIUM" | "LOW";
    priceStatus?: string;
  } | null;
};

type FormState = {
  type: RequirementType;
  fromCity: string;
  toCity: string;
  departDate: string;
  returnDate: string;
  people: string;
  children: string;
  roomCount: string;
  roomType: string;
  breakfast: string;
  budget: string;
  services: string[];
  contactName: string;
  contactPhone: string;
  wechat: string;
  notes: string;
};

const typeOptions: Array<{ value: RequirementType; label: string }> = [
  { value: "HOTEL", label: "酒店住宿" },
  { value: "FLIGHT", label: "机票" },
  { value: "TRAIN", label: "火车票" },
  { value: "ACTIVITY", label: "门票与玩乐" },
  { value: "CAR", label: "接送与包车" },
  { value: "PACKAGE", label: "酒店套餐" },
  { value: "LOUNGE", label: "贵宾厅" },
  { value: "CUSTOM_TRIP", label: "定制旅行" },
  { value: "OTHER", label: "其他服务" },
];

const typeLabels = Object.fromEntries(typeOptions.map((item) => [item.value, item.label])) as Record<RequirementType, string>;
const today = new Date().toISOString().slice(0, 10);

function normalizeType(value: string | undefined): RequirementType {
  const normalized = String(value || "OTHER").toUpperCase();
  if (normalized === "ROUTE") return "CUSTOM_TRIP";
  return typeOptions.some((item) => item.value === normalized) ? (normalized as RequirementType) : "OTHER";
}

function initialState(initialNotes: string, initialType: string): FormState {
  return {
    type: normalizeType(initialType),
    fromCity: "",
    toCity: "",
    departDate: today,
    returnDate: "",
    people: "2",
    children: "0",
    roomCount: "1",
    roomType: "",
    breakfast: "待顾问确认",
    budget: "",
    services: [],
    contactName: "",
    contactPhone: "",
    wechat: "",
    notes: initialNotes,
  };
}

function money(value: number | null | undefined) {
  return typeof value === "number" ? `¥${value.toLocaleString("zh-CN")}` : "待顾问确认";
}

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <span className="mb-2 flex items-center gap-1 text-[12px] font-semibold text-[#344054]">
      {children}
      {optional ? <span className="font-normal text-[#98a2b3]">（选填）</span> : null}
    </span>
  );
}

const inputClass =
  "min-h-12 w-full rounded-[14px] border border-[#d8e3ef] bg-white px-4 text-[14px] text-[#172033] outline-none transition placeholder:text-[#a8b1be] focus:border-[#1769e0] focus:ring-4 focus:ring-[#1769e0]/8";

export function RequestForm({
  initialNotes,
  initialType,
  restoreEstimate,
}: {
  initialNotes: string;
  initialType: string;
  restoreEstimate: boolean;
}) {
  const [form, setForm] = useState<FormState>(() => initialState(initialNotes, initialType));
  const [draft, setDraft] = useState<EstimateDraft | null>(null);
  const [draftReady, setDraftReady] = useState(!restoreEstimate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState("");

  useEffect(() => {
    if (!restoreEstimate) return;
    try {
      const raw = window.localStorage.getItem("lvtu-estimate-draft");
      if (!raw) return;
      const restored = JSON.parse(raw) as EstimateDraft;
      const state = restored.state || {};
      const details = state.details || {};
      const restoredType = normalizeType(restored.productType);
      setDraft(restored);
      setForm((current) => ({
        ...current,
        type: restoredType,
        fromCity: state.fromCity || details.fromStation || current.fromCity,
        toCity:
          restored.destination ||
          state.destination ||
          details.toCity ||
          details.toStation ||
          details.projectName ||
          details.loungeLocation ||
          details.pickup ||
          current.toCity,
        departDate: state.startDate || current.departDate,
        returnDate: state.endDate || current.returnDate,
        people: state.people || current.people,
        children: details.children || details.childCount || current.children,
        roomCount: details.roomCount || current.roomCount,
        roomType: details.roomType || details.bedType || current.roomType,
        breakfast: details.breakfast || current.breakfast,
        budget: state.budget || current.budget,
        contactName: state.name || current.contactName,
        contactPhone: state.phone || current.contactPhone,
        notes: [state.preference, state.notes, current.notes].filter(Boolean).join("\n"),
      }));
    } catch {
      setError("预估信息恢复失败，请补充本页信息后再提交");
    } finally {
      setDraftReady(true);
    }
  }, [restoreEstimate]);

  const isHotel = form.type === "HOTEL";
  const needsOrigin = ["FLIGHT", "TRAIN", "CAR", "CUSTOM_TRIP"].includes(form.type);
  const hasEstimate = Boolean(
    draft?.estimate?.estimatedMinPrice != null && draft?.estimate?.estimatedMaxPrice != null,
  );
  const dateLabels = useMemo(() => {
    if (isHotel) return { start: "入住日期", end: "退房日期" };
    if (form.type === "ACTIVITY" || form.type === "LOUNGE") return { start: "使用日期", end: "结束日期" };
    return { start: "出发日期", end: "返程日期" };
  }, [form.type, isHotel]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    if (!form.toCity.trim()) return isHotel ? "请填写城市或酒店名称" : "请填写目的地或服务地点";
    if (needsOrigin && !form.fromCity.trim()) return "请填写出发地";
    if (!form.departDate) return `请选择${dateLabels.start}`;
    if (isHotel && !form.returnDate) return "请选择退房日期";
    if (form.returnDate && form.returnDate <= form.departDate) return `${dateLabels.end}需晚于${dateLabels.start}`;
    if (!Number(form.people) || Number(form.people) < 1) return "请填写成人或出行人数";
    if (isHotel && (!Number(form.roomCount) || Number(form.roomCount) < 1)) return "请填写房间数量";
    if (!form.contactName.trim()) return "请填写联系人姓名";
    if (!/^1[3-9]\d{9}$/.test(form.contactPhone.trim())) return "请填写正确的 11 位手机号";
    return "";
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSubmitting(true);
    const details = {
      serviceType: typeLabels[form.type],
      origin: needsOrigin ? form.fromCity.trim() : undefined,
      destination: form.toCity.trim(),
      adults: Number(form.people),
      children: isHotel ? Number(form.children) || 0 : undefined,
      roomCount: isHotel ? Number(form.roomCount) : undefined,
      roomType: isHotel ? form.roomType.trim() || "待顾问确认" : undefined,
      breakfast: isHotel ? form.breakfast : undefined,
      budget: form.budget.trim() || undefined,
      selectedServices: form.services,
      preference: form.notes.trim() || undefined,
      estimateSource: draft ? "旅途预估流程" : undefined,
      selectedLabels: draft?.selectedLabels,
    };
    const lines = [
      `${typeLabels[form.type]}需求`,
      needsOrigin ? `出发地：${form.fromCity.trim()}` : null,
      `${isHotel ? "城市/酒店" : "目的地/服务地点"}：${form.toCity.trim()}`,
      `${dateLabels.start}：${form.departDate}`,
      form.returnDate ? `${dateLabels.end}：${form.returnDate}` : null,
      `${isHotel ? "成人数量" : "出行人数"}：${form.people}`,
      isHotel ? `儿童数量：${form.children || "0"}` : null,
      isHotel ? `房间数量：${form.roomCount}` : null,
      isHotel ? `房型/床型：${form.roomType.trim() || "待顾问确认"}` : null,
      isHotel ? `早餐需求：${form.breakfast}` : null,
      form.budget.trim() ? `预算：${form.budget.trim()}` : null,
      form.notes.trim() ? `偏好与特殊要求：${form.notes.trim()}` : null,
    ].filter(Boolean);

    try {
      const response = await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          productName: draft?.selectedLabels || typeLabels[form.type],
          destination: form.toCity.trim(),
          startDate: form.departDate,
          endDate: form.returnDate || null,
          partySize: Number(form.people),
          content: lines.join("\n"),
          detailsJson: JSON.stringify(details),
          contactName: form.contactName.trim(),
          contactPhone: form.contactPhone.trim(),
          wechat: form.wechat.trim() || null,
          estimateId: draft?.estimate?.id,
          marketReferencePrice: draft?.estimate?.marketReferencePrice,
          estimatedMinPrice: draft?.estimate?.estimatedMinPrice,
          estimatedMaxPrice: draft?.estimate?.estimatedMaxPrice,
          estimateConfidence: draft?.estimate?.confidence,
          priceStatus: "PENDING_CONFIRMATION",
        }),
      });
      const result = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !result.id) throw new Error(result.error || "提交失败，请稍后再试");
      window.localStorage.removeItem("lvtu-estimate-draft");
      setCreatedId(result.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "提交失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  }

  if (createdId) {
    return (
      <section className="px-5 py-7">
        <div className="animate-rise-in overflow-hidden rounded-[24px] bg-[#0d315d] px-5 py-6 text-white shadow-[0_18px_46px_rgba(13,49,93,.18)]">
          <div className="grid size-12 place-items-center rounded-[16px] bg-[#1683ff]">
            <Check size={24} strokeWidth={2.5} />
          </div>
          <p className="mt-5 text-[11px] font-semibold tracking-[.12em] text-[#9ed0ff]">需求提交成功</p>
          <h2 className="mt-2 text-[25px] font-semibold tracking-[-.02em]">正在为你确认方案</h2>
          <p className="mt-3 text-[12px] leading-6 text-white/70">
            旅行顾问正在根据你的日期、{isHotel ? "房型" : "出行"}和服务要求确认实际可订方案。
          </p>
        </div>

        <div className="mt-6 rounded-[22px] border border-[#dce8f4] bg-white p-5">
          {[
            { label: "需求已提交", state: "done" },
            { label: "顾问确认中", state: "active" },
            { label: "最终报价", state: "pending" },
            { label: "确认预订", state: "pending" },
          ].map((item, index) => (
            <div key={item.label} className="relative flex min-h-14 gap-3 last:min-h-0">
              {index < 3 ? <span className="absolute left-[11px] top-7 h-[30px] w-px bg-[#dce6f1]" /> : null}
              {item.state === "done" ? (
                <CheckCircle2 size={23} className="relative z-10 shrink-0 bg-white text-[#1b9a5a]" />
              ) : item.state === "active" ? (
                <span className="relative z-10 mt-0.5 grid size-[23px] shrink-0 place-items-center rounded-full bg-[#1769e0] shadow-[0_0_0_5px_#eaf3ff]">
                  <span className="size-2 rounded-full bg-white" />
                </span>
              ) : (
                <Circle size={23} className="relative z-10 shrink-0 bg-white text-[#c6d0dc]" />
              )}
              <div className="pt-0.5">
                <p className={`text-[13px] font-semibold ${item.state === "pending" ? "text-[#98a2b3]" : "text-[#172033]"}`}>
                  {item.label}
                </p>
                {item.state === "active" ? <p className="mt-1 text-[10px] text-[#667085]">顾问会在站内通知中同步进展</p> : null}
              </div>
            </div>
          ))}
        </div>

        <Link href={`/member/requests/${createdId}`} className="mt-5 flex min-h-14 items-center justify-between rounded-[17px] bg-[#1769e0] px-5 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(23,105,224,.2)] transition active:scale-[.98]">
          查看我的需求 <ArrowRight size={17} />
        </Link>
        <a href="https://work.weixin.qq.com/kfid/kfc7e290edd33f220d2" target="_blank" rel="noreferrer" className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-[16px] border border-[#b9e8cf] bg-white text-[12px] font-semibold text-[#08783d]">
          <Headphones size={16} className="text-[#1769e0]" /> 联系微信客服
        </a>
      </section>
    );
  }

  if (!draftReady) {
    return <div className="grid min-h-[360px] place-items-center"><Loader2 className="animate-spin text-[#1769e0]" /></div>;
  }

  return (
    <form onSubmit={submit} className="px-5 py-6">
      {draft ? (
        <section className="animate-rise-in overflow-hidden rounded-[22px] bg-[#0d315d] text-white shadow-[0_16px_38px_rgba(13,49,93,.16)]">
          <div className="px-5 py-5">
            <div className="flex items-center gap-2 text-[10px] font-semibold text-[#9ed0ff]">
              <Sparkles size={14} /> 已带入旅途预估信息
            </div>
            <h2 className="mt-3 text-[20px] font-semibold">{draft.selectedLabels || typeLabels[form.type]}</h2>
            <p className="mt-1.5 text-[11px] text-white/60">{form.toCity || "目的地待补充"} · {form.people} 人</p>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
              <div>
                <p className="text-[9px] text-white/48">公开市场参考</p>
                <p className="mt-1 text-[16px] font-semibold">{money(draft.estimate?.marketReferencePrice)}</p>
              </div>
              <div>
                <p className="text-[9px] text-[#9ed0ff]">旅途预估</p>
                <p className="mt-1 text-[16px] font-semibold">
                  {hasEstimate
                    ? `${money(draft.estimate?.estimatedMinPrice)}～${money(draft.estimate?.estimatedMaxPrice)}`
                    : "由顾问确认"}
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 bg-white/5 px-5 py-3 text-[9px] leading-5 text-white/58">
            这是预估结果，不是售价。提交后顾问会确认库存、规格、退改规则和最终价格。
          </div>
        </section>
      ) : (
        <section className="rounded-[20px] border border-[#dce8f4] bg-[#f5f9ff] p-4">
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#e3f0ff] text-[#1769e0]"><ShieldCheck size={19} /></span>
            <div><h2 className="text-[13px] font-semibold">提交后由旅行顾问人工确认</h2><p className="mt-1 text-[10px] leading-5 text-[#667085]">不会自动扣款；最终方案确认后，你再决定是否预订。</p></div>
          </div>
        </section>
      )}

      <section className="mt-7">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-[10px] font-bold tracking-[.12em] text-[#1769e0]">01 · 服务信息</p><h2 className="mt-1 text-[19px] font-semibold">确认这次旅行需求</h2></div>
          <span className="text-[10px] text-[#98a2b3]">* 为必填项</span>
        </div>

        <div className="mt-4 grid gap-4 rounded-[22px] border border-[#e0e8f1] bg-white p-4 shadow-[0_8px_24px_rgba(13,49,93,.04)] sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <FieldLabel>服务类型 *</FieldLabel>
            <div className="relative">
              <select value={form.type} onChange={(event) => update("type", event.target.value as RequirementType)} className={`${inputClass} appearance-none pr-10`}>
                {typeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#667085]" />
            </div>
          </label>

          {needsOrigin ? (
            <label className="block">
              <FieldLabel>出发地 *</FieldLabel>
              <div className="relative"><MapPin size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8ca0b5]" /><input value={form.fromCity} onChange={(event) => update("fromCity", event.target.value)} placeholder="例如：广州" className={`${inputClass} pl-11`} /></div>
            </label>
          ) : null}

          <label className={`block ${needsOrigin ? "" : "sm:col-span-2"}`}>
            <FieldLabel>{isHotel ? "城市或酒店名称 *" : "目的地或服务地点 *"}</FieldLabel>
            <div className="relative"><MapPin size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8ca0b5]" /><input value={form.toCity} onChange={(event) => update("toCity", event.target.value)} placeholder={isHotel ? "例如：三亚 / 海棠湾酒店" : "例如：三亚 / 广州长隆"} className={`${inputClass} pl-11`} /></div>
          </label>

          <label className="block">
            <FieldLabel>{dateLabels.start} *</FieldLabel>
            <input type="date" min={today} value={form.departDate} onChange={(event) => update("departDate", event.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <FieldLabel optional={!isHotel}>{dateLabels.end}{isHotel ? " *" : ""}</FieldLabel>
            <input type="date" min={form.departDate || today} value={form.returnDate} onChange={(event) => update("returnDate", event.target.value)} className={inputClass} />
          </label>

          <label className="block">
            <FieldLabel>{isHotel ? "成人数量 *" : "出行人数 *"}</FieldLabel>
            <div className="relative"><UsersRound size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8ca0b5]" /><input inputMode="numeric" value={form.people} onChange={(event) => update("people", event.target.value.replace(/\D/g, "").slice(0, 2))} className={`${inputClass} pl-11`} /></div>
          </label>
          {isHotel ? (
            <label className="block">
              <FieldLabel>儿童数量</FieldLabel>
              <input inputMode="numeric" value={form.children} onChange={(event) => update("children", event.target.value.replace(/\D/g, "").slice(0, 2))} className={inputClass} />
            </label>
          ) : null}

          {isHotel ? <>
            <label className="block">
              <FieldLabel>房间数量 *</FieldLabel>
              <div className="relative"><BedDouble size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8ca0b5]" /><input inputMode="numeric" value={form.roomCount} onChange={(event) => update("roomCount", event.target.value.replace(/\D/g, "").slice(0, 2))} className={`${inputClass} pl-11`} /></div>
            </label>
            <label className="block">
              <FieldLabel optional>房型 / 床型</FieldLabel>
              <input value={form.roomType} onChange={(event) => update("roomType", event.target.value)} placeholder="例如：海景大床房" className={inputClass} />
            </label>
            <label className="block sm:col-span-2">
              <FieldLabel>早餐需求</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {["需要早餐", "不需要早餐", "待顾问确认"].map((option) => (
                  <button key={option} type="button" onClick={() => update("breakfast", option)} className={`min-h-11 rounded-[13px] border px-2 text-[11px] font-semibold transition active:scale-[.98] ${form.breakfast === option ? "border-[#1769e0] bg-[#edf5ff] text-[#104da6]" : "border-[#dce5ef] bg-white text-[#667085]"}`}>{option}</button>
                ))}
              </div>
            </label>
          </> : null}

          <label className="block sm:col-span-2">
            <FieldLabel optional>预算范围</FieldLabel>
            <input value={form.budget} onChange={(event) => update("budget", event.target.value)} placeholder="例如：总预算 5000 元，或先看方案" className={inputClass} />
          </label>
          <label className="block sm:col-span-2">
            <FieldLabel optional>{isHotel ? "特殊要求" : "偏好与补充说明"}</FieldLabel>
            <textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} rows={4} placeholder={isHotel ? "例如：高楼层、安静、带儿童、需要连通房" : "告诉顾问时间、规格或其他偏好"} className={`${inputClass} resize-none py-3 leading-6`} />
          </label>
        </div>
      </section>

      <section className="mt-7">
        <p className="text-[10px] font-bold tracking-[.12em] text-[#1769e0]">02 · 联系方式</p>
        <h2 className="mt-1 text-[19px] font-semibold">方便顾问向你确认</h2>
        <p className="mt-1 text-[10px] leading-5 text-[#667085]">仅用于本次需求沟通和订单服务。</p>
        <div className="mt-4 grid gap-4 rounded-[22px] border border-[#e0e8f1] bg-white p-4 shadow-[0_8px_24px_rgba(13,49,93,.04)] sm:grid-cols-2">
          <label className="block"><FieldLabel>联系人 *</FieldLabel><input autoComplete="name" value={form.contactName} onChange={(event) => update("contactName", event.target.value)} placeholder="怎么称呼你" className={inputClass} /></label>
          <label className="block"><FieldLabel>手机号 *</FieldLabel><input autoComplete="tel" inputMode="numeric" value={form.contactPhone} onChange={(event) => update("contactPhone", event.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="用于接收进度通知" className={inputClass} /></label>
          <label className="block sm:col-span-2"><FieldLabel optional>微信号</FieldLabel><input autoComplete="off" value={form.wechat} onChange={(event) => update("wechat", event.target.value)} placeholder="便于顾问补充确认复杂需求" className={inputClass} /></label>
        </div>
      </section>

      {error ? <p role="alert" className="mt-4 rounded-[14px] border border-[#ffd8d8] bg-[#fff4f4] px-4 py-3 text-[11px] font-medium text-[#b33434]">{error}</p> : null}

      <div className="mt-5 rounded-[17px] bg-[#eef7ff] p-4 text-[10px] leading-5 text-[#53677e]">
        <div className="flex gap-2.5"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#1769e0]" /><p>提交后进入“顾问确认中”。最终价格、库存、服务规格和退改规则会在最终确认方案中单独展示，由你确认后才进入付款。</p></div>
      </div>

      <button disabled={submitting} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-[17px] bg-[#1769e0] px-5 text-[14px] font-semibold text-white shadow-[0_12px_28px_rgba(23,105,224,.22)] transition hover:bg-[#105ac4] active:scale-[.98] disabled:opacity-55">
        {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
        {submitting ? "正在提交" : "提交并让顾问确认"}
      </button>
      <p className="mt-3 text-center text-[9px] leading-4 text-[#98a2b3]">提交即表示你同意顾问就本次需求与你联系</p>
    </form>
  );
}
