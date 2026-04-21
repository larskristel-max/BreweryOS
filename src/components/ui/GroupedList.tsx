import { ReactNode, Children } from "react";

interface GroupedListProps {
  children: ReactNode;
}

export function GroupedList({ children }: GroupedListProps) {
  const items = Children.toArray(children).filter(Boolean);

  return (
    <div className="bg-surface rounded-card shadow-card overflow-hidden">
      {items.map((child, i) => (
        <div key={i}>
          {child}
          {i < items.length - 1 && (
            <div className="h-px bg-hairline ml-14" />
          )}
        </div>
      ))}
    </div>
  );
}
