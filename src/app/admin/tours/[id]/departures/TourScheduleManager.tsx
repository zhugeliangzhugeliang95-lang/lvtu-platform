"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, CheckCircle2, MapPinned, Save } from "lucide-react";

type DepartureStatus = "OPEN" | "ALMOST_FULL" | "SOLD_OUT" | "CLOSED" | "PENDING_CONFIRMATION";
type Departure = {
  id: string;
  departureDate: string;
  adultPrice: number;
  childPrice: number | null;
  singleRoomDiff: number | null;
  capacity: number | null;
  booked: number;
  status: DepartureStatus;
  cutoffAt: string | null;
  note: string | null;
};
type ItineraryDay = {
  id: string;
  day: number;
  title: string;
  city: string | null;
  attractions: string | null;
  transport: string | null;
  meals: string | null;
  hotel: string | null;
  detail: string | null;
};

const fieldClass = "mt-1.5 h-10 w-full rounded-lg border border-[#dfe5ee] bg-white px-3 text-sm outline-none transition focus:border-[#1769e0] focus:ring-4 focus:ring-[#1769e0]/10";
const STATUS_LABEL: Record<DepartureStatus, string> = { OPEN: "可报名", ALMOST_FULL: "名额紧张", SOLD_OUT: "售罄", CLOSED: "已截止", PENDING_CONFIRMATION: "待确认" };

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text ? Number(text) : null;
}

