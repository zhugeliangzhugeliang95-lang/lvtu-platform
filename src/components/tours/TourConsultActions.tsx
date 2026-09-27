"use client";

import { useState } from "react";
import { Check, Clipboard, MessageCircleMore } from "lucide-react";

const WECHAT_KF_URL = "https://work.weixin.qq.com/kfid/kfc7e290edd33f220d2";

type TourConsultActionsProps = {
  name: string;
  destination: string;
  departure: string;
  days: number;
  price: number;
  departureDates: string[];
};

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

export function TourConsultActions(props: TourConsultActionsProps) {
  const [copied, setCopied] = useState(false);
  const summary = [
    "【旅途旅行团咨询】",
    `线路：${props.name}`,
    `目的地：${props.destination}`,
    `集合/出发：${props.departure}`,
    `行程天数：${props.days}天`,
    props.price ? `页面参考价：¥${props.price.toLocaleString("zh-CN")}/人起（待确认）` : "页面价格：待确认",
    props.departureDates.length ? `想咨询班期：${props.departureDates.slice(0, 4).join("、")}` : "想咨询：最新班期",
    "请帮我确认名额、最终价格、住宿标准、费用包含及退改规则。",
  ].join("\n");

  async function copy() {
    await copyText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2400);
  }

  async function consult() {
    await copyText(summary);
    setCopied(true);
    const opened = window.open(WECHAT_KF_URL, "_blank", "noopener,noreferrer");
    if (!opened) window.location.assign(WECHAT_KF_URL);
  }

  return (
    <div className="mx-auto flex max-w-[500px] gap-2 rounded-[24px] border border-white/80 bg-white/94 p-3 shadow-xl backdrop-blur">
      <button type="button" onClick={copy} className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-[17px] border border-[#dce8f4] text-[12px] font-semibold text-[#31516f]">
        {copied ? <Check size={15} /> : <Clipboard size={15} />}
        {copied ? "已复制" : "复制线路"}
      </button>
      <button type="button" onClick={consult} className="flex min-h-12 flex-[1.35] items-center justify-center gap-1.5 rounded-[17px] bg-[#07b95a] text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(7,185,90,.2)]">
        <MessageCircleMore size={16} />
        复制并咨询客服
      </button>
    </div>
  );
}
