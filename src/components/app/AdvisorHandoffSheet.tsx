"use client";

import { FormEvent, useState } from "react";
import { Check, Headphones, LoaderCircle, X } from "lucide-react";

import type { TravelProfile } from "@/lib/ai-advisor/types";

const WECHAT_KF_URL = "https://work.weixin.qq.com/kfid/kfc7e290edd33f220d2";

async function copySummary(value: string) {
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

type AdvisorHandoffSheetProps = {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  profile: TravelProfile;
  onSubmitted: () => void;
};

export function AdvisorHandoffSheet({
  open,
  onClose,
  sessionId,
  profile,
  onSubmitted,
}: AdvisorHandoffSheetProps) {
  const [name, setName] = useState(profile.customerName || "");
  const [contact, setContact] = useState(profile.contact || "");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/ai/advisor/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, customerName: name, contact, note }),
      });
      const data = await response.json() as { message?: string; summary?: string };
      if (!response.ok) throw new Error(data.message || "提交失败，请稍后再试");
      if (data.summary) await copySummary(`【旅途AI需求摘要】\n${data.summary}\n请客服继续确认最终方案与报价。`);
      onSubmitted();
      onClose();
      const opened = window.open(WECHAT_KF_URL, "_blank", "noopener,noreferrer");
      if (!opened) window.location.assign(WECHAT_KF_URL);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[#071e3e]/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="w-full max-w-[520px] rounded-t-[28px] bg-[#f9fcff] px-6 pb-[max(26px,env(safe-area-inset-bottom))] pt-5 shadow-[0_-24px_60px_rgba(8,43,93,.2)] sm:rounded-[24px]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="advisor-handoff-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[var(--app-blue)]">
              <span className="grid size-8 place-items-center rounded-[11px] bg-[var(--app-blue-soft)]"><Headphones size={16} /></span>
              <span className="text-[10px] font-bold tracking-[.1em]">人工顾问接力</span>
            </div>
            <h2 id="advisor-handoff-title" className="mt-3 text-[20px] font-semibold tracking-[-.03em] text-[#163d66]">留下联系方式，顾问继续帮你</h2>
          <p className="mt-1.5 text-[11px] leading-5 text-[#71859a]">只发送出发地、目的地、时间、人数、预算和重点偏好，不用重复描述。</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#6f8092] shadow-sm" aria-label="关闭">
            <X size={17} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold text-[#526c86]">怎么称呼你</span>
            <input required minLength={2} maxLength={30} value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：林先生" className="h-12 w-full rounded-[15px] border border-[#d7e5f1] bg-white px-4 text-[13px] text-[#29435e] outline-none transition placeholder:text-[#a4b1be] focus:border-[#8fc5f8]" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold text-[#526c86]">联系方式</span>
            <input required minLength={5} maxLength={80} value={contact} onChange={(event) => setContact(event.target.value)} placeholder="手机号或微信号" className="h-12 w-full rounded-[15px] border border-[#d7e5f1] bg-white px-4 text-[13px] text-[#29435e] outline-none transition placeholder:text-[#a4b1be] focus:border-[#8fc5f8]" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold text-[#526c86]">补充说明 <em className="font-normal not-italic text-[#9aa9b8]">（选填）</em></span>
            <textarea maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="还有特别在意的事情，可以告诉顾问" className="w-full resize-none rounded-[15px] border border-[#d7e5f1] bg-white px-4 py-3 text-[13px] leading-6 text-[#29435e] outline-none transition placeholder:text-[#a4b1be] focus:border-[#8fc5f8]" />
          </label>
          {error ? <p className="rounded-[12px] bg-[#fff1f0] px-3 py-2 text-[11px] text-[#c24136]">{error}</p> : null}
          <button type="submit" disabled={submitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-[var(--app-blue)] text-[12px] font-semibold text-white shadow-[0_10px_24px_rgba(22,119,255,.2)] transition active:scale-[.99] disabled:cursor-wait disabled:opacity-70">
            {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}
            {submitting ? "正在提交" : "复制需求并打开企业微信"}
          </button>
          <p className="text-center text-[9px] leading-4 text-[#97a5b5]">仅用于本次旅行咨询，顾问会在工作时间联系你</p>
        </form>
      </section>
    </div>
  );
}
