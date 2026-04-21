interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between pt-7 pb-1.5 pl-1 pr-1">
      <span className="text-caption font-semibold uppercase tracking-[0.06em] text-secondary">
        {title}
      </span>
      {action && (
        <button
          onClick={onAction}
          className="interactive text-footnote text-amber bg-transparent border-0 cursor-pointer font-[inherit]"
        >
          {action}
        </button>
      )}
    </div>
  );
}
