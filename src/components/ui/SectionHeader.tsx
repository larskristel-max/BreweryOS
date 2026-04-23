interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between px-0.5 pb-2">
      <span className="text-[14px] font-medium tracking-[-0.01em] text-secondary">
        {title}
      </span>
      {action && (
        <button
          onClick={onAction}
          className="interactive rounded-full px-2 py-1 text-[12px] font-medium text-primary/80 bg-transparent border-0 cursor-pointer"
        >
          {action}
        </button>
      )}
    </div>
  );
}
