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
  const half = Math.floor(items.length / 2);
  const left  = items.slice(0, half);
  const right = items.slice(half);

  return (
    <>
      {/* Frosted glass backdrop — webkit-backdrop-filter via .tab-bar-blur CSS class */}
      <div
        aria-hidden="true"
        className="fixed bottom-0 left-0 right-0 z-[940] border-t border-hairline
                   h-[calc(64px+env(safe-area-inset-bottom,0px))]
                   bg-white/85 backdrop-blur-xl backdrop-saturate-[180%] tab-bar-blur"
      />

      {/* Navigation row */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[950] flex items-stretch
                   h-[calc(64px+env(safe-area-inset-bottom,0px))]
                   pb-[env(safe-area-inset-bottom,0px)]"
      >
        {left.map((item) => (
          <TabBarButton key={item.path} {...item} />
        ))}

        {centerSlot && <div className="w-[72px] shrink-0" />}

        {right.map((item) => (
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
        interactive flex-1 flex flex-col items-center justify-center gap-[3px]
        bg-transparent border-0 cursor-pointer font-[inherit]
        pt-2 pb-0 px-1 transition-colors duration-150
        [WebkitTapHighlightColor:transparent]
        ${isActive ? "text-amber" : "text-secondary"}
      `}
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span
        className={`text-[10px] leading-none tracking-[0.01em] ${isActive ? "font-semibold" : "font-normal"}`}
      >
        {label}
      </span>
    </button>
  );
}
