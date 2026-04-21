import { useParams } from "react-router-dom";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div style={{ padding: "20px 20px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
      <header>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "#111827", margin: 0 }}>
          Recipe
        </h1>
      </header>
      <p style={{ fontSize: 14, color: "#6b7280" }}>Recipe {id} — detail view coming soon.</p>
    </div>
  );
}
