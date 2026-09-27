"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

function normalizeAccount(value: string) {
  return value.replace(/[\s-]/g, "").slice(0, 80);
}

function accountError(value: string) {
  const account = normalizeAccount(value);
  if (!account) return "请输入手机号或邮箱";
  if (/^\d+$/.test(account) && !/^1[3-9]\d{9}$/.test(account)) return "手机号应为 11 位大陆手机号";
  if (account.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)) return "请输入正确的邮箱地址";
  return null;
}

export function LoginForm({ nextPath }: { nextPath: string }) {
  const next = useMemo(() => (nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/member"), [nextPath]);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fieldError = account ? accountError(account) : null;
  const canSubmit = Boolean(account && password && !fieldError && !loading);

  async function submit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const validation = accountError(account);
    if (validation) return setError(validation);
    if (!password) return setError("请输入密码");
    setError(null); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ account: normalizeAccount(account), password }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(res.status === 429 ? "请求次数过多，请稍后再试" : json?.error || "账号或密码错误，请检查后重试");
      window.location.assign(next);
    } catch (e) { setError(e instanceof Error ? e.message : "网络暂时不可用，请稍后再试"); setLoading(false); }
  }

  return <form onSubmit={submit} className="grid gap-4"><label className="grid gap-2"><span className="text-[13px] font-semibold text-[#172033]">手机号或邮箱</span><input value={account} onChange={(e) => { setAccount(normalizeAccount(e.target.value)); setError(null); }} className={`min-h-12 rounded-xl border bg-white px-4 text-sm text-[#172033] outline-none transition placeholder:text-[#a3adba] ${fieldError ? "border-[#e3a4a0] focus:border-[#d94b4b]" : "border-[#d8e1ed] focus:border-[#1769e0] focus:ring-2 focus:ring-[#1769e0]/10"}`} placeholder="请输入手机号或邮箱" inputMode="text" autoComplete="username" aria-invalid={Boolean(fieldError)} />{fieldError ? <span className="text-xs leading-5 text-[#b33434]">{fieldError}</span> : null}</label><label className="grid gap-2"><span className="flex items-center justify-between text-[13px] font-semibold text-[#172033]"><span>登录密码</span><Link href="/contact?topic=账号帮助" className="font-medium text-[#1677ff]">忘记密码？</Link></span><span className="relative"><input value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} className="min-h-12 w-full rounded-xl border border-[#d8e1ed] bg-white px-4 pr-12 text-sm text-[#172033] outline-none transition placeholder:text-[#a3adba] focus:border-[#1769e0] focus:ring-2 focus:ring-[#1769e0]/10" placeholder="请输入密码" type={showPassword ? "text" : "password"} autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[#7b8798]" aria-label={showPassword ? "隐藏密码" : "显示密码"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>{error ? <div role="alert" className="rounded-xl bg-[#fff0ef] px-3 py-3 text-xs leading-5 text-[#b33434]">{error}</div> : null}<button type="submit" disabled={!canSubmit} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1677ff] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(22,119,255,.20)] transition hover:bg-[#0759b8] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45">{loading ? <><Loader2 size={17} className="animate-spin" />正在登录</> : <>登录 <ArrowRight size={17} /></>}</button><p className="text-center text-[12px] text-[#7b8798]">还没有账号？ <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-[#1677ff]">免费注册</Link></p></form>;
}
