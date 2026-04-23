import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretLeft } from "@phosphor-icons/react";
import { usePageScrollRef } from "./PageScrollContext";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  showBack = false,
  rightAction,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const scrollRef = usePageScrollRef();
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setCompact(el.scrollTop > 48);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [scrollRef]);

  return (
    <header className="flex items-end justify-between gap-2 pb-1">
      <div className="flex-1 min-w-0">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="interactive flex items-center gap-1 text-amber text-headline mb-1.5 bg-transparent border-0 cursor-pointer font-[inherit]"
          >
            <CaretLeft size={20} weight="bold" />
            <span>Back</span>
          </button>
        )}
        <h1
          className={`
            font-semibold tracking-[-0.02em] text-primary truncate m-0
            transition-[font-size,line-height] duration-200
            ${compact ? "text-[20px] leading-[1.2]" : "text-[26px] leading-[1.12]"}
          `}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-[12px] tracking-[0.03em] uppercase text-tertiary mt-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>
      {rightAction && (
        <div className="shrink-0 pb-1">{rightAction}</div>
      )}
    </header>
  );
}
