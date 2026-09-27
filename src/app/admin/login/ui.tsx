"use client";

import { useMemo, useState } from "react";
import { LogIn, User, Lock, AlertCircle } from "lucide-react";

export function AdminLoginForm({ nextPath }: { nextPath: string }) {
  const next = useMemo(
    () => (nextPath?.startsWith("/") ? nextPath : "/admin/hotel"),
    [nextPath]
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!username.trim()) return setError("请输入账号");
    if (!password.trim()) return setError("请输入密码");

    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || json?.error || "登录失败");
      }
      window.location.href = next;
    } catch (e) {
      setError(e instanceof Error ? e.message : "登录失败");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="grid gap-1.5">
        <span className="text-[13px] font-medium text-[#344054]">账号</span>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#e4e7ec] bg-white pl-10 pr-3 text-[14px] outline-none transition placeholder:text-[#98a2b3] focus:border-[#0b4fd8] focus:ring-4 focus:ring-[#0b4fd8]/10"
            placeholder="请输入账号"
            autoComplete="username"
            disabled={loading}
            autoFocus
          />
        </div>
      </label>

      <label className="grid gap-1.5">
        <span className="text-[13px] font-medium text-[#344054]">密码</span>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#e4e7ec] bg-white pl-10 pr-3 text-[14px] outline-none transition placeholder:text-[#98a2b3] focus:border-[#0b4fd8] focus:ring-4 focus:ring-[#0b4fd8]/10"
            placeholder="••••••••"
            type="password"
            autoComplete="current-password"
            disabled={loading}
          />
        </div>
      </label>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-[#fecdca] bg-[#fef3f2] px-3 py-2.5 text-[13px] text-[#b42318]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0b4fd8] text-[14px] font-semibold text-white transition hover:bg-[#1056eb] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          "正在登录…"
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            登录
          </>
        )}
      </button>

      <p className="text-center text-[12px] text-[#98a2b3]">
        如果你忘记密码，请联系超级管理员重置。
      </p>
    </form>
  );
}
