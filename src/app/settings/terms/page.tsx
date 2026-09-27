import { CheckCircle2, FileText, Headphones, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PlatformFrame } from "@/components/platform/Catalog";

const sections = [
  ["服务范围", "旅途提供旅行需求整理、公开市场参考、规则化预估、旅行顾问人工确认、订单进度、付款凭证审核、履约跟进与售后协助。旅行团、酒店、交通、门票等具体服务可能由具备相应能力的第三方实际履约。"],
  ["预估与最终报价", "旅途预估不是售价，不代表实时库存，也不会自动锁房、锁座或扣款。只有顾问发送的最终确认方案，并经你确认后，才进入订单和付款流程。最终价格可能因日期、库存、规格或退改条件变化而与预估不同。"],
  ["订单与付款", "请在付款前核对订单金额、收款主体和付款说明。当前人工付款流程需要上传付款凭证，由后台核对实际到账后才进入履约。仅上传截图不等于款项已经确认到账。"],
  ["取消、退改与退款", "不同产品的取消、变更和退款规则不同，以最终报价、确认单、合同或订单页面展示的规则为准。平台不会在规则之外承诺无条件退款。"],
  ["用户责任", "你应提供真实、准确且有权提交的联系人和旅客信息，妥善保管账号，不得利用平台实施欺诈、恶意下单、攻击系统、批量抓取或其他违法违规行为。"],
  ["第三方服务", "第三方旅行社、酒店、承运人、景区或用车服务方对其实际提供的服务承担相应责任。旅途会在职责范围内协助沟通、跟进和处理售后。"],
  ["账号与服务调整", "平台可对存在安全风险、违法违规或严重滥用行为的账号限制功能或停止服务。产品内容、页面功能和服务规则可能随业务调整，重要变化会通过页面或站内通知说明。"],
  ["争议处理", "发生争议时，请先通过平台客服提交订单、沟通和付款资料。双方应优先友好协商；无法协商解决时，按适用法律和实际运营主体公示的争议解决方式处理。"],
];

export default function TermsPage() {
  return <PlatformFrame title="用户服务协议" subtitle="生效日期：2026年9月21日" back="/settings" active="member"><section className="px-5 py-6"><div className="rounded-[22px] bg-[#0d315d] p-5 text-white"><FileText size={24}/><h1 className="mt-3 text-[21px] font-semibold">清楚确认，再安心出发</h1><p className="mt-2 text-[11px] leading-5 text-white/70">使用旅途前，请了解预估、人工确认、付款和第三方履约之间的边界。</p></div><div className="mt-5 flex items-start gap-3 rounded-[18px] bg-[#eef7ff] p-4"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-[var(--app-blue)]"/><p className="text-[11px] leading-5 text-[#53677e]">注册、登录或继续使用平台，表示你已经阅读并同意本协议及隐私政策。对具体订单，最终报价、确认单和退改规则优先适用。</p></div><div className="mt-7 divide-y divide-[#e8eef5] border-y border-[#e8eef5]">{sections.map(([title,body],index)=><section key={title} className="py-5"><div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[var(--app-blue)]"/><h2 className="text-[15px] font-semibold">{index+1}. {title}</h2></div><p className="mt-2 pl-6 text-[11px] leading-6 text-[#667085]">{body}</p></section>)}</div><div className="mt-6 grid grid-cols-2 gap-3"><Link href="/settings/privacy" className="inline-flex min-h-12 items-center justify-center rounded-[15px] border border-[#dce8f4] bg-white text-[11px] font-semibold">查看隐私政策</Link><Link href="/contact?topic=协议咨询" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[15px] bg-[var(--app-blue)] text-[11px] font-semibold text-white"><Headphones size={15}/>联系平台客服</Link></div><p className="mt-6 text-[10px] leading-5 text-[var(--app-muted)]">正式上线时，运营主体名称、注册地址、联系方式与争议管辖信息应以平台公示和签约文件为准。</p></section></PlatformFrame>;
}
