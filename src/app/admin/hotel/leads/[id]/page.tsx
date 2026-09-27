"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AdminShell,
  Card,
  StatusBadge,
  copyText,
  fmtDate,
  fmtYuan,
} from "@/components/hotel-admin/AdminShell";
import {
  ArrowLeft,
  Copy,
  MessageSquare,
  Send,
  ChevronRight,
  Hash,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Sparkles,
  History,
  UserCog,
  Phone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Banknote,
} from "lucide-react";

/* =============================================================================
 * /admin/hotel/leads/[id] —— 线索详情
 *  - 基础信息 / 酒店需求 / 联系方式 / 状态管理 / 备注时间线 / 快捷话术 / 操作记录
 * ============================================================================*/

type Lead = {
  id: string;
  leadNo: string;
  inquiryType: "INTENT" | "HOTEL";
  destination: string;
  timeframe: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  nights: number | null;
  roomCount: string | null;
  guestCount: string;
  budget: string | null;
  preferences: string[];
  contactType: "WECHAT" | "MOBILE";
  contactValue: string;
  remark: string | null;
  source: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  landingPage: string | null;
  userAgent: string | null;
  ip: string | null;
  status: string;
  assignedToId: string | null;
  assignedTo: {
    id: string;
    username: string;
    realName: string | null;
    role: string;
  } | null;
  lastFollowedAt: string | null;
  dealAmount: number | null;
  dealRemark: string | null;
  dealAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes: Array<{
    id: string;
    content: string;
    createdAt: string;
    adminUser: { id: string; username: string; realName: string | null };
  }>;
  statusLogs: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    createdAt: string;
    operator: {
      id: string;
      username: string;
      realName: string | null;
    } | null;
  }>;
};

type Me = { id: string; username: string; realName: string | null; role: string };

type Staff = {
  id: string;
  username: string;
  realName: string | null;
  role: string;
  status: string;
};

const NEXT_STATUS: Array<{ to: string; label: string; color: string }> = [
  { to: "ADDED", label: "标记已添加微信", color: "#0952d0" },
  { to: "CONTACTED", label: "标记已沟通", color: "#ff7a1a" },
  { to: "QUOTED", label: "标记已报价", color: "#d0a23d" },
  { to: "DEAL", label: "标记已成交", color: "#12b76a" },
];

const NEGATIVE_STATUS: Array<{ to: string; label: string; color: string }> = [
  { to: "LOST", label: "标记流失", color: "#b42318" },
  { to: "INVALID", label: "标记无效", color: "#98a2b3" },
];

const QUICK_SCRIPTS = [
  "你好，我是旅途酒店客服。看到你想咨询{destination}的酒店，我可以先帮你查一版方案，看看有没有合适的。",
  "你这次更看重价格、位置，还是酒店档次？我根据你的方向先给你 2–3 个对比方案。",
  "我先帮你看 2–3 个方案，觉得合适再定，不合适也没关系，不用下单压力。",
  "想问一下入住人员里有小孩/老人吗？有的话我帮你留意加床和无障碍房。",
  "我这边看到你备注里提到{remark}，我会先按这个方向找方案，有更新发你微信。",
];

