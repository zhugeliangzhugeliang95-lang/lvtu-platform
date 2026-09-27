const LABELS: Record<string, string> = { DISCOVERED: "刚发现", RESEARCHED: "已研究", CONTACT_PENDING: "待联系", CONTACTED: "已联系", QUALIFICATION_PENDING: "待补资质", VERIFIED: "已核验", NEGOTIATING: "洽谈中", ACTIVE: "可供货", PAUSED: "已暂停", REJECTED: "已拒绝", EXPIRED: "已过期" };
export function SupplierStatusBadge({ status }: { status: string }) {
  const cls = status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : status === "REJECTED" || status === "EXPIRED" ? "bg-red-50 text-red-700" : status === "VERIFIED" || status === "NEGOTIATING" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-800";
  return <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-semibold ${cls}`}>{LABELS[status] || status}</span>;
}

