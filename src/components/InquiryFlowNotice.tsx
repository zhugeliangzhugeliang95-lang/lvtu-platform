import { Bot, CheckCircle2, ClipboardList, Clock3 } from "lucide-react";

const steps = [
  { icon: ClipboardList, label: "填写信息" },
  { icon: Bot, label: "旅途预估" },
  { icon: Clock3, label: "等待报价" },
  { icon: CheckCircle2, label: "确认后继续" },
];

export function InquiryFlowNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "rounded-[18px] bg-[#eef6ff] p-4" : "rounded-[20px] border border-[#d7e7fa] bg-white p-4 shadow-[0_8px_24px_rgba(25,83,150,.07)]"}>
      <div className="grid grid-cols-4 gap-2">
        {steps.map(({ icon: Icon, label }, index) => (
          <div key={label} className="relative flex min-w-0 flex-col items-center text-center">
            {index < steps.length - 1 ? <span className="absolute left-[62%] top-[15px] h-px w-[76%] bg-[#bdd4ef]" /> : null}
            <span className="relative z-10 grid size-8 place-items-center rounded-full bg-[#e7f1ff] text-[#1769e0]"><Icon size={15} /></span>
            <span className="mt-2 text-[10px] font-semibold leading-4 text-[#53677e]">{label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 border-t border-[#d9e7f6] pt-3 text-[10px] leading-5 text-[#667085]">提交后不会自动扣款、出票或锁定库存。报价会说明价格、可用性和退改规则，由你确认后再继续。</p>
    </div>
  );
}
