import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Clock, Mail, MessageCircle, UserRound } from "lucide-react";
import { Container } from "@/components/Container";
import { prisma } from "@/lib/prisma";
import { AppBottomNav } from "@/components/AppBottomNav";
import { CopyWechat } from "./CopyWechat";

export const dynamic = "force-dynamic";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; subject?: string }>;
}) {
  const params = await searchParams;
  const requestTopic = [params.topic, params.subject]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0)
    ?.trim()
    .slice(0, 80) ?? "";
  const rows = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: ["hotel.qrUrl", "hotel.wechatId", "wechat_qrcode", "contact_email", "contact_phone", "service_hours"],
      },
    },
  });
  const get = (key: string) => rows.find((r) => r.key === key)?.value ?? "";

  const wechatQrcode = get("hotel.qrUrl") || get("wechat_qrcode");
  const storedWechatId = get("hotel.wechatId");
  const storedEmail = get("contact_email");
  const wechatId = /^(traveltong_001|your[_-]?wechat|demo)$/i.test(storedWechatId) ? "" : storedWechatId;
  const contactEmail = /\.demo$/i.test(storedEmail) ? "" : storedEmail;
  const contactPhone = get("contact_phone");
  const serviceHours = get("service_hours");
  const hasDirectContact = Boolean(wechatId || contactEmail || contactPhone);

  return (
    <main className="min-h-screen bg-[#f0f4f8] pb-24 text-[#0f172a]">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/20 bg-white/80 px-4 pt-[max(10px,env(safe-area-inset-top))] shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[56px] max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#0b4fd8]/10">
              <MessageCircle size={15} className="text-[#0b4fd8]" />
            </div>
            <span className="text-sm font-bold text-[#0f172a]">联系客服</span>
          </div>
          <Link href="/member" className="grid h-9 w-9 place-items-center rounded-full bg-[#0b4fd8]/10 text-[#0b4fd8] active:scale-95" aria-label="我的">
            <UserRound size={16} />
          </Link>
        </div>
      </header>

      <Container>
        <div className="pt-[72px]">
          {/* Hero — 虚化图片背景 */}
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0c1e3a] to-[#1a3a6e] px-6 py-8 sm:px-8 sm:py-10">
            <div className="absolute inset-0 overflow-hidden">
              <img src="/swimmingpool2.jpg" alt="" className="h-full w-full object-cover opacity-20" style={{ filter: "blur(24px) scale(1.15)" }} />
              <div className="absolute inset-0 bg-gradient-to-br from-[#0c1e3a]/60 to-[#1a3a6e]/60" />
            </div>
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold text-white/90 backdrop-blur">
                <MessageCircle size={13} />客服对接
              </span>
              <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">联系旅途客服</h1>
              <p className="mt-3 text-sm leading-6 text-white/70">
                提交酒店、目的地、日期、人数和预算，客服会结合实际库存与服务规则继续确认。
              </p>
              {requestTopic ? <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-[12px] text-white/88 backdrop-blur">本次咨询：<strong>{requestTopic}</strong></div> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {["需求整理", "方案报价", "人工确认行程"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {/* 微信 */}
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
              <div className="text-[14px] font-bold text-[#0f172a]">微信客服</div>
              <div className="mt-4 flex justify-center rounded-2xl border border-dashed border-[#e2e8f0] bg-[#f8fafc] p-6 sm:p-8">
                {wechatQrcode ? (
                  <div className="relative h-52 w-52 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#e2e8f0]">
                    <Image src={wechatQrcode} alt="微信客服二维码" fill className="object-contain" unoptimized />
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-[#e8f0fe] text-2xl font-bold text-[#0b4fd8]">微</div>
                    <div className="mt-3 text-sm font-semibold text-[#0f172a]">{wechatId ? "可复制下方微信号添加客服" : "微信客服正在配置"}</div>
                    <div className="mt-1 text-[12px] text-[#94a3b8]">也可以先提交需求，我们会在站内同步进度</div>
                  </div>
                )}
              </div>
              <p className="mt-4 text-[13px] leading-6 text-[#64748b]">
                {wechatQrcode ? "扫码添加客服微信" : wechatId ? "复制下方微信号添加客服" : "先提交旅行需求"}，说明出发地、目的地、日期、人数与预算；实际方案与报价由顾问核实。
              </p>
              {wechatId ? <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[#f8fafc] p-3 ring-1 ring-[#e2e8f0]"><div><p className="text-[10px] text-[#94a3b8]">客服微信号</p><p className="mt-1 text-[13px] font-semibold text-[#0f172a]">{wechatId}</p></div><CopyWechat value={wechatId}/></div> : null}
              <Link
                href={`/inquiry${requestTopic ? `?service=combo&subject=${encodeURIComponent(requestTopic)}` : ""}`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#0b4fd8] px-4 py-3 text-[14px] font-bold text-white shadow-[0_10px_20px_-8px_rgba(232,99,46,0.6)] active:scale-[0.98]"
              >
                先去填写查价信息
              </Link>
            </section>

            {/* 联系方式 */}
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.04]">
              <div className="text-[14px] font-bold text-[#0f172a]">联系方式</div>
              <div className="mt-4 space-y-3">
                {contactEmail ? <div className="flex items-center gap-3 rounded-xl bg-[#f8fafc] px-4 py-3 ring-1 ring-[#e2e8f0]">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#0b4fd8] ring-1 ring-[#e2e8f0]">
                    <Mail size={16} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] text-[#94a3b8]">邮箱</div>
                    <div className="truncate font-semibold text-[#0f172a]">{contactEmail}</div>
                  </div>
                </div> : null}
                {contactPhone ? <div className="flex items-center gap-3 rounded-xl bg-[#f8fafc] px-4 py-3 ring-1 ring-[#e2e8f0]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#0b4fd8] ring-1 ring-[#e2e8f0]">电</span><div><div className="text-[11px] text-[#94a3b8]">客服电话</div><a href={`tel:${contactPhone}`} className="font-semibold text-[#0f172a]">{contactPhone}</a></div></div> : null}
                {serviceHours ? <div className="flex items-center gap-3 rounded-xl bg-[#f8fafc] px-4 py-3 ring-1 ring-[#e2e8f0]">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#0b4fd8] ring-1 ring-[#e2e8f0]">
                    <Clock size={16} />
                  </span>
                  <div>
                    <div className="text-[11px] text-[#94a3b8]">服务时段</div>
                    <div className="font-semibold text-[#0f172a]">{serviceHours}</div>
                  </div>
                </div> : null}
                {!hasDirectContact ? <div className="rounded-xl border border-dashed border-[#d7e3ef] bg-[#f8fafc] px-4 py-5 text-center text-[12px] leading-6 text-[#64748b]">公开联系方式尚未配置。请先提交需求，登录后可在需求中心查看顾问反馈。</div> : null}
              </div>

              <div className="mt-5 rounded-xl bg-[#e8f0fe] p-4 ring-1 ring-blue-100">
                <div className="text-[13px] font-bold text-[#0f172a]">响应说明</div>
                <ul className="mt-3 space-y-1.5 pl-5 text-[12px] leading-6 text-[#64748b]">
                  <li>每份报价会标注包含项、不含项、价格有效期与退改规则。</li>
                  <li>节假日与会展档库存变化快，建议提前锁核心交通和酒店。</li>
                  <li>复杂订单与企业客户建议进入人工顾问流程。</li>
                  <li>售后问题请附上订单号、截图与预期处理方式。</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </Container>
      <AppBottomNav active="services" />
    </main>
  );
}
