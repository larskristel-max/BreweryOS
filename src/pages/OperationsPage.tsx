import { useTranslation } from "@/hooks/useTranslation";
import { useApp } from "@/context/AppContext";
import { CanDo, RequiresRole } from "@/components/PermissionGuard";
import { ROLE_LABELS } from "@/types/permissions";

export default function OperationsPage() {
  const { t } = useTranslation();
  const { breweryContext, role } = useApp();

  return (
    <div style={{ padding: "20px 20px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "#111827", margin: "0 0 2px" }}>
            {t("operations.title")}
          </h1>
          {breweryContext && (
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
              {breweryContext.name}
              <span style={{ marginLeft: 8, color: "#d1d5db" }}>·</span>
              <span style={{ marginLeft: 8, color: "#9ca3af" }}>{ROLE_LABELS[role]}</span>
            </p>
          )}
        </div>
      </header>

      <p style={{ fontSize: 14, color: "#6b7280" }}>{t("operations.comingSoon")}</p>

      {/* Permission-gated action examples */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <CanDo action="canCreateBatch">
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 14,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              fontSize: 14,
              color: "#111827",
              fontWeight: 500,
            }}
          >
            + New Batch
          </div>
        </CanDo>

        <RequiresRole action="canAccessFinance" explanation="Finance access requires Owner or Finance role">
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 14,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              fontSize: 14,
              color: "#111827",
              fontWeight: 500,
            }}
          >
            Finance & Declarations
          </div>
        </RequiresRole>
      </div>
    </div>
  );
}
