import { ReactNode, useRef } from "react";
import { PageScrollProvider } from "./PageScrollContext";

interface PageLayoutProps {
  children: ReactNode;
}

/**
 * Full-page scroll container. Provides:
 * - #F2F2F7 page background (bg-page token)
 * - Safe-area top/bottom padding via Tailwind arbitrary values
 * - Overflow-y scroll with overscroll containment
 * - Page-enter animation
 * - PageScrollContext for PageHeader compact behavior
 *
 * Must be used as the root element of every page inside AppShell.
 */
export function PageLayout({ children }: PageLayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <PageScrollProvider value={scrollRef}>
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-page page-enter"
      >
        <div
          className="flex flex-col px-4 pt-[env(safe-area-inset-top,0px)] pb-[calc(64px+env(safe-area-inset-bottom,0px)+24px)]"
        >
          {children}
        </div>
      </div>
    </PageScrollProvider>
  );
}
