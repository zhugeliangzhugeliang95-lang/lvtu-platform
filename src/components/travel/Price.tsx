type PriceProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
};

export function Price({ value, suffix = "起", prefix = "¥", className = "" }: PriceProps) {
  return (
    <span className={`inline-flex items-baseline font-bold tabular-nums text-[var(--price)] ${className}`}>
      <span className="mr-0.5 text-[0.62em]">{prefix}</span>
      <span>{value.toLocaleString("zh-CN")}</span>
      {suffix ? <span className="ml-1 text-[0.48em] font-semibold text-[#374151]">{suffix}</span> : null}
    </span>
  );
}
