import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";

export function AppShell() {
  return (
    <>
      {/* Main scrollable content area */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehaviorY: "contain",
          paddingTop: "env(safe-area-inset-top, 0px)",
          // clearance for dock (64px) + FAB (58px) + safe-area + spacing
          paddingBottom: "calc(64px + 58px + env(safe-area-inset-bottom, 0px) + 22px)",
        }}
      >
        <Outlet />
      </main>

      <BottomNav />
    </>
  );
}
