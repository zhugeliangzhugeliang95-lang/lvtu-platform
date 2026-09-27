"use client";

import { useState } from "react";
import { Check, ImagePlus, Loader2 } from "lucide-react";

export function PaymentPanel({ orderId, qrUrl }: { orderId: string; qrUrl?: string }) {
  const [method, setMethod] = useState("WECHAT");
  const [proof, setProof] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true); setError("");
    const form = new FormData(); form.append("file", file);
    const res = await fetch("/api/uploads/payment-proof", { method: "POST", body: form });
    const json = await res.json().catch(() => ({})); setUploading(false);
    if (!res.ok) { setError(json.error || "上传失败"); return; }
    setProof(json.url);
  }

  async function submit() {
    if (!proof) { setError("请先上传付款凭证"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/payments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId, method, proofImage: proof }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.error || "提交失败"); setLoading(false); return; }
    setDone(true); setLoading(false);
  }

  if (done) return <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-sm text-emerald-700"><Check size={16}/>付款凭证已提交，客服审核后会更新订单状态。</div>;

  return <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4"><div className="text-sm font-semibold text-slate-900">人工支付</div><p className="mt-1 text-xs leading-5 text-slate-500">选择支付方式并按收款码付款，再上传付款截图等待审核。</p><div className="mt-3 grid grid-cols-2 gap-2">{[["WECHAT","微信支付"],["ALIPAY","支付宝"]].map(([value,label])=><button key={value} type="button" onClick={()=>setMethod(value)} className={`min-h-10 rounded-xl border text-xs font-semibold ${method===value?"border-blue-500 bg-white text-blue-600":"border-slate-200 bg-white/60 text-slate-500"}`}>{label}</button>)}</div>{qrUrl?<div className="mt-3 rounded-xl bg-white p-3 text-center"><img src={qrUrl} alt="收款二维码" className="mx-auto size-44 rounded-xl object-contain"/><p className="mt-2 text-[10px] text-slate-400">付款前请确认收款主体与订单金额</p></div>:<div className="mt-3 rounded-xl bg-white p-3 text-center text-xs text-slate-500">收款二维码暂未配置，请先联系客服</div>}<label className="mt-3 flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-blue-200 bg-white text-xs font-semibold text-blue-600"><input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={event=>{const file=event.target.files?.[0];if(file)void upload(file)}}/>{uploading?<Loader2 size={16} className="animate-spin"/>:<ImagePlus size={17}/>} {uploading?"正在上传":proof?"凭证已上传，点击可更换":"上传付款凭证"}</label>{proof?<p className="mt-2 break-all text-[10px] text-emerald-600">凭证已保存：{proof}</p>:null}<button onClick={submit} disabled={loading||uploading} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-semibold text-white disabled:opacity-60">{loading?<><Loader2 size={15} className="animate-spin"/>提交中…</>:"提交付款凭证"}</button>{error?<p className="mt-2 text-xs text-red-600">{error}</p>:null}</div>;
}
