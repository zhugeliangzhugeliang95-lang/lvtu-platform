import { Database, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { PlatformFrame } from "@/components/platform/Catalog";

const protections = [
  { icon: LockKeyhole, title: "账号信息保护", note: "密码以不可逆方式保存，平台工作人员无法查看你的原始密码。" },
  { icon: Database, title: "最少必要使用", note: "联系方式、旅客信息只用于需求确认、下单、履约、通知和售后。" },
  { icon: EyeOff, title: "敏感信息控制", note: "付款凭证只允许对应用户和授权后台人员访问，不作为公开图片展示。" },
];

const sections = [
  ["我们收集哪些信息", "账号信息（手机号或邮箱）、你主动填写的旅行需求、联系人信息、常用旅客资料、订单与付款凭证、客服及售后记录，以及保障服务安全所需的设备与访问日志。"],
  ["信息如何使用", "用于创建账号、生成预估、人工确认旅行方案、完成订单与履约、发送服务通知、处理退款或售后，以及防范欺诈和保障平台安全。未经你的明确授权，不会把个人资料用于与旅行服务无关的用途。"],
  ["必要的信息共享", "实际履约需要时，平台会把完成预订所必需的姓名、联系方式或旅客资料提供给经人工确认的旅行社、酒店、交通或其他服务方。共享范围以完成本次服务所需的最小信息为限。"],
  ["保存期限", "账号和交易数据按提供服务、处理争议及履行财务和法律留存义务所需期限保存。付款凭证、订单和售后记录不会因前端删除操作立即消失。"],
  ["你的权利", "你可以在个人中心查看或修改基础资料，也可以通过客服申请访问、更正或删除账户数据、撤回非必要授权或注销账号。涉及进行中的订单时，我们会先完成必要的履约与财务核对。"],
  ["未成年人保护", "未成年人使用平台应在监护人指导下进行。涉及儿童旅客信息时，应由监护人或获得监护人授权的成年人提交。"],
];

export default function PrivacyPage() {
  return <PlatformFrame title="隐私政策" subtitle="生效日期：2026年9月21日" back="/settings" active="member"><section className="px-5 py-6"><div className="rounded-[22px] bg-[#0d315d] p-5 text-white"><ShieldCheck size={24}/><h1 className="mt-3 text-[21px] font-semibold">你的旅行信息由你掌控</h1><p className="mt-2 text-[11px] leading-5 text-white/70">平台只收集完成旅行服务和保障交易安全所必需的信息，不出售个人资料。</p></div><div className="mt-5 space-y-3">{protections.map(({icon:Icon,title,note})=><div key={title} className="app-card flex gap-3 p-4"><span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-[var(--app-blue-soft)] text-[var(--app-blue)]"><Icon size={18}/></span><div><h2 className="text-[13px] font-semibold">{title}</h2><p className="mt-1 text-[10px] leading-5 text-[var(--app-muted)]">{note}</p></div></div>)}</div><div className="mt-7 divide-y divide-[#e8eef5] border-y border-[#e8eef5]">{sections.map(([title,body])=><section key={title} className="py-5"><h2 className="text-[15px] font-semibold">{title}</h2><p className="mt-2 text-[11px] leading-6 text-[#667085]">{body}</p></section>)}</div><p className="mt-6 text-[10px] leading-5 text-[var(--app-muted)]">如果你对隐私政策或个人信息处理有疑问，请通过“帮助与客服”联系平台。正式上线时，运营主体、注册地址和隐私联系渠道应以平台公示信息为准。</p></section></PlatformFrame>;
}
