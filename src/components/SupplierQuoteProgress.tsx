"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CircleAlert, Clock3, LoaderCircle, MessageCircle, Search, Sparkles } from "lucide-react";

type SupplierTask = {
  id: string;
  status: string;
  sentCount: number;
  aiSummary: string | null;
  updatedAt: string;
  _count?: { quotes: number; messages: number };
};

type InquiryResponse = {
  order?: { status?: string; xianYuTasks?: SupplierTask[] };
};

const STATUS_COPY: Record<string, { title: string; detail: string; step: number }> = {
  PENDING: { title: "已进入供应商队列", detail: "旅途会把你的重点需求交给供应商机器人处理。", step: 1 },
  SEARCHING: { title: "正在寻找匹配供应商", detail: "正在按目的地、日期、人数和服务规格筛选。", step: 1 },
  MESSAGING: { title: "正在向供应商询价", detail: "机器人正在发送需求，不需要你反复等待或重复填写。", step: 2 },
  WAITING_REPLIES: { title: "供应商报价中", detail: "已发出询价，正在等待商家回复。价格仍是待确认状态。", step: 2 },
  AUTO_FOLLOWUP: { title: "正在跟进报价", detail: "部分供应商还未回复，旅途会继续跟进。", step: 2 },
  COLLECTING: { title: "正在收集多个报价", detail: "收到的报价会统一比较包含项、退改和有效期。", step: 2 },
  AI_ANALYZING: { title: "AI 正在整理报价", detail: "正在提取价格、早餐、取消规则和附加服务。", step: 3 },
  QUOTED: { title: "报价已收到，等待人工确认", detail: "客服会再次核对库存、规格、有效期和最终价格。", step: 3 },
  WAITING_HUMAN_CONFIRM: { title: "等待客服确认", detail: "供应商已返回信息，最终确认价由客服核实后发送。", step: 3 },
  NEEDS_HUMAN: { title: "需要客服继续跟进", detail: "暂时没有足够的有效报价，客服会继续人工确认。", step: 2 },
  FAILED: { title: "本次自动询价暂时中断", detail: "需求不会丢失，可以联系企业微信客服继续处理。", step: 2 },
};

const STEPS = ["需求已提交", "供应商报价中", "人工核对最终价", "等你确认"];

function readSummary(task: SupplierTask | null) {
  if (!task?.aiSummary) return null;
  try {
    const parsed = JSON.parse(task.aiSummary) as { quoteCount?: number; minPricePerNight?: number; recommendation?: string };
    return {
      quoteCount: typeof parsed.quoteCount === "number" ? parsed.quoteCount : task._count?.quotes ?? 0,
      minPricePerNight: typeof parsed.minPricePerNight === "number" ? parsed.minPricePerNight : null,
      recommendation: typeof parsed.recommendation === "string" ? parsed.recommendation : "",
    };
  } catch {
    return null;
  }
}

export function SupplierQuoteProgress({ inquiryId }: { inquiryId: string }) {
  const [task, setTask] = useState<SupplierTask | null>(null);
  const [orderStatus, setOrderStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    let timer: number | undefined;
    async function load() {
      try {
        const response = await fetch(`/api/inquiry/${inquiryId}`, { cache: "no-store" });
        if (!response.ok) throw new Error("status");
        const data = await response.json() as InquiryResponse;
        if (!alive) return;
        setOrderStatus(data.order?.status || "");
        setTask(data.order?.xianYuTasks?.[0] || null);
        setError(false);
        const current = data.order?.xianYuTasks?.[0]?.status;
        if (current && !["QUOTED", "WAITING_HUMAN_CONFIRM", "NEEDS_HUMAN", "FAILED"].includes(current)) {
          timer = window.setTimeout(load, 5000);
        }
      } catch {
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [inquiryId]);

  const status = task ? STATUS_COPY[task.status] || STATUS_COPY.PENDING : null;
  const summary = useMemo(() => readSummary(task), [task]);

  if (loading && !task) {
    return <section className="mt-4 rounded-[18px] border border-[#cfe3f6] bg-[#f5faff] p-5"><div className="flex items-center gap-3 text-sm font-semibold text-[#315b83]"><LoaderCircle size={18} className="animate-spin text-[#1769e0]" />正在读取报价进度…</div></section>;
  }

  if (!task) {
    return <section className="mt-4 rounded-[18px] border border-[#d7e7fa] bg-white p-5"><div className="flex items-start gap-3"><Clock3 size={19} className="mt-0.5 text-[#1769e0]" /><div><p className="text-sm font-bold text-[#172033]">需求已交给旅途客服</p><p className="mt-1 text-xs leading-5 text-[#667085]">{error ? "暂时无法读取实时状态，请稍后在我的页面查看。" : "客服会根据你的重点需求继续确认价格和库存。"}</p></div></div></section>;
  }

  const activeStep = status?.step || (orderStatus === "WAITING_PROCUREMENT" ? 2 : 1);
  const terminal = ["QUOTED", "WAITING_HUMAN_CONFIRM", "NEEDS_HUMAN", "FAILED"].includes(task.status);

  return <section className="mt-4 overflow-hidden rounded-[18px] border border-[#cfe3f6] bg-white shadow-[0_10px_28px_rgba(28,78,135,.06)]">
    <div className={`px-5 py-4 ${terminal && task.status !== "FAILED" ? "bg-[#effaf5]" : task.status === "FAILED" ? "bg-[#fff6f3]" : "bg-[#f1f8ff]"}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-white text-[#1769e0] shadow-sm">
          {task.status === "FAILED" ? <CircleAlert size={19} className="text-[#d14b3f]" /> : terminal ? <Check size={19} className="text-[#168f67]" /> : <LoaderCircle size={19} className="animate-spin" />}
        </span>
        <div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#172033]">{status?.title}</p><p className="mt-1 text-xs leading-5 text-[#667085]">{status?.detail}</p></div>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-1.5">
        {STEPS.map((label, index) => <div key={label} className="min-w-0"><div className={`h-1.5 rounded-full ${index < activeStep ? "bg-[#1769e0]" : index === activeStep ? "bg-[#75b8f7]" : "bg-[#dce8f3]"}`} /><p className={`mt-1.5 truncate text-[9px] ${index <= activeStep ? "font-semibold text-[#315b83]" : "text-[#a1adba]"}`}>{label}</p></div>)}
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e7eff6] px-5 py-3 text-[10px] text-[#71859a]">
      <span className="inline-flex items-center gap-1"><Search size={12} />已发出 {task.sentCount || task._count?.messages || 0} 条询价</span>
      <span className="inline-flex items-center gap-1"><MessageCircle size={12} />收到 {summary?.quoteCount ?? task._count?.quotes ?? 0} 个报价</span>
      {summary?.minPricePerNight ? <span className="inline-flex items-center gap-1 font-semibold text-[#168f67]">最低 ¥{summary.minPricePerNight.toLocaleString("zh-CN")}/晚</span> : null}
    </div>
    {summary?.recommendation ? <div className="border-t border-[#e7eff6] px-5 py-3 text-[10px] leading-5 text-[#53677e]"><Sparkles size={12} className="mr-1 inline text-[#1769e0]" />{summary.recommendation}</div> : null}
  </section>;
}
