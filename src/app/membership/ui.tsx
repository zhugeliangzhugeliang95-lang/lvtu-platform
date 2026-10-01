"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Copy, Check, CheckCircle2, ImagePlus } from "lucide-react";

const MEMBERSHIP_PAYMENT_CODE = "#付款:旅途(aqggbbwzllyscc)/尊贵的旅途会员收款/001";

type Config = { price: number; days: number; title: string; benefits: string; wechatQrUrl: string; alipayQrUrl: string; instructions: string; enabled: boolean };
type Membership = { memberNo: string; name: string; phone: string; status: string; expiresAt: string | Date | null; startedAt: string | Date | null } | null;
type LatestPayment = { paymentNo: string; amount: number; status: string; proofImage: string | null; proofAiStatus: string | null; proofAiSummary: string | null } | null;

export function MembershipClient({ userId, config, membership, latestPayment }: { userId: string | null; config: Config; membership: Membership; latestPayment: LatestPayment }) {
  const [name, setName] = useState(membership?.name || "");
  const [phone, setPhone] = useState(membership?.phone || "");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paymentNo, setPaymentNo] = useState(latestPayment?.status === "PENDING" || latestPayment?.status === "USER_MARKED_PAID" ? latestPayment.paymentNo : "");
  const [proof, setProof] = useState(latestPayment?.proofImage || "");
  const [aiStatus, setAiStatus] = useState(latestPayment?.proofAiStatus || "");
  const [aiSummary, setAiSummary] = useState(latestPayment?.proofAiSummary || "");
  const [marked, setMarked] = useState(latestPayment?.status === "USER_MARKED_PAID");
  const [paymentCodeCopied, setPaymentCodeCopied] = useState(false);
  const [error, setError] = useState("");
  const active = membership?.status === "ACTIVE" && membership.expiresAt && new Date(membership.expiresAt) > new Date();
  async function startPayment() {
    if (!userId) return (window.location.href = `/login?next=${encodeURIComponent("/membership")}`);
    if (!name.trim() || !/^1[3-9]\d{9}$/.test(phone.replace(/[\s-]/g, ""))) return setError("请填写姓名和有效手机号");
    if (!agreed) return setError("请先同意会员服务协议");
    setLoading(true); setError("");
    try { const response = await fetch("/api/membership", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, phone, agreed }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "付款申请创建失败"); setPaymentNo(data.paymentNo); } catch (e) { setError(e instanceof Error ? e.message : "操作失败，请稍后再试"); } finally { setLoading(false); }
  }
  async function upload(file: File) {
    setUploading(true); setError("");
    try { const form = new FormData(); form.append("file", file); const response = await fetch("/api/uploads/payment-proof", { method: "POST", body: form }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "上传失败"); setProof(data.url); } catch (e) { setError(e instanceof Error ? e.message : "上传失败"); } finally { setUploading(false); }
  }
  async function markPaid() { if (!paymentNo) return; if (!proof) { setError("请先上传付款截图"); return; } setLoading(true); setError(""); try { const response = await fetch("/api/membership", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ paymentNo, proofImage: proof }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "提交失败"); setMarked(true); setAiStatus(data.ai?.status || ""); setAiSummary(data.ai?.summary || ""); } catch (e) { setError(e instanceof Error ? e.message : "操作失败，请稍后再试"); } finally { setLoading(false); } }
  async function copyPaymentCode() {
    setError("");
    try {
      await navigator.clipboard.writeText(MEMBERSHIP_PAYMENT_CODE);
      setPaymentCodeCopied(true);
      window.setTimeout(() => setPaymentCodeCopied(false), 2500);
    } catch {
      setError("复制失败，请长按下方付款口令手动复制");
    }
  }
  if (active) return <div className="mt-6 rounded-2xl bg-[#effaf5] p-4 text-sm text-[#067647]"><CheckCircle2 size={20} className="mb-2"/><p className="font-semibold">会员已开通</p><p className="mt-1 text-xs">有效期至 {new Date(membership!.expiresAt!).toLocaleDateString("zh-CN")}，可继续续费延长。</p><Link href="/profile/membership" className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-[#12b76a] px-4 text-xs font-bold text-white">查看会员卡</Link></div>;
  if (paymentNo) return <div className="mt-6 space-y-4"><div className="rounded-2xl bg-[#eef5ff] p-4"><p className="text-xs font-semibold text-[#1769e0]">付款申请已创建</p><p className="mt-2 text-2xl font-semibold text-[#172033]">¥{config.price}</p><p className="mt-2 text-xs leading-5 text-[#667085]">{config.instructions}</p>{config.wechatQrUrl ? <img src={config.wechatQrUrl} alt="微信收款二维码" className="mx-auto mt-4 h-44 w-44 rounded-xl object-contain"/> : null}<div className="mt-4 rounded-xl bg-white p-3"><p className="text-xs font-semibold text-[#344054]">会员付款口令</p><p className="mt-1 break-all text-xs leading-5 text-[#667085]" data-testid="membership-payment-code">{MEMBERSHIP_PAYMENT_CODE}</p><button type="button" onClick={copyPaymentCode} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1769e0] px-4 py-2 text-sm font-semibold text-white">{paymentCodeCopied ? <Check size={16}/> : <Copy size={16}/>} {paymentCodeCopied ? "已复制，前往付款" : "复制付款口令"}</button><p className="mt-2 text-center text-[11px] leading-4 text-[#667085]">复制后前往付款渠道粘贴口令并完成付款</p></div><div className="mt-3 flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs"><span>付款单号：{paymentNo}</span><button type="button" onClick={() => navigator.clipboard.writeText(paymentNo)} aria-label="复制付款单号" className="text-[#1769e0]"><Copy size={15}/></button></div></div><label className="flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#a6c8ef] bg-white text-xs font-semibold text-[#1769e0]"><input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading || marked} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }}/>{uploading ? <Loader2 size={16} className="animate-spin"/> : <ImagePlus size={16}/>} {uploading ? "正在上传" : proof ? "付款截图已上传，可点击更换" : "上传付款截图"}</label>{proof ? <div className="rounded-xl bg-[#f7fbff] p-3"><p className="text-xs font-semibold text-[#1769e0]">付款截图已保存，提交后进入审核</p>{aiStatus ? <p className="mt-2 text-[11px] leading-5 text-[#667085]">AI状态：{aiStatus === "MATCH" ? "金额匹配" : aiStatus === "MISMATCH" ? "金额不匹配" : aiStatus === "UNREADABLE" ? "无法可靠识别" : "待人工识别"}</p> : null}{aiSummary ? <p className="mt-1 text-[11px] leading-5 text-[#667085]">{aiSummary}</p> : null}</div> : null}{error ? <p className="rounded-xl bg-[#fff0ef] px-3 py-2 text-xs text-[#b42318]">{error}</p> : null}<button type="button" disabled={loading || uploading || marked} onClick={markPaid} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#1769e0] bg-white text-sm font-semibold text-[#1769e0] disabled:opacity-50">{loading ? <Loader2 size={16} className="animate-spin"/> : marked ? <CheckCircle2 size={16}/> : null}{marked ? "已提交，等待人工确认" : "提交截图，等待确认"}</button></div>;
  return <div className="mt-6 space-y-4"><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-semibold">会员姓名<input value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入真实姓名" className="min-h-11 rounded-xl border border-[#dce8f4] px-3 font-normal outline-none focus:border-[#1769e0]"/></label><label className="grid gap-1.5 text-xs font-semibold">绑定手机号<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="用于识别会员身份" inputMode="tel" className="min-h-11 rounded-xl border border-[#dce8f4] px-3 font-normal outline-none focus:border-[#1769e0]"/></label></div><label className="flex items-start gap-2 text-xs leading-5 text-[#667085]"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1"/>我已阅读并同意<Link href="/settings/membership-terms" className="text-[#1769e0]">《会员服务协议》</Link></label>{error ? <p className="rounded-xl bg-[#fff0ef] px-3 py-2 text-xs text-[#b42318]">{error}</p> : null}<button type="button" onClick={startPayment} disabled={loading || !config.enabled} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1769e0] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(23,105,224,.2)] disabled:opacity-50">{loading ? <Loader2 size={17} className="animate-spin"/> : null}{config.enabled ? `立即开通 ¥${config.price}` : "会员服务暂未开放"}</button></div>;
}
