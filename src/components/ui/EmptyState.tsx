import { ReactNode } from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  body?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon, title, body, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 gap-3 text-center">
      <span className="text-tertiary text-[48px] leading-none">{icon}</span>
      <h3 className="text-headline font-semibold text-primary m-0">{title}</h3>
      {body && (
        <p className="text-subhead text-secondary m-0 leading-relaxed max-w-[260px]">
          {body}
        </p>
      )}
      {ctaLabel && onCta && (
        <div className="mt-2 w-full max-w-[220px]">
          <Button onClick={onCta}>{ctaLabel}</Button>
        </div>
      )}
    </div>
  );
}
