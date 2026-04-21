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
        interactive w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5
        bg-transparent border-0 cursor-pointer font-[inherit] text-left
        [WebkitTapHighlightColor:transparent]
        ${!onClick ? "cursor-default" : ""}
      `}
    >
      {icon && (
        <span
          className={`shrink-0 w-7 h-7 flex items-center justify-center ${destructive ? "text-danger" : "text-amber"}`}
        >
          {icon}
        </span>
      )}
      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span
          className={`text-body font-normal leading-snug ${destructive ? "text-danger" : "text-primary"}`}
        >
          {label}
        </span>
        {secondaryLabel && (
          <span className="text-footnote text-secondary leading-snug">
            {secondaryLabel}
          </span>
        )}
      </span>
      {value && (
        <span className="shrink-0 text-body text-secondary">{value}</span>
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