export function TourScheduleManager({ product, initialDepartures, initialItinerary }: {
  product: { id: string; name: string; days: number; status: string };
  initialDepartures: Departure[];
  initialItinerary: ItineraryDay[];
}) {
  const router = useRouter();
  const [departures, setDepartures] = useState(initialDepartures);
  const [itinerary, setItinerary] = useState(initialItinerary);
  const [saving, setSaving] = useState<"departure" | "itinerary" | null>(null);
  const [message, setMessage] = useState("");

  async function addDeparture(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSaving("departure");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/tours/${product.id}/departures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departureDate: values.get("departureDate"),
          adultPrice: Number(values.get("adultPrice")),
          childPrice: optionalNumber(values.get("childPrice")),
          singleRoomDiff: optionalNumber(values.get("singleRoomDiff")),
          capacity: optionalNumber(values.get("capacity")),
          status: values.get("status"),
          cutoffAt: values.get("cutoffAt") || null,
          note: values.get("note"),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "班期保存失败");
      setDepartures((current) => [...current, { ...data.item, departureDate: String(data.item.departureDate), cutoffAt: data.item.cutoffAt || null }].sort((a, b) => a.departureDate.localeCompare(b.departureDate)));
      form.reset();
      setMessage("班期已保存，前台会显示在该产品详情中");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "班期保存失败");
    } finally {
      setSaving(null);
    }
  }

  async function saveItinerary(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSaving("itinerary");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/tours/${product.id}/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day: Number(values.get("day")),
          title: values.get("title"),
          city: values.get("city"),
          attractions: values.get("attractions"),
          transport: values.get("transport"),
          meals: values.get("meals"),
          hotel: values.get("hotel"),
          detail: values.get("detail"),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "行程保存失败");
      setItinerary((current) => [...current.filter((item) => item.day !== data.item.day), data.item].sort((a, b) => a.day - b.day));
      form.reset();
      setMessage(`第 ${data.item.day} 天行程已保存`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "行程保存失败");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#dce8f6] bg-[#f4f9ff] px-4 py-3 text-sm text-[#315d88]">
        <CheckCircle2 className="h-4 w-4 text-[#1769e0]" />
        <span>产品当前为 <strong>{product.status === "ONLINE" ? "已上架" : product.status === "DRAFT" ? "草稿" : "已下架"}</strong>，计划行程 {product.days} 天。</span>
      </div>
      {message ? <div className="rounded-xl border border-[#cfe0f5] bg-[#edf6ff] px-4 py-3 text-sm text-[#195e9f]" role="status">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#e4eaf2] bg-white p-5 shadow-[0_10px_30px_rgba(22,57,92,.04)]">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf1ff] text-[#1769e0]"><CalendarPlus className="h-5 w-5" /></span><div><h2 className="font-semibold text-[#172033]">新增班期</h2><p className="mt-0.5 text-xs text-[#667085]">价格以元 / 人填写，为页面参考价。</p></div></div>
          <form onSubmit={addDeparture} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-[#344054]">出发日期<input name="departureDate" type="date" required className={fieldClass} /></label>
            <label className="text-xs font-medium text-[#344054]">报名截止日期<input name="cutoffAt" type="date" className={fieldClass} /></label>
            <label className="text-xs font-medium text-[#344054]">成人价<input name="adultPrice" type="number" min="1" required placeholder="3999" className={fieldClass} /></label>
            <label className="text-xs font-medium text-[#344054]">儿童价<input name="childPrice" type="number" min="0" placeholder="可留空" className={fieldClass} /></label>
            <label className="text-xs font-medium text-[#344054]">单房差<input name="singleRoomDiff" type="number" min="0" placeholder="可留空" className={fieldClass} /></label>
            <label className="text-xs font-medium text-[#344054]">总名额<input name="capacity" type="number" min="1" max="999" placeholder="如 20" className={fieldClass} /></label>
            <label className="text-xs font-medium text-[#344054]">班期状态<select name="status" defaultValue="OPEN" className={fieldClass}>{Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="text-xs font-medium text-[#344054] sm:col-span-2">班期备注<input name="note" maxLength={500} placeholder="如：成团人数、特别说明" className={fieldClass} /></label>
            <button disabled={saving !== null} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1769e0] px-4 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2"><Save className="h-4 w-4" />{saving === "departure" ? "保存中…" : "保存班期"}</button>
          </form>
        </section>

        <section className="rounded-2xl border border-[#e4eaf2] bg-white p-5 shadow-[0_10px_30px_rgba(22,57,92,.04)]">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf7f3] text-[#12815b]"><MapPinned className="h-5 w-5" /></span><div><h2 className="font-semibold text-[#172033]">添加 / 更新每日行程</h2><p className="mt-0.5 text-xs text-[#667085]">相同天数再次保存会覆盖该天内容。</p></div></div>
          <form onSubmit={saveItinerary} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-[#344054]">第几天<input name="day" type="number" min="1" max={product.days} required placeholder="1" className={fieldClass} /></label>
            <label className="text-xs font-medium text-[#344054]">所在城市<input name="city" placeholder="如：大理" className={fieldClass} /></label>
            <label className="text-xs font-medium text-[#344054] sm:col-span-2">行程标题<input name="title" required minLength={2} placeholder="如：抵达大理 · 古城慢游" className={fieldClass} /></label>
            <label className="text-xs font-medium text-[#344054] sm:col-span-2">景点 / 体验<input name="attractions" placeholder="洱海、喜洲古镇" className={fieldClass} /></label>
            <label className="text-xs font-medium text-[#344054]">交通<input name="transport" placeholder="商务车 / 高铁" className={fieldClass} /></label>
            <label className="text-xs font-medium text-[#344054]">餐食<input name="meals" placeholder="含早餐" className={fieldClass} /></label>
            <label className="text-xs font-medium text-[#344054] sm:col-span-2">住宿<input name="hotel" placeholder="如：大理精品客栈或同级" className={fieldClass} /></label>
            <label className="text-xs font-medium text-[#344054] sm:col-span-2">详细说明<textarea name="detail" maxLength={2000} placeholder="描述当天节奏、活动和注意事项。" className={`${fieldClass} h-24 resize-y py-2.5`} /></label>
            <button disabled={saving !== null} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#12815b] px-4 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2"><Save className="h-4 w-4" />{saving === "itinerary" ? "保存中…" : "保存当天行程"}</button>
          </form>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-[#e4eaf2] bg-white">
          <div className="border-b border-[#edf1f6] px-5 py-4"><h2 className="font-semibold text-[#172033]">现有班期 · {departures.length}</h2></div>
          <div className="divide-y divide-[#edf1f6]">{departures.length ? departures.map((item) => <div key={item.id} className="flex items-start justify-between gap-3 px-5 py-4"><div><p className="text-sm font-semibold text-[#172033]">{new Date(item.departureDate).toLocaleDateString("zh-CN")}</p><p className="mt-1 text-xs text-[#667085]">成人 ¥{item.adultPrice.toLocaleString()}{item.childPrice != null ? ` · 儿童 ¥${item.childPrice.toLocaleString()}` : ""}{item.capacity ? ` · ${item.booked}/${item.capacity} 人` : ""}</p>{item.note ? <p className="mt-1 text-[11px] text-[#98a2b3]">{item.note}</p> : null}</div><span className="shrink-0 rounded-full bg-[#eef4ff] px-2.5 py-1 text-[10px] font-semibold text-[#175cd3]">{STATUS_LABEL[item.status]}</span></div>) : <p className="px-5 py-10 text-center text-sm text-[#98a2b3]">暂无班期，前台会显示“班期待发布”。</p>}</div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-[#e4eaf2] bg-white">
          <div className="border-b border-[#edf1f6] px-5 py-4"><h2 className="font-semibold text-[#172033]">每日行程 · {itinerary.length}/{product.days}</h2></div>
          <div className="divide-y divide-[#edf1f6]">{itinerary.length ? itinerary.map((item) => <div key={item.id} className="flex gap-3 px-5 py-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#eaf7f3] text-xs font-bold text-[#12815b]">D{item.day}</span><div className="min-w-0"><p className="text-sm font-semibold text-[#172033]">{item.title}</p><p className="mt-1 text-xs text-[#667085]">{[item.city, item.attractions, item.hotel].filter(Boolean).join(" · ") || "已保存基础行程"}</p></div></div>) : <p className="px-5 py-10 text-center text-sm text-[#98a2b3]">暂无每日行程，前台会显示“详细行程正在整理”。</p>}</div>
        </section>
      </div>
    </div>
  );
}
