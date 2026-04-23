import { ReactNode } from "react";
import { CaretRight } from "@phosphor-icons/react";

interface ListRowProps {
  icon?: ReactNode;
  label: string;
  secondaryLabel?: string;
  value?: string | ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
  destructive?: boolean;
}

export function ListRow({
  icon,
  label,
  secondaryLabel,
  value,
  showChevron = false,
  onClick,
  destructive = false,
}: ListRowProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        interactive w-full min-h-[56px] flex items-center gap-3.5 px-4 py-3
        bg-transparent border-0 cursor-pointer font-[inherit] text-left
        [WebkitTapHighlightColor:transparent]
        ${!onClick ? "cursor-default" : ""}
      `}
    >
      {icon && (
        <span
          className={`shrink-0 w-9 h-9 rounded-2xl border border-primary/8 bg-page/60 flex items-center justify-center ${destructive ? "text-danger" : "text-secondary"}`}
        >
          {icon}
        </span>
      )}
      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span
          className={`text-[16px] font-medium leading-[1.2] tracking-[-0.01em] ${destructive ? "text-danger" : "text-primary"}`}
        >
          {label}
        </span>
        {secondaryLabel && (
          <span className="text-[13px] text-secondary leading-[1.3]">
            {secondaryLabel}
          </span>
        )}
      </span>
      {value && (
        <span className="shrink-0 text-[14px] font-medium text-secondary">{value}</span>
      )}
      {showChevron && (
        <CaretRight
          size={16}
          weight="bold"
          className="shrink-0 text-tertiary -mr-0.5"
        />
      )}
    </button>
  );
}
