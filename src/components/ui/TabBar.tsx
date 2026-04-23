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
        className="fixed bottom-0 left-0 right-0 z-[940] h-[calc(70px+env(safe-area-inset-bottom,0px))]"
      >
        <div className="absolute inset-x-3 bottom-2 rounded-[26px] border border-white/60 bg-white/86 shadow-[0_12px_34px_rgba(15,23,42,0.16)] backdrop-blur-2xl" />
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-[950] flex items-center justify-around px-3 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] pt-2 h-[calc(70px+env(safe-area-inset-bottom,0px))]"
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
        interactive flex flex-col items-center justify-center gap-1 min-w-[68px]
        rounded-2xl px-2 py-1.5 bg-transparent border-0 cursor-pointer font-[inherit]
        [WebkitTapHighlightColor:transparent] transition-all duration-200
        ${isActive ? "text-primary bg-black/[0.04]" : "text-secondary"}
      `}
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span className="text-[10px] leading-none tracking-[0.01em] font-medium">
        {label}
      </span>
    </button>
  );
}
