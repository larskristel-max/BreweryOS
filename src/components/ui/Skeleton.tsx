interface SkeletonProps {
  /** Width expressed as a Tailwind class or fraction string, e.g. "w-full", "w-3/5" */
  widthClass?: string;
  /** Height expressed as a Tailwind class, e.g. "h-4", "h-[18px]" */
  heightClass?: string;
  /** Border-radius expressed as a Tailwind class, e.g. "rounded-md", "rounded-full" */
  roundedClass?: string;
}

export function Skeleton({
  widthClass = "w-full",
  heightClass = "h-4",
  roundedClass = "rounded-md",
}: SkeletonProps) {
  return (
    <div className={`skeleton-shimmer shrink-0 ${widthClass} ${heightClass} ${roundedClass}`} />
  );
}

export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="bg-surface rounded-card p-4 flex flex-col gap-2.5">
      <Skeleton heightClass="h-[18px]" widthClass="w-3/5" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          heightClass="h-3.5"
          widthClass={i === lines - 1 ? "w-2/5" : "w-full"}
        />
      ))}
    </div>
  );
}
