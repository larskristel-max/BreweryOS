import { createContext, useContext, type RefObject } from "react";

const PageScrollContext = createContext<RefObject<HTMLDivElement | null>>({
  current: null,
});

export const PageScrollProvider = PageScrollContext.Provider;

export function usePageScrollRef(): RefObject<HTMLDivElement | null> {
  return useContext(PageScrollContext);
}
