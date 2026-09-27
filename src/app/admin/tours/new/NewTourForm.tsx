"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Save, Sparkles } from "lucide-react";

const fieldClass = "mt-2 h-11 w-full rounded-xl border border-[#dfe5ee] bg-white px-3 text-sm text-[#172033] outline-none transition placeholder:text-[#98a2b3] focus:border-[#1769e0] focus:ring-4 focus:ring-[#1769e0]/10";

export function NewTourForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          slug: values.slug,
          destination: values.destination,
          departureCity: values.departureCity,
          days: Number(values.days),
          tourType: values.tourType,
          audience: values.audience,
          summary: values.summary,
          coverImage: values.coverImage,
          tags: String(values.tags || "").split(/[，,、]/).map((item) => item.trim()).filter(Boolean),
          recommended: values.recommended === "on",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "保存失败，请检查填写内容");
      router.push(`/admin/tours/${data.product.id}/departures`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败，请稍后重试");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-4xl space-y-5">
      {message ? <div className="rounded-xl border border-[#fecdca] bg-[#fff5f4] px-4 py-3 text-sm text-[#b42318]" role="alert">{message}</div> : null}
      <section className="rounded-2xl border border-[#e4eaf2] bg-white p-5 shadow-[0_10px_30px_rgba(22,57,92,.04)] md:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf1ff] text-[#1769e0]"><Sparkles className="h-5 w-5" /></span>
          <div><h2 className="font-semibold text-[#172033]">产品基础信息</h2><p className="mt-1 text-xs leading-5 text-[#667085]">保存后默认为草稿，不会立即显示到前台。</p></div>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="text-sm font-medium text-[#344054] md:col-span-2">产品名称<input name="name" required minLength={4} maxLength={120} placeholder="如：新疆北疆 8 日精品小团" className={fieldClass} /></label>
          <label className="text-sm font-medium text-[#344054]">页面地址 slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="如：xinjiang-north-8d" className={fieldClass} /><span className="mt-1.5 block text-[11px] font-normal text-[#98a2b3]">仅英文小写、数字与短横线，创建后用于前台链接。</span></label>
          <label className="text-sm font-medium text-[#344054]">团型<select name="tourType" required defaultValue="精品小团" className={fieldClass}><option>精品小团</option><option>跟团游</option><option>半自由行</option><option>亲子团</option><option>研学团</option><option>定制团</option></select></label>
          <label className="text-sm font-medium text-[#344054]">目的地<input name="destination" required placeholder="如：新疆" className={fieldClass} /></label>
          <label className="text-sm font-medium text-[#344054]">集合 / 出发城市<input name="departureCity" placeholder="如：乌鲁木齐" className={fieldClass} /></label>
          <label className="text-sm font-medium text-[#344054]">行程天数<input name="days" required type="number" min="1" max="60" defaultValue="5" className={fieldClass} /></label>
          <label className="text-sm font-medium text-[#344054]">标签<input name="tags" placeholder="自然风光，精品小团，轻松行程" className={fieldClass} /><span className="mt-1.5 block text-[11px] font-normal text-[#98a2b3]">使用逗号分隔，最多 12 个。</span></label>
          <label className="text-sm font-medium text-[#344054] md:col-span-2">适合人群<input name="audience" placeholder="如：适合情侣、朋友及希望轻松旅行的家庭" className={fieldClass} /></label>
          <label className="text-sm font-medium text-[#344054] md:col-span-2">产品简介<textarea name="summary" maxLength={1000} placeholder="说明路线亮点、服务方式和适合人群。" className={`${fieldClass} h-28 resize-y py-3`} /></label>
          <label className="text-sm font-medium text-[#344054] md:col-span-2">封面图地址<input name="coverImage" placeholder="/images/tours/example.jpg 或 https://..." className={fieldClass} /></label>
          <label className="flex items-center gap-3 rounded-xl bg-[#f7f9fc] px-4 py-3 text-sm text-[#344054] md:col-span-2"><input name="recommended" type="checkbox" className="h-4 w-4 rounded border-[#cfd7e3] text-[#1769e0]" /><span><strong className="font-semibold">设为推荐产品</strong><small className="mt-0.5 block text-[11px] text-[#667085]">推荐产品在前台排序更靠前；仍需手动上架后才会公开。</small></span></label>
        </div>
      </section>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/admin/tours" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dfe5ee] bg-white px-5 text-sm font-medium text-[#475467]"><ArrowLeft className="h-4 w-4" />取消返回</Link>
        <button disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1769e0] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f5ecf] disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "保存中…" : "保存草稿并添加内容"}</button>
      </div>
    </form>
  );
}
