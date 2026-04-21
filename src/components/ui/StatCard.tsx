interface StatCardProps {
  value: string | number;
  unit?: string;
  title: string;
  dimmed?: boolean;
}

export function StatCard({ value, unit, title, dimmed = false }: StatCardProps) {
  return (
    <div
      className={`bg-surface rounded-card shadow-card p-4 flex flex-col gap-0.5 ${dimmed ? "opacity-50" : ""}`}
    >
      <div className="tabular text-display font-bold leading-[1.05] tracking-[-0.03em] text-primary">
        {value}
        {unit && (
          <span className="text-footnote font-normal tracking-normal text-secondary ml-1">
            {unit}
          </span>
        )}
      </div>
      <div className="text-subhead text-secondary leading-snug">{title}</div>
    </div>
  );
}
