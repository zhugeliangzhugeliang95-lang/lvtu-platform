"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Hotel,
  BellDot,
  Bot,
  Building2,
  FileText,
  ListChecks,
  WalletCards,
  Sparkles,
  BadgeDollarSign,
  PackageOpen,
  Crown,
} from "lucide-react";

/* =============================================================================
 * 旅途酒店线索 CRM · 后台布局框
 *  - 左侧导航
 *  - 顶部栏（当前登录用户 + 退出）
 *  - 移动端可抽屉
 *  - 自动拉 /api/admin/me，若 401 跳回登录
 * ============================================================================*/

type Me = {
  id: string;
  username: string;
  realName: string | null;
  role: string;
  status: string;
};

const NAV: Array<{
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}> = [
  { label: "运营总览", href: "/admin", icon: LayoutDashboard },
  { label: "AI 旅行顾问", href: "/admin/ai", icon: Sparkles },
  { label: "旅行团产品", href: "/admin/tours", icon: PackageOpen },
  { label: "供应商中心", href: "/admin/suppliers", icon: Building2 },
  { label: "线索列表", href: "/admin/hotel/leads", icon: MessageCircle },
  { label: "需求与报价", href: "/admin/requirements", icon: FileText },
  { label: "价格体系", href: "/admin/pricing", icon: BadgeDollarSign },
  { label: "付款审核", href: "/admin/payments", icon: WalletCards },
  { label: "会员付款", href: "/admin/membership-payments", icon: Crown },
  { label: "会员管理", href: "/admin/memberships", icon: Users },
  { label: "会员配置", href: "/admin/settings/membership", icon: Settings, adminOnly: true },
  { label: "订单履约", href: "/admin/orders", icon: ListChecks },
  { label: "AI 私域机器人", href: "/admin/hotel/robot", icon: Bot },
  { label: "客服账号", href: "/admin/hotel/staff", icon: Users, adminOnly: true },
  { label: "系统设置", href: "/admin/hotel/settings", icon: Settings, adminOnly: true },
];

function roleLabel(role: string): string {
  return (
    {
      SUPER_ADMIN: "超级管理员",
      OPS: "运营",
      SUPPORT: "客服",
      ORDER: "订单专员",
      CONTENT: "内容运营",
    }[role] || role
  );
}

function roleBadgeStyles(role: string): string {
  if (role === "SUPER_ADMIN")
    return "bg-[#fff3e8] text-[#b04a00] ring-[#ff7a1a]/25";
  if (role === "OPS") return "bg-[#eaf1ff] text-[#0b4fd8] ring-[#0b4fd8]/25";
  if (role === "SUPPORT") return "bg-[#e6f9f0] text-[#067647] ring-[#12b76a]/25";
  return "bg-[#f1f5fb] text-[#475467] ring-[#cdd5df]";
}