export default function HotelLeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/hotel-leads/${id}`, { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 404) {
          router.push("/admin/hotel/leads");
          return null;
        }
        if (r.status === 403) {
          showToast("无权查看该线索");
          router.push("/admin/hotel/leads");
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((d) => {
        setLead(d);
        setLoading(false);
      });
  }, [id, router]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    fetch("/api/admin/me").then((r) => r.ok ? r.json() : null).then(setMe);
    fetch("/api/admin/staff")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.items && setStaff(d.items));
    return () => window.clearTimeout(timer);
  }, [load]);

  const isAdmin = me?.role === "SUPER_ADMIN" || me?.role === "OPS";

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/hotel-leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      showToast(data?.message || "操作失败");
      return false;
    }
    return data?.lead ?? true;
  };

  const changeStatus = async (to: string) => {
    if (!lead) return;
    if (to === "DEAL") {
      const amt = prompt("请输入成交金额（元，可含小数）：", "");
      if (amt == null) return;
      const yuan = parseFloat(amt);
      if (!Number.isFinite(yuan) || yuan < 0) {
        showToast("成交金额不合法");
        return;
      }
      const remark = prompt("成交备注（可选）：", "") || "";
      const updated = await patch({
        status: "DEAL",
        dealAmount: Math.round(yuan * 100),
        dealRemark: remark || null,
      });
      if (updated) {
        setLead(updated as Lead);
        showToast("已标记成交");
      }
      return;
    }
    const updated = await patch({ status: to });
    if (updated) {
      setLead(updated as Lead);
      showToast(`状态已更新为 ${to}`);
    }
  };

  const assignTo = async (aid: string | null) => {
    const updated = await patch({ assignedToId: aid });
    if (updated) {
      setLead(updated as Lead);
      showToast(aid ? "已分配" : "已取消分配");
    }
  };

  const onCopyText = async (text: string, label: string) => {
    const ok = await copyText(text);
    showToast(ok ? `${label} 已复制` : "复制失败");
  };

  const submitNote = async () => {
    const content = noteDraft.trim();
    if (!content) return;
    setSubmitting(true);
    const res = await fetch(`/api/admin/hotel-leads/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json().catch(() => null);
    setSubmitting(false);
    if (!res.ok) {
      showToast(data?.message || "提交失败");
      return;
    }
    setNoteDraft("");
    load();
    showToast("跟进备注已添加");
  };

  const renderedScripts = useMemo(() => {
    if (!lead) return [];
    return QUICK_SCRIPTS.map((t) =>
      t
        .replace("{destination}", lead.destination)
        .replace("{remark}", lead.remark || "你提到的需求")
    );
  }, [lead]);

  return (
    <AdminShell
      title="线索详情"
      subtitle="跟进 · 状态变更 · 成交记录"
      headerExtra={
        <div className="flex items-center gap-2">
          {isAdmin && lead && (
            <button
              onClick={async () => {
                if (!confirm(`确定删除线索 ${lead.leadNo}？此操作不可恢复。`)) return;
                const res = await fetch(`/api/admin/hotel-leads/${lead.id}`, { method: "DELETE" });
                if (res.ok) { router.push("/admin/hotel/leads"); return; }
                const err = await res.json().catch(() => ({}));
                alert(`删除失败：${err?.message || res.status}`);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#fecdca] bg-[#fef3f2] px-3 py-2 text-[13px] font-medium text-[#b42318] transition hover:bg-[#fee4e2]"
            >
              删除线索
            </button>
          )}
          <Link
            href="/admin/hotel/leads"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e7ec] bg-white px-3 py-2 text-[13px] text-[#475467] transition hover:bg-[#f5f8ff]"
          >
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </Link>
        </div>
      }
    >
      {loading && (
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="h-[400px] animate-pulse rounded-2xl bg-white ring-1 ring-[#e9edf5]" />
          <div className="h-[400px] animate-pulse rounded-2xl bg-white ring-1 ring-[#e9edf5]" />
        </div>
      )}

      {!loading && lead && (
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          {/* 主区 */}
          <div className="space-y-4">
            {/* 头部：编号 + 状态 */}
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[12px] text-[#667085]">
                    <Hash className="h-3.5 w-3.5" />
                    <span className="font-mono text-[#0b4fd8]">{lead.leadNo}</span>
                    <span>· 提交于 {fmtDate(lead.createdAt)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <h2 className="text-[20px] font-bold text-[#0b1f4a]">
                      {lead.destination}
                    </h2>
                    <StatusBadge status={lead.status} />
                    <span className="rounded-md bg-[#f5f8ff] px-2 py-0.5 text-[11.5px] text-[#475467] ring-1 ring-[#e4e7ec]">
                      来源 · {lead.source}
                    </span>
                  </div>
                </div>
                {lead.status === "DEAL" && lead.dealAmount != null && (
                  <div className="rounded-xl border border-[#12b76a]/25 bg-[#e6f9f0] px-4 py-2 text-[#067647]">
                    <div className="flex items-center gap-1.5 text-[11.5px] font-medium">
                      <Banknote className="h-3.5 w-3.5" />
                      成交金额
                    </div>
                    <div className="mt-0.5 text-[18px] font-bold">
                      {fmtYuan(lead.dealAmount)}
                    </div>
                    {lead.dealRemark && (
                      <div className="mt-0.5 text-[11.5px] text-[#067647]/80">
                        {lead.dealRemark}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* 需求详情 */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-[14.5px] font-semibold text-[#0b1f4a]">
                  {lead.inquiryType === "HOTEL" ? "酒店需求" : "出行意向"}
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                    lead.inquiryType === "HOTEL"
                      ? "bg-[#fff3e8] text-[#b04a00] ring-[#ff7a1a]/25"
                      : "bg-[#eaf1ff] text-[#0b4fd8] ring-[#0b4fd8]/20"
                  }`}
                >
                  {lead.inquiryType === "HOTEL" ? "详细询价" : "轻量意向"}
                </span>
              </div>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="目的地"
                  value={lead.destination}
                />
                {lead.inquiryType === "HOTEL" && lead.checkInDate && lead.checkOutDate ? (
                  <InfoRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="入住 / 离店"
                    value={
                      <>
                        {fmtDate(lead.checkInDate, false)} →{" "}
                        {fmtDate(lead.checkOutDate, false)}
                        <span className="ml-2 rounded bg-[#eaf1ff] px-1.5 py-0.5 text-[11px] text-[#0b4fd8]">
                          {lead.nights} 晚
                        </span>
                      </>
                    }
                  />
                ) : (
                  <InfoRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="大概什么时候"
                    value={lead.timeframe || <span className="text-[#98a2b3]">—</span>}
                  />
                )}
                <InfoRow
                  icon={<Users className="h-4 w-4" />}
                  label={lead.inquiryType === "HOTEL" ? "房间 / 人数" : "人数"}
                  value={
                    lead.inquiryType === "HOTEL" && lead.roomCount
                      ? `${lead.roomCount} · ${lead.guestCount}`
                      : lead.guestCount
                  }
                />
                {lead.inquiryType === "HOTEL" && (
                  <>
                    <InfoRow
                      icon={<Wallet className="h-4 w-4" />}
                      label="每晚预算"
                      value={lead.budget || <span className="text-[#98a2b3]">—</span>}
                    />
                    <InfoRow
                      icon={<Sparkles className="h-4 w-4" />}
                      label="酒店偏好"
                      value={
                        lead.preferences.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {lead.preferences.map((p) => (
                              <span
                                key={p}
                                className="rounded-full bg-[#f5f8ff] px-2 py-0.5 text-[11.5px] text-[#475467] ring-1 ring-[#e4e7ec]"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#98a2b3]">—</span>
                        )
                      }
                    />
                  </>
                )}
                <InfoRow
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="客户备注"
                  value={
                    lead.remark ? (
                      <span className="whitespace-pre-wrap">{lead.remark}</span>
                    ) : (
                      <span className="text-[#98a2b3]">无</span>
                    )
                  }
                  full
                />
              </div>
              {lead.inquiryType === "INTENT" && (
                <div className="mt-4 rounded-xl border border-[#0b4fd8]/15 bg-[#eaf1ff] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#0b4fd8]">
                  这是一条首屏轻量出行意向。建议先加客户微信，沟通后再帮他填详细询价单或直接报酒店方案。
                </div>
              )}
            </Card>

            {/* 跟进备注 */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-[14.5px] font-semibold text-[#0b1f4a]">
                  跟进备注
                </div>
                <span className="text-[12px] text-[#98a2b3]">
                  {lead.notes.length} 条
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="记录跟进过程，例如：已电话联系，客户希望今晚收到方案…"
                  rows={2}
                  maxLength={1000}
                  className="flex-1 rounded-xl border border-[#e4e7ec] bg-white px-3 py-2.5 text-[13.5px] outline-none transition placeholder:text-[#98a2b3] focus:border-[#0b4fd8] focus:ring-4 focus:ring-[#0b4fd8]/10"
                />
                <button
                  disabled={!noteDraft.trim() || submitting}
                  onClick={submitNote}
                  className="inline-flex h-auto items-center gap-1.5 self-stretch rounded-xl bg-[#0b4fd8] px-4 text-[13px] font-semibold text-white transition enabled:hover:bg-[#1056eb] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  提交
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {lead.notes.length === 0 && (
                  <div className="py-8 text-center text-[13px] text-[#98a2b3]">
                    还没有跟进备注。先添加一条？
                  </div>
                )}
                {lead.notes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl border border-[#e9edf5] bg-[#f5f8ff] p-3"
                  >
                    <div className="flex items-center justify-between text-[11.5px] text-[#667085]">
                      <span className="font-medium text-[#344054]">
                        {n.adminUser.realName || n.adminUser.username}
                      </span>
                      <span>{fmtDate(n.createdAt)}</span>
                    </div>
                    <div className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[#172033]">
                      {n.content}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 操作记录 */}
            <Card className="p-5">
              <div className="flex items-center gap-2 text-[14.5px] font-semibold text-[#0b1f4a]">
                <History className="h-4 w-4" />
                状态变更记录
              </div>
              <ol className="mt-3 space-y-2">
                {lead.statusLogs.length === 0 && (
                  <li className="text-[13px] text-[#98a2b3]">暂无记录</li>
                )}
                {lead.statusLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg bg-[#f5f8ff] px-3 py-2 text-[12.5px]"
                  >
                    <span className="text-[#667085]">{fmtDate(log.createdAt)}</span>
                    <span className="text-[#98a2b3]">·</span>
                    <StatusBadge status={log.fromStatus || "NEW"} />
                    <ChevronRight className="h-3.5 w-3.5 text-[#98a2b3]" />
                    <StatusBadge status={log.toStatus} />
                    {log.operator && (
                      <span className="ml-auto text-[11.5px] text-[#475467]">
                        由 {log.operator.realName || log.operator.username}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          {/* 侧栏 */}
          <div className="space-y-4">
            {/* 联系方式 + 复制 */}
            <Card className="p-5">
              <div className="flex items-center gap-2 text-[14.5px] font-semibold text-[#0b1f4a]">
                <Phone className="h-4 w-4" />
                联系方式
              </div>
              <div className="mt-3 rounded-xl border border-[#0b4fd8]/20 bg-[#eaf1ff] p-3">
                <div className="flex items-center gap-2 text-[12px] text-[#475467]">
                  <span className="rounded bg-white px-1.5 py-0.5 text-[10.5px] font-medium ring-1 ring-[#e4e7ec]">
                    {lead.contactType === "WECHAT" ? "微信" : "手机号"}
                  </span>
                </div>
                <div className="mt-2 break-all font-mono text-[16px] font-semibold text-[#0b1f4a]">
                  {lead.contactValue}
                </div>
                <button
                  onClick={() => onCopyText(lead.contactValue, "联系方式")}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0b4fd8] py-2 text-[13px] font-semibold text-white transition hover:bg-[#1056eb]"
                >
                  <Copy className="h-4 w-4" />
                  复制
                  {lead.contactType === "WECHAT"
                    ? "微信号并去添加"
                    : "手机号"}
                </button>
              </div>
              <p className="mt-2 text-[11.5px] text-[#98a2b3]">
                提示：添加客户微信后记得把状态改为「已添加微信」。
              </p>
            </Card>

            {/* 状态管理 */}
            <Card className="p-5">
              <div className="flex items-center gap-2 text-[14.5px] font-semibold text-[#0b1f4a]">
                <CheckCircle2 className="h-4 w-4" />
                状态流转
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {NEXT_STATUS.map((s) => (
                  <button
                    key={s.to}
                    disabled={lead.status === s.to}
                    onClick={() => changeStatus(s.to)}
                    className="rounded-lg border px-2.5 py-2 text-[12.5px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      borderColor: `${s.color}33`,
                      color: s.color,
                      background: lead.status === s.to ? `${s.color}12` : "#fff",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {NEGATIVE_STATUS.map((s) => (
                  <button
                    key={s.to}
                    disabled={lead.status === s.to}
                    onClick={() => changeStatus(s.to)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#e4e7ec] bg-white px-2.5 py-2 text-[12.5px] font-medium text-[#475467] transition hover:border-[#f04438]/40 hover:text-[#b42318] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {s.to === "LOST" ? (
                      <XCircle className="h-3.5 w-3.5" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    )}
                    {s.label}
                  </button>
                ))}
              </div>
            </Card>

            {/* 分配客服 */}
            <Card className="p-5">
              <div className="flex items-center gap-2 text-[14.5px] font-semibold text-[#0b1f4a]">
                <UserCog className="h-4 w-4" />
                跟进人
              </div>
              <div className="mt-2 text-[13.5px] text-[#172033]">
                当前：
                <span className="font-medium">
                  {lead.assignedTo
                    ? lead.assignedTo.realName || lead.assignedTo.username
                    : "未分配"}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {/* 客服自己可接单 */}
                {me && !isAdmin && lead.assignedToId !== me.id && (
                  <button
                    onClick={() => assignTo(me.id)}
                    className="w-full rounded-lg bg-[#ff7a1a] py-2 text-[13px] font-semibold text-white transition hover:bg-[#ff8a35]"
                  >
                    我来接这单
                  </button>
                )}
                {me && !isAdmin && lead.assignedToId === me.id && (
                  <button
                    onClick={() => assignTo(null)}
                    className="w-full rounded-lg border border-[#e4e7ec] bg-white py-2 text-[13px] font-medium text-[#475467] transition hover:bg-[#f5f8ff]"
                  >
                    释放此线索（取消接单）
                  </button>
                )}

                {/* 管理员可任意分配 */}
                {isAdmin && (
                  <select
                    value={lead.assignedToId || ""}
                    onChange={(e) => assignTo(e.target.value || null)}
                    className="h-9 w-full rounded-lg border border-[#e4e7ec] bg-white px-2.5 text-[13px] outline-none focus:border-[#0b4fd8]"
                  >
                    <option value="">未分配</option>
                    {staff
                      .filter(
                        (s) =>
                          s.status === "ACTIVE" &&
                          (s.role === "SUPPORT" ||
                            s.role === "SUPER_ADMIN" ||
                            s.role === "OPS")
                      )
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.realName || s.username}（{s.role}）
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </Card>

            {/* 快捷话术 */}
            <Card className="p-5">
              <div className="flex items-center gap-2 text-[14.5px] font-semibold text-[#0b1f4a]">
                <MessageSquare className="h-4 w-4" />
                快捷话术
              </div>
              <p className="mt-1 text-[12px] text-[#98a2b3]">
                点一下复制，粘贴到微信直接用。
              </p>
              <div className="mt-3 space-y-2">
                {renderedScripts.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[#e9edf5] bg-[#f5f8ff] p-3 text-[13px] leading-relaxed text-[#344054]"
                  >
                    {s}
                    <button
                      onClick={() => onCopyText(s, "话术")}
                      className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-[#0b4fd8] hover:underline"
                    >
                      <Copy className="h-3 w-3" />
                      复制话术
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* 来源追踪 */}
            {(lead.utmSource ||
              lead.utmMedium ||
              lead.utmCampaign ||
              lead.referrer ||
              lead.landingPage ||
              lead.ip) && (
              <Card className="p-5">
                <div className="text-[14.5px] font-semibold text-[#0b1f4a]">
                  来源追踪
                </div>
                <dl className="mt-3 space-y-1.5 text-[12px]">
                  {lead.utmSource && <MetaKV k="utm_source" v={lead.utmSource} />}
                  {lead.utmMedium && <MetaKV k="utm_medium" v={lead.utmMedium} />}
                  {lead.utmCampaign && (
                    <MetaKV k="utm_campaign" v={lead.utmCampaign} />
                  )}
                  {lead.referrer && <MetaKV k="referrer" v={lead.referrer} />}
                  {lead.landingPage && (
                    <MetaKV k="landing" v={lead.landingPage} />
                  )}
                  {lead.ip && <MetaKV k="ip" v={lead.ip} />}
                </dl>
              </Card>
            )}
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

function InfoRow({
  icon,
  label,
  value,
  full,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="flex items-center gap-1.5 text-[11.5px] text-[#98a2b3]">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-[14px] text-[#172033]">{value}</div>
    </div>
  );
}

function MetaKV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-[#98a2b3]">{k}</dt>
      <dd className="max-w-[200px] truncate text-right font-mono text-[#344054]">
        {v}
      </dd>
    </div>
  );
}
