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
    const handler = () => setCompact(el.scrollTop > 42);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [scrollRef]);

  return (
    <header className="flex items-end justify-between gap-3 pb-0.5">
      <div className="flex-1 min-w-0">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="interactive mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-white/70 px-3 py-1 text-[13px] font-medium text-secondary"
          >
            <CaretLeft size={16} weight="bold" />
            <span>Back</span>
          </button>
        )}
        {subtitle && (
          <p className="text-[12px] font-medium tracking-[0.01em] text-secondary/90">
            {subtitle}
          </p>
        )}
        <h1
          className={`
            m-0 truncate text-primary tracking-[-0.03em]
            transition-[font-size,line-height,margin] duration-200
            ${compact ? "mt-1 text-[30px] leading-[1.03] font-semibold" : "mt-1.5 text-[36px] leading-[0.98] font-semibold"}
          `}
        >
          {title}
        </h1>
      </div>
      {rightAction && <div className="shrink-0 pb-1">{rightAction}</div>}
    </header>
  );
}
