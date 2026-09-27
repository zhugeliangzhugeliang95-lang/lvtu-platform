import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import {
  PlatformFrame,
  Price,
  StatusBadge,
} from "@/components/platform/Catalog";
import { getPublicTour } from "@/lib/catalog/tours";
import { TourConsultActions } from "@/components/tours/TourConsultActions";

function destinationFacts(destination: string) {
  if (/九寨/.test(destination)) return ["九寨沟以高山湖泊、瀑布与彩林见长，秋季早晚温差较大。", "景区游览时间和交通安排会受客流、天气与开放情况影响。", "建议准备防晒、保暖和舒适步行鞋，具体入园规则由顾问行前确认。"];
  if (/四姑娘|稻城|康定|川西/.test(destination)) return ["川西线路海拔变化明显，雪山、峡谷、草甸与藏地人文是主要看点。", "长距离行车和高原环境对体力有要求，应预留休息并避免剧烈活动。", "景区开放、道路管制与天气变化较快，实际游览顺序以出团通知为准。"];
  if (/喀纳斯|禾木|赛里木|阿尔泰|北疆/.test(destination)) return ["北疆秋季以湖泊、白桦林、草原与村落景观为主，昼夜温差大。", "景点间距离较长，行程会有较多乘车时间，适合偏好自然风光的旅行者。", "景区住宿、道路与天气变化较大，班期和实际安排需由顾问逐项确认。"];
  return ["页面内容用于帮助了解目的地与线路方向。", "具体班期、名额、住宿与服务内容以顾问最终确认为准。"];
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tour = await getPublicTour(slug);
  if (!tour)
    return (
      <PlatformFrame title="未找到产品" back="/tours">
        <div className="p-8 text-center">
          该旅行团暂时下架。
          <Link href="/tours" className="ml-2 text-[var(--app-blue)]">
            返回列表
          </Link>
        </div>
      </PlatformFrame>
    );
  return (
    <PlatformFrame
      title="旅行团详情"
      subtitle={tour.destination}
      back="/tours"
      active="discover"
    >
      <section className="relative h-[280px]">
        <img
          src={tour.image}
          alt={tour.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061d3c]/90 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <div className="flex flex-wrap gap-2">
            {tour.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-white/16 px-3 py-1 text-[10px] backdrop-blur"
              >
                {t}
              </span>
            ))}
          </div>
          <h1 className="mt-3 text-[25px] font-semibold">{tour.name}</h1>
          <p className="mt-2 flex items-center gap-1 text-[11px] text-white/75">
            <MapPin size={13} />
            {tour.departure}出发 · {tour.days}天 · {tour.type}
          </p>
        </div>
      </section>
      <section className="px-5 py-6">
        <div className="flex items-end justify-between border-b border-[var(--app-line)] pb-5">
          <div>
            <p className="text-[11px] text-[var(--app-muted)]">
              {tour.priceState === "CONFIRMED" ? "最终确认价" : tour.priceState === "ESTIMATED" ? "预估价" : "参考价 · 待确认"}
            </p>
            <Price value={tour.price} state={tour.priceState} />
          </div>
          <StatusBadge>合作旅行社履约</StatusBadge>
        </div>
        <p className="py-5 text-[13px] leading-6 text-[#53677e]">
          {tour.summary}
        </p>
        <div className="grid grid-cols-3 gap-2 pb-5">
          <div className="rounded-[16px] bg-[#f4f8fc] p-3 text-center">
            <p className="text-[9px] text-[var(--app-muted)]">产品编号</p>
            <p className="mt-1 truncate text-[10px] font-semibold">
              TG-{tour.slug.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="rounded-[16px] bg-[#f4f8fc] p-3 text-center">
            <p className="text-[9px] text-[var(--app-muted)]">适合人群</p>
            <p className="mt-1 truncate text-[10px] font-semibold">
              {tour.audience.split("、")[0]}
            </p>
          </div>
          <div className="rounded-[16px] bg-[#f4f8fc] p-3 text-center">
            <p className="text-[9px] text-[var(--app-muted)]">服务方式</p>
            <p className="mt-1 text-[10px] font-semibold">顾问确认</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-[18px] bg-[#eef7ff] p-4">
          <ShieldCheck size={19} className="mt-0.5 text-[var(--app-blue)]" />
          <p className="text-[11px] leading-5 text-[#53677e]">
            履约主体为具备相应资质的合作旅行社，具体名称、许可证信息和服务边界会在报名确认单与合同中明确。旅途负责需求整理、进度跟进与售后协助。
          </p>
        </div>
        <h2 className="mt-8 text-[20px] font-semibold">可咨询班期</h2>
        <p className="mt-1 text-[10px] text-[var(--app-muted)]">
          页面状态为咨询参考，最终名额与价格由顾问人工确认。
        </p>
        <div className="mt-4 space-y-3">
          {tour.departures.length ? tour.departures.map((d) => (
            <div
              key={d.date}
              className="app-card flex items-center gap-3 p-4"
            >
              <CalendarDays size={20} className="text-[var(--app-blue)]" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold">{d.date}</p>
                <p className="mt-1 text-[10px] text-[var(--app-muted)]">
                  成人 ¥{d.price.toLocaleString()} / 人参考
                </p>
              </div>
              <span
                className={`text-[10px] font-semibold ${d.status === "名额紧张" ? "text-[#d68b18]" : "text-[#19884b]"}`}
              >
                {d.status}
              </span>
            </div>
          )) : <div className="app-card px-5 py-6 text-center"><CalendarDays size={22} className="mx-auto text-[var(--app-blue)]" /><p className="mt-3 text-[13px] font-semibold">班期待发布</p><p className="mt-1 text-[10px] leading-5 text-[var(--app-muted)]">可通过页面底部企业微信入口咨询最新日期、名额和参考价格。</p></div>}
        </div>
        <h2 className="mt-8 text-[20px] font-semibold">目的地资料</h2>
        <div className="app-card mt-4 space-y-3 p-4">
          {destinationFacts(tour.destination).map((fact) => <p key={fact} className="flex gap-2 text-[11px] leading-5 text-[#53677e]"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--app-blue)]" />{fact}</p>)}
        </div>
        <h2 className="mt-8 text-[20px] font-semibold">每日行程</h2>
        <div className="mt-4 space-y-4">
          {tour.itinerary.length ? tour.itinerary.map((day) => (
            <div key={day.day} className="flex gap-3">
              <div className="w-12 shrink-0 text-[11px] font-semibold text-[var(--app-blue)]">
                {day.day}
              </div>
              <div className="flex-1 border-b border-[var(--app-line)] pb-4">
                <h3 className="text-[14px] font-semibold">{day.title}</h3>
                <p className="mt-1 text-[10px] text-[var(--app-muted)]">
                  {day.city}
                </p>
                <p className="mt-2 text-[12px] leading-5 text-[#53677e]">
                  {day.detail}
                </p>
              </div>
            </div>
          )) : <div className="app-card px-5 py-7 text-center"><p className="text-[13px] font-semibold">详细行程正在整理</p><p className="mt-2 text-[10px] leading-5 text-[var(--app-muted)]">顾问会根据正式班期和资源确认完整的每日安排。</p></div>}
        </div>
        <h2 className="mt-8 text-[20px] font-semibold">住宿与交通</h2>
        <div className="app-card mt-4 divide-y divide-[#edf3f8] px-4">
          <div className="py-4">
            <p className="text-[12px] font-semibold">住宿安排</p>
            <p className="mt-2 text-[10px] leading-5 text-[var(--app-muted)]">
              行程所列城市的精选住宿，具体酒店与房型以出团确认单为准；如需单房请咨询补差。
            </p>
          </div>
          <div className="py-4">
            <p className="text-[12px] font-semibold">行程交通</p>
            <p className="mt-2 text-[10px] leading-5 text-[var(--app-muted)]">
              包含行程中标注的当地交通；往返大交通、接送范围与行李规则以报价说明为准。
            </p>
          </div>
        </div>
        <h2 className="mt-8 text-[20px] font-semibold">费用与规则</h2>
        <div className="mt-4 space-y-3">
          <div className="rounded-[18px] bg-[#eef8f1] p-4 text-[11px] leading-5 text-[#397052]">
            <CheckCircle2 size={15} className="mr-1 inline" />
            <strong>费用包含：</strong>
            行程中约定的住宿、当地交通、已标注门票或体验及旅行服务。
          </div>
          <div className="rounded-[18px] bg-[#fff8e8] p-4 text-[11px] leading-5 text-[#86693b]">
            <strong>费用不含：</strong>
            往返大交通（如未注明）、个人消费、单房差、签证及页面未标注项目。退改规则以正式报价、确认单和合同为准。
          </div>
        </div>
        <h2 className="mt-8 text-[20px] font-semibold">常见问题</h2>
        <div className="app-card mt-4 divide-y divide-[#edf3f8] px-4">
          {[
            [
              "页面价格就是最终价格吗？",
              "不是。页面为参考价，顾问确认名额、房态和交通后发送正式报价。",
            ],
            [
              "可以调整行程或增加服务吗？",
              "可以在咨询时说明需求，顾问会评估能否调整及相应费用。",
            ],
            [
              "什么时候算报名成功？",
              "确认报价、签署相应确认文件并按约完成付款后，才进入正式履约。",
            ],
          ].map(([q, a]) => (
            <div key={q} className="py-4">
              <p className="text-[12px] font-semibold">{q}</p>
              <p className="mt-2 text-[10px] leading-5 text-[var(--app-muted)]">
                {a}
              </p>
            </div>
          ))}
        </div>
      </section>
      <div className="fixed inset-x-0 bottom-[76px] z-30 px-3">
        <TourConsultActions name={tour.name} destination={tour.destination} departure={tour.departure} days={tour.days} price={tour.price} departureDates={tour.departures.map((item) => item.date)} />
      </div>
    </PlatformFrame>
  );
}
