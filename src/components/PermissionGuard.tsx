// Role-aware UI utilities for permission-gated rendering
// Provides <CanDo>, <RequiresRole>, and escalationMessage helper

import type { ReactNode } from "react";
import { usePermissions } from "@/context/AppContext";
import type { PermissionKey } from "@/types/permissions";
import { escalationMessage } from "@/types/permissions";

export { escalationMessage };

interface CanDoProps {
  action: PermissionKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export function CanDo({ action, children, fallback = null }: CanDoProps) {
  const permissions = usePermissions();
  if (permissions[action]) return <>{children}</>;
  return <>{fallback}</>;
}

interface RequiresRoleProps {
  action: PermissionKey;
  children: ReactNode;
  explanation?: string;
}

export function RequiresRole({ action, children, explanation }: RequiresRoleProps) {
  const permissions = usePermissions();

  if (permissions[action]) return <>{children}</>;

  const message = explanation ?? escalationMessage(action);

  return (
    <div
      title={message}
      style={{
        opacity: 0.4,
        cursor: "not-allowed",
        pointerEvents: "none",
        userSelect: "none",
        position: "relative",
      }}
      aria-disabled="true"
      aria-label={message}
    >
      {children}
      <div
        style={{
          position: "absolute",
          bottom: "calc(100% + 6px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#111827",
          color: "#fff",
          fontSize: 12,
          padding: "6px 10px",
          borderRadius: 8,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          zIndex: 100,
          display: "none",
        }}
        className="permission-tooltip"
      >
        {message}
      </div>
    </div>
  );
}
