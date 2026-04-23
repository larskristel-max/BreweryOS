import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  padding?: string;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, padding = "p-4", className = "", onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className={`bg-surface/92 rounded-[24px] border border-white/70 shadow-[0_8px_28px_rgba(15,23,42,0.08)] overflow-hidden backdrop-blur-[3px] ${padding} ${className} ${onClick ? "interactive cursor-pointer" : ""}`}
    >
      {children}
    </div>
  );
}