export function AdminShell({
  title,
  subtitle,
  headerExtra,
  children,
}: {
  title: string;
  subtitle?: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [me, setMe] = useState<Me | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/me", { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 401) {
          window.location.href = `/admin/login?next=${encodeURIComponent(
            pathname || "/admin/hotel"
          )}`;
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((d) => {
        if (alive) {
          setMe(d);
          setLoadingMe(false);
        }
      })
      .catch(() => setLoadingMe(false));
    return () => {
      alive = false;
    };
  }, [pathname]);

  const isAdmin = me?.role === "SUPER_ADMIN" || me?.role === "OPS";
  const visibleNav = NAV.filter((n) => !n.adminOnly || isAdmin);

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen bg-[#f5f8ff]">
      {/* 顶栏 */}
      <header className="sticky top-0 z-30 border-b border-[#e4e7ec] bg-white/85 backdrop-blur-xl">
        <div className="flex h-[60px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-[#475467] hover:bg-[#f1f5fb] lg:hidden"
              aria-label="打开菜单"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/admin/hotel" className="flex items-center gap-2.5">
              <div
                className="shrink-0 overflow-hidden"
                style={{ width: 36, height: 36 }}
              >
                <img
                  src="/logo.png"
                  alt="旅途"
                  width={36}
                  height={36}
                  draggable={false}
                  className="select-none"
                  style={{
                    width: 36,
                    height: 36,
                    objectFit: "contain",
                  }}
                />
              </div>
              <div className="leading-tight">
                <div className="text-[14px] font-semibold text-[#0b1f4a]">
                  旅途 · 供应链控制台
                </div>
                <div className="text-[11px] text-[#98a2b3]">
                  Supplier & Lead Console
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden rounded-lg px-2.5 py-1.5 text-[12.5px] text-[#475467] transition hover:bg-[#f1f5fb] md:inline-flex"
            >
              预览前台 ↗
            </Link>
            {loadingMe ? (
              <div className="h-8 w-24 animate-pulse rounded-full bg-[#eef2f7]" />
            ) : me ? (
              <div className="flex items-center gap-2">
                <div className="hidden text-right sm:block">
                  <div className="text-[13px] font-medium leading-tight text-[#172033]">
                    {me.realName || me.username}
                  </div>
                  <div className="text-[11px] leading-tight text-[#98a2b3]">
                    @{me.username}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${roleBadgeStyles(
                    me.role
                  )}`}
                >
                  <Shield className="h-3 w-3" />
                  {roleLabel(me.role)}
                </span>
                <button
                  onClick={onLogout}
                  className="grid h-8 w-8 place-items-center rounded-lg text-[#475467] transition hover:bg-[#fef3f2] hover:text-[#b42318]"
                  aria-label="退出"
                  title="退出登录"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 侧边栏（桌面） */}
        <aside className="sticky top-[60px] hidden h-[calc(100vh-60px)] w-[228px] shrink-0 border-r border-[#e4e7ec] bg-white/60 lg:block">
          <NavList items={visibleNav} pathname={pathname || ""} />
        </aside>

        {/* 移动端抽屉 */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setOpen(false)}
          >
            <aside
              className="absolute inset-y-0 left-0 w-[260px] bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-[60px] items-center justify-between border-b border-[#e4e7ec] px-4">
                <span className="text-[14px] font-semibold text-[#0b1f4a]">
                  菜单
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-[#475467] hover:bg-[#f1f5fb]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavList
                items={visibleNav}
                pathname={pathname || ""}
                onClick={() => setOpen(false)}
              />
            </aside>
          </div>
        )}

        {/* 主内容 */}
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-[1280px]">
            {/* 页面标题 */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[12px] text-[#667085]">
                  <Hotel className="h-3.5 w-3.5" />
                  旅途 · 供应链运营
                </div>
                <h1 className="mt-1 text-[22px] font-bold tracking-tight text-[#0b1f4a] md:text-[26px]">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1 text-[13.5px] text-[#667085]">{subtitle}</p>
                )}
              </div>
              {headerExtra}
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavList({
  items,
  pathname,
  onClick,
}: {
  items: typeof NAV;
  pathname: string;
  onClick?: () => void;
}) {
  return (
    <nav className="space-y-1 p-3">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/admin/hotel"
            ? pathname === "/admin/hotel"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition ${
              active
                ? "bg-[#eaf1ff] text-[#0b4fd8] ring-1 ring-[#0b4fd8]/10"
                : "text-[#475467] hover:bg-[#f1f5fb] hover:text-[#172033]"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
            {active && (
              <BellDot className="ml-auto h-3 w-3 text-[#0b4fd8]/40" />
            )}
          </Link>
        );
      })}

      <div className="mt-6 rounded-xl bg-[#fff3e8] p-3 text-[11.5px] leading-relaxed text-[#7c3206]">
        <div className="font-semibold">当前阶段：人工核验供应链</div>
        <div className="mt-0.5 text-[#7c3206]/75">
          候选机构默认不公开，不会自动联系或询价。
        </div>
      </div>
    </nav>
  );
}

/* =============================================================================
 * 通用 UI 基件
 * ============================================================================*/

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#e9edf5] bg-white shadow-[0_2px_10px_-6px_rgba(15,23,42,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    NEW: {
      label: "新线索",
      cls: "bg-[#eaf1ff] text-[#0b4fd8] ring-[#0b4fd8]/20",
    },
    ADDED: {
      label: "已添加微信",
      cls: "bg-[#e6f0fe] text-[#0952d0] ring-[#0952d0]/20",
    },
    CONTACTED: {
      label: "已沟通",
      cls: "bg-[#fff3e8] text-[#b04a00] ring-[#ff7a1a]/25",
    },
    QUOTED: {
      label: "已报价",
      cls: "bg-[#fef4ca] text-[#8a5400] ring-[#d0a23d]/25",
    },
    DEAL: {
      label: "已成交",
      cls: "bg-[#e6f9f0] text-[#067647] ring-[#12b76a]/25",
    },
    LOST: {
      label: "已流失",
      cls: "bg-[#fef3f2] text-[#b42318] ring-[#f04438]/20",
    },
    INVALID: {
      label: "无效线索",
      cls: "bg-[#f1f5fb] text-[#475467] ring-[#cdd5df]",
    },
  };
  const { label, cls } = map[status] || {
    label: status,
    cls: "bg-[#f1f5fb] text-[#475467] ring-[#cdd5df]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  );
}

export function ContactChip({
  type,
  value,
  onCopy,
}: {
  type: "WECHAT" | "MOBILE";
  value: string;
  onCopy?: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e7ec] bg-[#f5f8ff] px-2 py-1 text-[12px]">
      <span className="rounded bg-white px-1.5 py-0.5 text-[10.5px] font-medium text-[#475467] ring-1 ring-[#e4e7ec]">
        {type === "WECHAT" ? "微信" : "手机"}
      </span>
      <span className="font-mono text-[12.5px] text-[#0b1f4a]">{value}</span>
      {onCopy && (
        <button
          onClick={onCopy}
          className="text-[#0b4fd8] hover:underline"
          title="复制"
        >
          复制
        </button>
      )}
    </div>
  );
}

export function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => false
    );
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return Promise.resolve(ok);
  } catch {
    return Promise.resolve(false);
  }
}

export function fmtDate(d: string | Date | null | undefined, withTime = true) {
  if (!d) return "-";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  if (!withTime) return date;
  return `${date} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export function fmtYuan(cents: number | null | undefined) {
  if (cents == null) return "-";
  return `¥${(cents / 100).toFixed(2)}`;
}
