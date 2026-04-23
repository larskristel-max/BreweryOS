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
        className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-transparent page-enter"
      >
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-7 px-5 pt-[calc(env(safe-area-inset-top,0px)+18px)] pb-[calc(168px+env(safe-area-inset-bottom,0px))]">
          {children}
        </div>
      </div>
    </PageScrollProvider>
  );
}
