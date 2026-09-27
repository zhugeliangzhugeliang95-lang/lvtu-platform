import Image from "next/image";

type BrandMarkProps = {
  showText?: boolean;
  showEnglish?: boolean;
  compact?: boolean;
  className?: string;
};

export function BrandMark({
  showText = true,
  showEnglish,
  compact = false,
  className = "",
}: BrandMarkProps) {
  const shouldShowEnglish = showEnglish ?? !compact;
  const markClass = compact ? "h-7 w-7" : "h-9 w-9";
  const imageSize = compact ? 28 : 36;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`shrink-0 ${markClass}`}>
        <Image
          src="/logo-mark.png"
          alt="旅途"
          width={imageSize}
          height={imageSize}
          className="h-full w-full object-contain"
          priority={!compact}
        />
      </div>
      {showText ? (
        <div className="leading-none">
          <p className={`${compact ? "text-[17px]" : "text-[22px]"} font-semibold text-[#08204a]`}>旅途</p>
          {shouldShowEnglish ? (
            <p className="mt-1 text-[9px] font-medium leading-none text-[#2f7df6]">LVTU</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
