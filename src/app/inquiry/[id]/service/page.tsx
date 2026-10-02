"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight, Shield, Zap, Users, Clock } from "lucide-react";

const ADVANTAGES = [
  {
    icon: Shield,
    title: "协议渠道保障",
    desc: "与多家连锁酒店及批发商建立协议关系，有机会拿到低于公开售价的报价",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: Users,
    title: "人工核价服务",
    desc: "1 对 1 顾问陪伴，从需求确认到出行结束，全程跟进不撒手",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    icon: Zap,
    title: "快速响应",
    desc: "提交需求后顾问通常在 30 分钟内与您联系，节省您大量比价时间",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    icon: Clock,
    title: "锁价承诺",
    desc: "顾问确认后会明确报价有效期、库存条件与退改规则",
    color: "text-teal-500",
    bg: "bg-teal-50",
  },
];

const HOW_IT_WORKS = [
  { step: "01", text: "填写出行需求（已完成）" },
  { step: "02", text: "查看参考价格（已完成）" },
  { step: "03", text: "提交联系方式" },
  { step: "04", text: "顾问联系您，确认报价" },
  { step: "05", text: "确认预订，进入履约" },
];

export default function ServicePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  return (
    <div className="min-h-screen bg-[#f0f4ff]">
      {/* 顶部 */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button type="button" onClick={() => router.back()} className="p-1 -ml-1 text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-semibold text-gray-800 flex-1">旅途如何为您服务</h1>
      </div>

      <div className="px-4 pb-32 pt-4 space-y-4">
        {/* 核心卖点 */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-md">
          <p className="text-lg font-bold mb-1">我们帮您找到更低价</p>
          <p className="text-sm text-blue-100 leading-relaxed">
            通过协议渠道和专业顾问，旅途通常能找到比公开平台更划算的住宿方案，同时提供全程服务保障。
          </p>
          <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
            <CheckCircle2 size={14} className="text-blue-200" />
            <p className="text-xs text-blue-100">已为 3,000+ 客户提供出行服务</p>
          </div>
        </div>

        {/* 服务优势 */}
        <div className="space-y-3">
          <p className="text-xs text-gray-500 font-medium px-1">为什么选择旅途</p>
          {ADVANTAGES.map((adv) => (
            <div key={adv.title} className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl ${adv.bg} flex items-center justify-center flex-shrink-0`}>
                <adv.icon size={18} className={adv.color} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">{adv.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{adv.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 流程说明 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-800 mb-4">服务流程</p>
          <div className="space-y-3">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i < 2
                      ? "bg-blue-500 text-white"
                      : i === 2
                      ? "bg-blue-100 text-blue-600 ring-2 ring-blue-400"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i < 2 ? <CheckCircle2 size={14} /> : item.step}
                </div>
                <p className={`text-sm ${i < 2 ? "text-gray-400 line-through" : i === 2 ? "text-blue-600 font-medium" : "text-gray-600"}`}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 免责说明 */}
        <div className="bg-gray-50 rounded-2xl p-4 text-xs text-gray-400 leading-relaxed">
          <p>旅途会竭尽所能为你寻找高性价比方案，最终价格、库存和服务规格以顾问确认结果为准。需求确认服务无需预付费用。</p>
        </div>
      </div>

      {/* 底部 CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6 shadow-lg">
        <p className="text-center text-xs text-gray-400 mb-3">提交后顾问将在 30 分钟内联系您</p>
        <button
          type="button"
          onClick={() => router.push(`/inquiry/${id}/confirm`)}
          className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-2xl text-base shadow-md active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          提交需求，联系顾问
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
