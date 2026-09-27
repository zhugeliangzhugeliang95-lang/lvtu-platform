"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AdminShell,
  Card,
} from "@/components/hotel-admin/AdminShell";
import {
  Save,
  Info,
  Link as LinkIcon,
  MessageCircle,
  Lock,
  Sparkles,
  Users,
  ExternalLink,
  Upload,
  X,
} from "lucide-react";

/* =============================================================================
 * /admin/hotel/settings —— 系统设置（仅管理员）
 * ============================================================================*/

type Setting = {
  key: string;
  value: string;
  label: string;
  description?: string;
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "hotel.wechatId": MessageCircle,
  "hotel.qrUrl": LinkIcon,
  "hotel.webhookUrl": Sparkles,
  "hotel.heroTitle": Sparkles,
  "hotel.privacyText": Lock,
  "hotel.autoAssign": Users,
};

const TEXTAREA_KEYS = new Set(["hotel.privacyText", "hotel.heroTitle"]);

const AUTO_ASSIGN_OPTIONS = [
  { v: "off", label: "关闭（保持未分配）" },
  { v: "round_robin", label: "轮流分配到在线客服" },
];

export default function SettingsPage() {
  const [items, setItems] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.items) {
          setItems(d.items);
          setValues(
            Object.fromEntries(
              d.items.map((i: Setting) => [i.key, i.value])
            ) as Record<string, string>
          );
        }
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

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) {
      showToast(data?.message || "保存失败");
      return;
    }
    showToast("设置已保存");
  };

  const anyChanged = items.some((i) => values[i.key] !== i.value);

  const uploadQr = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => null);
    setUploading(false);
    if (!res.ok || !data?.url) { showToast("上传失败，请重试"); return; }
    setValues((v) => ({ ...v, "hotel.qrUrl": data.url }));
    showToast("图片上传成功，记得点保存");
  };

  return (
    <AdminShell
      title="系统设置"
      subtitle="客服微信号、二维码、Webhook、首页文案"
      headerExtra={
        isAdmin && (
          <button
            disabled={saving || !anyChanged}
            onClick={save}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b4fd8] px-4 py-2 text-[13px] font-semibold text-white transition enabled:hover:bg-[#1056eb] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "保存中…" : "保存全部"}
          </button>
        )
      }
    >
      {!isAdmin && (
        <Card className="mb-4 p-4 text-[13px] text-[#475467]">
          你当前是客服视角 — 只能查看设置，不能修改。
        </Card>
      )}

      {loading ? (
        <div className="h-[320px] animate-pulse rounded-2xl bg-white ring-1 ring-[#e9edf5]" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            {items.map((it) => {
              const Icon = ICONS[it.key] || Sparkles;
              const isTextarea = TEXTAREA_KEYS.has(it.key);
              const isSelect = it.key === "hotel.autoAssign";
              return (
                <Card key={it.key} className="p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#eaf1ff] text-[#0b4fd8]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-[14px] font-semibold text-[#0b1f4a]">
                        {it.label}
                      </div>
                      <div className="text-[11px] text-[#98a2b3]">
                        key: {it.key}
                      </div>
                    </div>
                  </div>
                  {it.description && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-[#f5f8ff] p-2.5 text-[12px] text-[#475467]">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0b4fd8]" />
                      <span>{it.description}</span>
                    </div>
                  )}

                  <div className="mt-3">
                    {it.key === "hotel.qrUrl" ? (
                      <div className="space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadQr(f);
                            e.target.value = "";
                          }}
                        />
                        {values[it.key] ? (
                          <div className="flex items-center gap-3 rounded-lg border border-[#e9edf5] bg-[#f5f8ff] p-3">
                            <img
                              src={values[it.key]}
                              alt="二维码预览"
                              className="h-20 w-20 rounded-lg object-cover ring-1 ring-[#e4e7ec]"
                            />
                            <div className="space-y-2">
                              <div className="text-[12px] text-[#667085]">当前二维码预览</div>
                              <div className="flex gap-2">
                                <button
                                  disabled={!isAdmin || uploading}
                                  onClick={() => fileInputRef.current?.click()}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b4fd8] px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-[#1056eb] disabled:opacity-50"
                                >
                                  <Upload className="h-3.5 w-3.5" />
                                  {uploading ? "上传中…" : "重新上传"}
                                </button>
                                <button
                                  disabled={!isAdmin}
                                  onClick={() => setValues((v) => ({ ...v, "hotel.qrUrl": "" }))}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#e4e7ec] px-3 py-1.5 text-[12px] text-[#667085] transition hover:border-[#f04438] hover:text-[#f04438] disabled:opacity-50"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  删除
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            disabled={!isAdmin || uploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#e4e7ec] bg-[#f5f8ff] py-8 text-[13px] text-[#98a2b3] transition hover:border-[#0b4fd8] hover:text-[#0b4fd8] disabled:opacity-50"
                          >
                            <Upload className="h-6 w-6" />
                            {uploading ? "上传中…" : "点击上传二维码图片"}
                          </button>
                        )}
                      </div>
                    ) : isSelect ? (
                      <select
                        disabled={!isAdmin}
                        value={values[it.key] || "off"}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [it.key]: e.target.value }))
                        }
                        className="h-10 w-full rounded-lg border border-[#e4e7ec] bg-white px-3 text-[13.5px] outline-none focus:border-[#0b4fd8] disabled:bg-[#f5f8ff]"
                      >
                        {AUTO_ASSIGN_OPTIONS.map((o) => (
                          <option key={o.v} value={o.v}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : isTextarea ? (
                      <textarea
                        disabled={!isAdmin}
                        value={values[it.key] || ""}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [it.key]: e.target.value }))
                        }
                        rows={3}
                        className="w-full rounded-lg border border-[#e4e7ec] bg-white px-3 py-2.5 text-[13.5px] outline-none transition placeholder:text-[#98a2b3] focus:border-[#0b4fd8] focus:ring-4 focus:ring-[#0b4fd8]/10 disabled:bg-[#f5f8ff]"
                      />
                    ) : (
                      <input
                        disabled={!isAdmin}
                        value={values[it.key] || ""}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [it.key]: e.target.value }))
                        }
                        placeholder={
                          it.key === "hotel.webhookUrl"
                            ? "https://qyapi.weixin.qq.com/... 或 https://open.feishu.cn/..."
                            : ""
                        }
                        className="h-10 w-full rounded-lg border border-[#e4e7ec] bg-white px-3 text-[13.5px] outline-none transition placeholder:text-[#98a2b3] focus:border-[#0b4fd8] focus:ring-4 focus:ring-[#0b4fd8]/10 disabled:bg-[#f5f8ff]"
                      />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="space-y-3">
            <Card className="p-5">
              <div className="text-[14px] font-semibold text-[#0b1f4a]">
                生效说明
              </div>
              <ul className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-[#475467]">
                <li>
                  <strong className="text-[#0b1f4a]">客服微信号 / 二维码 / 首页主标题 / 隐私提示</strong>
                  会通过 <code className="rounded bg-[#f5f8ff] px-1 text-[11px]">/api/settings/public</code>
                  对前台可见，页面加载时自动同步。
                </li>
                <li>
                  <strong className="text-[#0b1f4a]">Webhook</strong>：新线索落库后自动推送通知，
                  支持企业微信群机器人和飞书群机器人（自动识别 URL）。
                </li>
                <li>
                  <strong className="text-[#0b1f4a]">自动分配</strong>：
                  <code className="rounded bg-[#f5f8ff] px-1 text-[11px]">off</code>
                  = 保持未分配（客服自己接单）；
                  <code className="ml-1 rounded bg-[#f5f8ff] px-1 text-[11px]">round_robin</code>
                  = 轮流分配（预留，后续实现）。
                </li>
              </ul>
            </Card>

            <Card className="p-5">
              <div className="text-[14px] font-semibold text-[#0b1f4a]">
                前台预览
              </div>
              <p className="mt-1 text-[12.5px] text-[#667085]">
                打开首页查看当前设置的真实效果。
              </p>
              <a
                href="/"
                target="_blank"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#0b4fd8]/25 bg-white px-3 py-2 text-[13px] font-medium text-[#0b4fd8] transition hover:bg-[#eaf1ff]"
              >
                在新窗口打开首页
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Card>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-[#0b1f4a] px-4 py-2 text-[13px] font-medium text-white shadow-2xl">
          {toast}
        </div>
      )}
    </AdminShell>
  );
}
