import { useTranslation } from "@/hooks/useTranslation";

export default function OperationsPage() {
  const { t } = useTranslation();
  return (
    <div style={{ padding: "20px 20px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "#111827", margin: 0 }}>
          {t("operations.title")}
        </h1>
      </header>
      <p style={{ fontSize: 14, color: "#6b7280" }}>{t("operations.comingSoon")}</p>
    </div>
  );
}
