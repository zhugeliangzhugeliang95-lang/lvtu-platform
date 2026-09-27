"use client";

import { useMemo, useState } from "react";

const typeOptions = [
  { value: "SUGGESTION", label: "建议" },
  { value: "COMPLAINT", label: "投诉" },
  { value: "REVIEW", label: "评价" },
] as const;
type FeedbackType = (typeof typeOptions)[number]["value"];

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });
}

export function FeedbackForm({ orderId, leadId }: { orderId?: string; leadId?: string }) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("SUGGESTION");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contactMobile, setContactMobile] = useState("");
  const [needCallback, setNeedCallback] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const related = useMemo(() => ({ orderId: orderId || null, leadId: leadId || null }), [orderId, leadId]);

  async function pickFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const list = Array.from(files).slice(0, 3);
    const next: string[] = [];
    for (const f of list) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > 350 * 1024) {
        throw new Error("单张图片请控制在 350KB 内");
      }
      next.push(await readAsDataUrl(f));
    }
    setImages((p) => [...p, ...next].slice(0, 6));
  }

  async function submit() {
    setError(null);
    if (!title.trim()) return setError("请填写标题");
    if (!content.trim()) return setError("请填写内容");

    setLoading(true);
    try {
      const res = await fetch("/api/feedbacks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          feedbackType,
          title,
          content,
          contactMobile: contactMobile.trim() || null,
          needCallback,
          images,
          orderId: related.orderId,
          leadId: related.leadId,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "提交失败");
      window.location.href = "/member/feedback";
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-white">类型</span>
          <select
            value={feedbackType}
            onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
            className="h-11 rounded-2xl border border-white/12 bg-slate-950/40 px-3 text-sm text-white outline-none focus:border-cyan-300"
          >
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-white">标题 *</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 rounded-2xl border border-white/12 bg-slate-950/40 px-3 text-sm text-white outline-none focus:border-cyan-300"
            placeholder="一句话说明问题或建议"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-white">内容 *</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-32 rounded-2xl border border-white/12 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
            placeholder="描述细一点：发生了什么、希望怎么处理"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-white">联系方式（可选）</span>
            <input
              value={contactMobile}
              onChange={(e) => setContactMobile(e.target.value)}
              className="h-11 rounded-2xl border border-white/12 bg-slate-950/40 px-3 text-sm text-white outline-none focus:border-cyan-300"
              placeholder="手机号/微信号"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/12 bg-slate-950/40 px-4 py-3 text-sm text-white/80">
            <input type="checkbox" checked={needCallback} onChange={(e) => setNeedCallback(e.target.checked)} />
            需要回访
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-white">图片（可选）</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={async (e) => {
              try {
                await pickFiles(e.target.files);
                e.currentTarget.value = "";
              } catch (err) {
                setError(err instanceof Error ? err.message : "上传失败");
              }
            }}
            className="text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/15"
          />
          {images.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {images.map((src) => (
                <img key={src} src={src} alt="" className="w-full rounded-2xl border border-white/10" />
              ))}
            </div>
          ) : null}
        </label>

        {error ? <div className="rounded-2xl bg-red-500/12 p-3 text-sm text-red-200">{error}</div> : null}

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="inline-flex h-12 items-center justify-center rounded-full bg-cyan-400 px-4 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          {loading ? "提交中…" : "提交反馈"}
        </button>
      </div>
    </div>
  );
}
