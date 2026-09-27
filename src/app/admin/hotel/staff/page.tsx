"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminShell,
  Card,
  fmtDate,
} from "@/components/hotel-admin/AdminShell";
import {
  UserPlus,
  Power,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";

/* =============================================================================
 * /admin/hotel/staff —— 客服账号管理（仅管理员）
 * ============================================================================*/

type Staff = {
  id: string;
  username: string;
  realName: string | null;
  role: string;
  status: "ACTIVE" | "DISABLED";
  mobile?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  followUpCount?: number;
  dealCount?: number;
};

const ROLE_OPTIONS: Array<{ v: string; label: string }> = [
  { v: "SUPER_ADMIN", label: "超级管理员" },
  { v: "OPS", label: "运营" },
  { v: "SUPPORT", label: "客服" },
  { v: "ORDER", label: "订单专员" },
  { v: "CONTENT", label: "内容运营" },
];

const ROLE_LABEL = Object.fromEntries(ROLE_OPTIONS.map((r) => [r.v, r.label]));

export default function StaffPage() {
  const [items, setItems] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [me, setMe] = useState<{ role: string } | null>(null);

  const [draft, setDraft] = useState({
    username: "",
    realName: "",
    password: "",
    mobile: "",
    role: "SUPPORT",
  });
  const [error, setError] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/staff", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.items) setItems(d.items);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    fetch("/api/admin/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe);
    return () => window.clearTimeout(timer);
  }, [load]);

  const isAdmin = me?.role === "SUPER_ADMIN" || me?.role === "OPS";

  const submitCreate = async () => {
    setError(null);
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.message || "新建失败");
      return;
    }
    showToast("账号已创建");
    setCreating(false);
    setDraft({ username: "", realName: "", password: "", mobile: "", role: "SUPPORT" });
    load();
  };

  const updateUser = async (
    id: string,
    body: Record<string, unknown>,
    msg: string
  ) => {
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      showToast(data?.message || "操作失败");
      return;
    }
    showToast(msg);
    load();
  };

  const toggleStatus = (u: Staff) => {
    const next = u.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    if (next === "DISABLED" && !confirm(`确定要禁用「${u.realName || u.username}」吗？`))
      return;
    updateUser(u.id, { status: next }, next === "ACTIVE" ? "已启用" : "已禁用");
  };

  const resetPassword = (u: Staff) => {
    const pwd = prompt(`为「${u.realName || u.username}」设置新密码（至少 8 位）：`);
    if (!pwd) return;
    if (pwd.length < 8) {
      showToast("密码至少 8 位");
      return;
    }
    updateUser(u.id, { password: pwd }, "密码已重置");
  };

  const changeRole = (u: Staff, role: string) => {
    if (role === u.role) return;
    updateUser(u.id, { role }, "角色已更新");
  };

  return (
    <AdminShell
      title="客服账号"
      subtitle="新建 / 启用禁用 / 重置密码 / 调整角色"
      headerExtra={
        isAdmin && (
          <button
            onClick={() => setCreating((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b4fd8] px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#1056eb]"
          >
            <UserPlus className="h-4 w-4" />
            新建账号
          </button>
        )
      }
    >
      {!isAdmin && (
        <Card className="p-5 text-[13px] text-[#475467]">
          你当前是客服视角 — 这里仅展示团队成员，无法编辑。
        </Card>
      )}

      {creating && isAdmin && (
        <Card className="mb-4 p-5">
          <div className="text-[14px] font-semibold text-[#0b1f4a]">
            新建账号
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <Field label="账号">
              <input
                value={draft.username}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, username: e.target.value }))
                }
                placeholder="例如 xiaowang"
                className={inputCls}
              />
            </Field>
            <Field label="姓名">
              <input
                value={draft.realName}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, realName: e.target.value }))
                }
                placeholder="例如 小王"
                className={inputCls}
              />
            </Field>
            <Field label="初始密码（≥8 位）">
              <input
                value={draft.password}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, password: e.target.value }))
                }
                placeholder="••••••••"
                type="text"
                className={inputCls}
              />
            </Field>
            <Field label="手机号（可选）">
              <input
                value={draft.mobile}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, mobile: e.target.value }))
                }
                className={inputCls}
              />
            </Field>
            <Field label="角色">
              <select
                value={draft.role}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, role: e.target.value }))
                }
                className={inputCls}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.v} value={r.v}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {error && (
            <div className="mt-3 rounded-lg bg-[#fef3f2] px-3 py-2 text-[13px] text-[#b42318]">
              {error}
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setCreating(false);
                setError(null);
              }}
              className="rounded-lg border border-[#e4e7ec] bg-white px-3 py-2 text-[13px] text-[#475467] hover:bg-[#f5f8ff]"
            >
              取消
            </button>
            <button
              onClick={submitCreate}
              className="rounded-lg bg-[#0b4fd8] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#1056eb]"
            >
              保存
            </button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-[13px]">
            <thead>
              <tr className="border-b border-[#e9edf5] text-left text-[12px] text-[#98a2b3]">
                <th className="px-4 py-3 font-medium">账号 / 姓名</th>
                <th className="px-4 py-3 font-medium">角色</th>
                <th className="px-4 py-3 font-medium">手机号</th>
                <th className="px-4 py-3 font-medium">最近登录</th>
                <th className="px-4 py-3 font-medium">跟进数</th>
                <th className="px-4 py-3 font-medium">成交数</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-[#98a2b3]">
                    加载中…
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-[#e9edf5] transition hover:bg-[#f5f8ff]"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-[#172033]">
                        {u.realName || u.username}
                      </div>
                      <div className="text-[11.5px] text-[#98a2b3]">
                        @{u.username}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {isAdmin ? (
                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u, e.target.value)}
                          className="rounded-md border border-[#e4e7ec] bg-white px-2 py-1 text-[12.5px] text-[#344054] focus:border-[#0b4fd8] focus:outline-none"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r.v} value={r.v}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[12.5px] text-[#344054]">
                          <ShieldCheck className="h-3.5 w-3.5 text-[#0b4fd8]" />
                          {ROLE_LABEL[u.role] || u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[12.5px] text-[#475467]">
                      {u.mobile || "-"}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#667085]">
                      {fmtDate(u.lastLoginAt)}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[#0b4fd8]">
                      {u.followUpCount ?? "-"}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[#067647]">
                      {u.dealCount ?? "-"}
                    </td>
                    <td className="px-4 py-3.5">
                      {u.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f9f0] px-2 py-0.5 text-[11.5px] font-medium text-[#067647]">
                          <CheckCircle2 className="h-3 w-3" />
                          启用中
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3f2] px-2 py-0.5 text-[11.5px] font-medium text-[#b42318]">
                          <XCircle className="h-3 w-3" />
                          已禁用
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {isAdmin ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => toggleStatus(u)}
                            title={u.status === "ACTIVE" ? "禁用" : "启用"}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-[#e4e7ec] bg-white text-[#475467] transition hover:bg-[#f5f8ff]"
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => resetPassword(u)}
                            title="重置密码"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-[#e4e7ec] bg-white text-[#475467] transition hover:bg-[#f5f8ff]"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[12px] text-[#98a2b3]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {toast && (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-[#0b1f4a] px-4 py-2 text-[13px] font-medium text-white shadow-2xl">
          {toast}
        </div>
      )}
    </AdminShell>
  );
}

const inputCls =
  "h-9 w-full rounded-lg border border-[#e4e7ec] bg-white px-2.5 text-[13px] outline-none transition placeholder:text-[#98a2b3] focus:border-[#0b4fd8] focus:ring-4 focus:ring-[#0b4fd8]/10";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[12px] font-medium text-[#344054]">{label}</span>
      {children}
    </label>
  );
}
