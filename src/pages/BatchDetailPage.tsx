import { useParams } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  return (
    <div style={{ padding: "20px 20px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
      <header>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "#111827", margin: 0 }}>
          {t("batch.titleDetail")}
        </h1>
      </header>
      <p style={{ fontSize: 14, color: "#6b7280" }}>
        {id} — {t("batch.detailComingSoon")}
      </p>
    </div>
  );
}
