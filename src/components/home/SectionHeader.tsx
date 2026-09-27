import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function SectionHeader({
  title,
  subtitle,
  action,
  href,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 px-5">
      <div className="min-w-0">
        <h2 className="text-[23px] font-semibold leading-[1.25] text-[var(--ink-navy)]">{title}</h2>
        {subtitle ? <p className="mt-1.5 text-[13px] leading-5 text-[var(--slate)]">{subtitle}</p> : null}
      </div>
      {action && href ? (
        <Link href={href} className="inline-flex min-h-11 shrink-0 items-center gap-0.5 text-[12px] font-medium text-[var(--slate)] transition-colors hover:text-[var(--voyage-blue)] active:scale-[0.975]">
          {action}<ChevronRight size={15} />
        </Link>
      ) : null}
    </div>
  );
}
