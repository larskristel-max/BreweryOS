import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { usePermissions } from "@/context/AppContext";
import { escalationMessage } from "@/types/permissions";
import { TabBar } from "@/components/ui/TabBar";
import { FAB } from "@/components/ui/FAB";
import { House, BeerBottle, Flask, Gear } from "@phosphor-icons/react";

const ICON_SIZE = 21;

function navIcon(path: string) {
  switch (path) {
    case "/":
      return <House size={ICON_SIZE} weight="regular" />;
    case "/batches":
      return <Flask size={ICON_SIZE} weight="regular" />;
    case "/settings":
      return <Gear size={ICON_SIZE} weight="regular" />;
    default:
      return <House size={ICON_SIZE} weight="regular" />;
  }
}

const NAV_PATHS = [
  { path: "/", labelKey: "nav.operations" as const },
  { path: "/batches", labelKey: "nav.batches" as const },
  { path: "/settings", labelKey: "nav.settings" as const },
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const permissions = usePermissions();

  const tabItems = NAV_PATHS.map((item) => ({
    path: item.path,
    label: t(item.labelKey),
    icon: navIcon(item.path),
    isActive: item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path),
    onPress: () => navigate(item.path),
  }));

  return (
    <div className="app relative flex h-full w-full flex-col overflow-hidden bg-page">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,rgba(255,255,255,0.98),rgba(244,248,252,0.88)_52%,rgba(234,240,248,0.76)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-16 h-[320px] bg-[radial-gradient(74%_70%_at_50%_0%,rgba(61,79,104,0.10),transparent_78%)]"
      />

      <main className="relative flex-1 overflow-hidden">
        <Outlet />
      </main>

      <TabBar
        items={tabItems}
        centerSlot={
          <FAB
            icon={<BeerBottle size={19} weight="fill" />}
            label="On brasse"
            onClick={() => navigate("/brew")}
            disabled={!permissions.canResumeLetsBrew}
            disabledReason={escalationMessage("canResumeLetsBrew")}
            active={location.pathname === "/brew"}
          />
        }
      />
    </div>
  );
}
