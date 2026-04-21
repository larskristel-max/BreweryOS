import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { usePermissions } from "@/context/AppContext";
import { escalationMessage } from "@/types/permissions";

interface NavItem {
  path: string;
  labelKey: "nav.operations" | "nav.batches" | "nav.recipes" | "nav.settings";
  icon: React.ReactNode;
}

function OpsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  );
}

function BatchesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3H5a2 2 0 0 0-2 2v4"/>
      <path d="M9 3h6"/>
      <path d="M15 3h4a2 2 0 0 1 2 2v4"/>
      <path d="M3 9v6a2 2 0 0 0 2 2h4"/>
      <path d="M21 9v6a2 2 0 0 1-2 2h-4"/>
      <path d="M9 21h6"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function RecipesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <line x1="9" y1="7" x2="15" y2="7"/>
      <line x1="9" y1="11" x2="15" y2="11"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { path: "/", labelKey: "nav.operations", icon: <OpsIcon /> },
  { path: "/batches", labelKey: "nav.batches", icon: <BatchesIcon /> },
  { path: "/recipes", labelKey: "nav.recipes", icon: <RecipesIcon /> },
  { path: "/settings", labelKey: "nav.settings", icon: <SettingsIcon /> },
];

function BrewFab({
  label,
  onPress,
  disabled = false,
  disabledReason,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const lines = label.split(" ");
  const displayText = lines.length >= 2 ? `${lines[0]}\n${lines.slice(1).join(" ")}` : label;
  return (
    <button
      onClick={disabled ? undefined : onPress}
      aria-label={disabled ? (disabledReason ?? label) : label}
      title={disabled ? disabledReason : undefined}
      disabled={disabled}
      style={{
        position: "fixed",
        left: "50%",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 36px)",
        width: 58,
        height: 58,
        transform: "translateX(-50%)",
        borderRadius: 999,
        border: "1px solid rgba(15,23,42,0.24)",
        background: disabled
          ? "linear-gradient(180deg, #9ca3af 0%, #6b7280 100%)"
          : "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
        color: "#fff",
        boxShadow: disabled
          ? "none"
          : "0 10px 22px rgba(15,23,42,0.24), 0 2px 6px rgba(15,23,42,0.16)",
        zIndex: 1000,
        fontSize: 11,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "center",
        lineHeight: 1.04,
        letterSpacing: "-0.01em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "pre-line",
        fontFamily: "inherit",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {displayText}
    </button>
  );
}

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const permissions = usePermissions();

  const leftItems = NAV_ITEMS.slice(0, 2);
  const rightItems = NAV_ITEMS.slice(2);

  return (
    <>
      {/* Glass dock background */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "calc(16px + env(safe-area-inset-left, 0px))",
          right: "calc(16px + env(safe-area-inset-right, 0px))",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 6px)",
          height: 64,
          borderRadius: 26,
          border: "1px solid rgba(17,24,39,0.08)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)",
          boxShadow: "0 10px 26px rgba(15,23,42,0.1), 0 2px 8px rgba(15,23,42,0.06)",
          backdropFilter: "blur(16px) saturate(140%)",
          WebkitBackdropFilter: "blur(16px) saturate(140%)",
          zIndex: 940,
        }}
      />

      {/* Nav items */}
      <nav
        style={{
          position: "fixed",
          left: "calc(16px + env(safe-area-inset-left, 0px))",
          right: "calc(16px + env(safe-area-inset-right, 0px))",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 6px)",
          height: 64,
          zIndex: 950,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
        }}
      >
        {/* Left two items */}
        {leftItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavButton
              key={item.path}
              label={t(item.labelKey)}
              icon={item.icon}
              isActive={isActive}
              onPress={() => navigate(item.path)}
            />
          );
        })}

        {/* Center FAB spacer */}
        <div style={{ width: 70, flexShrink: 0 }} />

        {/* Right two items */}
        {rightItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavButton
              key={item.path}
              label={t(item.labelKey)}
              icon={item.icon}
              isActive={isActive}
              onPress={() => navigate(item.path)}
            />
          );
        })}
      </nav>

      {/* Center FAB — disabled for roles without canResumeLetsBrew */}
      <BrewFab
        label={t("nav.brew")}
        onPress={() => navigate("/brew")}
        disabled={!permissions.canResumeLetsBrew}
        disabledReason={escalationMessage("canResumeLetsBrew")}
      />
    </>
  );
}

function NavButton({
  label,
  icon,
  isActive,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <button
      onClick={onPress}
      aria-current={isActive ? "page" : undefined}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        background: "none",
        border: "none",
        cursor: "pointer",
        color: isActive ? "#111827" : "#9ca3af",
        fontFamily: "inherit",
        padding: "8px 4px",
        minHeight: 64,
        transition: "color 0.15s ease",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </span>
      <span
        style={{
          fontSize: 10,
          fontWeight: isActive ? 600 : 400,
          lineHeight: 1,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </span>
    </button>
  );
}
