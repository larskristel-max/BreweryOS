import { ReactNode } from "react";

export interface TabItem {
  path: string;
  label: string;
  icon: ReactNode;
  isActive: boolean;
  onPress: () => void;
}

interface TabBarProps {
  items: TabItem[];
  centerSlot?: ReactNode;
}

export function TabBar({ items, centerSlot }: TabBarProps) {
  return (
    <>
      <div
        aria-hidden="true"
        className="fixed bottom-0 left-0 right-0 z-[940] h-[calc(72px+env(safe-area-inset-bottom,0px))]"
      >
        <div className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom,0px)+6px)] h-[62px] rounded-[26px] border border-primary/10 bg-white/95 shadow-[0_8px_22px_rgba(15,23,42,0.1),0_2px_6px_rgba(15,23,42,0.05)] tab-bar-blur" />
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-[950] flex items-center justify-around px-5 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2 h-[calc(72px+env(safe-area-inset-bottom,0px))]"
      >
        {items.map((item) => (
          <TabBarButton key={item.path} {...item} />
        ))}
      </nav>

      {centerSlot}
    </>
  );
}

function TabBarButton({ label, icon, isActive, onPress }: TabItem) {
  return (
    <button
      onClick={onPress}
      aria-current={isActive ? "page" : undefined}
      className={`
        interactive flex flex-col items-center justify-center gap-0.5 min-w-[68px]
        rounded-xl px-2 py-1 bg-transparent border-0 cursor-pointer font-[inherit]
        [WebkitTapHighlightColor:transparent] transition-all duration-200
        ${isActive ? "text-primary bg-primary/[0.055]" : "text-secondary"}
      `}
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span className="text-[10px] leading-none tracking-[0.01em] font-medium">
        {label}
      </span>
    </button>
  );
}
