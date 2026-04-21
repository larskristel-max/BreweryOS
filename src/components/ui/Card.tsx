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
      className={`bg-surface rounded-card shadow-card overflow-hidden ${padding} ${className} ${onClick ? "interactive cursor-pointer" : ""}`}
    >
      {children}
    </div>
  );
}
