import { ReactNode, useRef } from "react";
import { PageScrollProvider } from "./PageScrollContext";

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <PageScrollProvider value={scrollRef}>
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-page page-enter"
      >
        <div className="flex flex-col px-4 pt-[env(safe-area-inset-top,0px)] pb-[calc(136px+env(safe-area-inset-bottom,0px))]">
          {children}
        </div>
      </div>
    </PageScrollProvider>
  );
}
