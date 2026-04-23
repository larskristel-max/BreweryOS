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
        className="fixed bottom-0 left-0 right-0 z-[935] h-[calc(96px+env(safe-area-inset-bottom,0px))]"
      >
        <div className="absolute inset-x-3 bottom-2 h-[84px] rounded-[34px] border border-white/85 bg-white/70 shadow-[0_14px_38px_rgba(15,23,42,0.14)] tab-bar-blur" />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-[950] flex items-end justify-between px-6 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] pt-3 h-[calc(96px+env(safe-area-inset-bottom,0px))]">
        <div className="flex flex-1 items-center justify-around pr-20">
          {items.slice(0, 2).map((item) => (
            <TabBarButton key={item.path} {...item} />
          ))}
        </div>
        <div className="flex flex-1 items-center justify-around pl-20">
          {items.slice(2).map((item) => (
            <TabBarButton key={item.path} {...item} />
          ))}
        </div>
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
        interactive flex flex-col items-center justify-center gap-1 min-w-[62px]
        rounded-2xl px-2 py-1.5 bg-transparent border-0 cursor-pointer font-[inherit]
        [WebkitTapHighlightColor:transparent] transition-all duration-200
        ${isActive ? "text-primary" : "text-secondary/85"}
      `}
    >
      <span className={`flex items-center justify-center ${isActive ? "opacity-100" : "opacity-80"}`}>{icon}</span>
      <span className={`text-[11px] leading-none tracking-[0.01em] ${isActive ? "font-semibold" : "font-medium"}`}>
        {label}
      </span>
    </button>
  );
}
