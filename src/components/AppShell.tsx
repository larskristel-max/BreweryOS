import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { usePermissions } from "@/context/AppContext";
import { escalationMessage } from "@/types/permissions";
import { TabBar } from "@/components/ui/TabBar";
import { FAB } from "@/components/ui/FAB";
import { House, BeerBottle, Flask, Gear } from "@phosphor-icons/react";

const ICON_SIZE = 22;

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
    <>
      <main className="flex-1 relative overflow-hidden">
        <Outlet />
      </main>

      <TabBar
        items={tabItems}
        centerSlot={
          <FAB
            icon={<BeerBottle size={22} weight="bold" />}
            label={t("nav.brew")}
            onClick={() => navigate("/brew")}
            disabled={!permissions.canResumeLetsBrew}
            disabledReason={escalationMessage("canResumeLetsBrew")}
            active={location.pathname === "/brew"}
          />
        }
      />
    </>
  );
}
