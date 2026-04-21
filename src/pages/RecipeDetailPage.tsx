import { useParams } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useApp } from "@/context/AppContext";
import {
  PageLayout,
  PageHeader,
  SectionHeader,
  Card,
  StatCard,
  StatusChip,
  EmptyState,
} from "@/components/ui";
import { BookOpen } from "@phosphor-icons/react";
import { DEMO_RECIPES } from "@/data/demo";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { isDemoMode } = useApp();

  const demoRecipe = isDemoMode
    ? DEMO_RECIPES.find((r) => r.id === id) ?? null
    : null;

  if (isDemoMode && demoRecipe) {
    return (
      <PageLayout>
        <PageHeader title={demoRecipe.name} subtitle={demoRecipe.style} showBack />

        <div className="flex gap-2 mt-1 mb-1">
          <StatusChip variant="neutral" label={`${demoRecipe.volumeL} L`} />
          {demoRecipe.lastBrewedAt && (
            <StatusChip variant="info" label={`Last brewed ${demoRecipe.lastBrewedAt}`} />
          )}
        </div>

        <SectionHeader title="Target profile" />
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard value={demoRecipe.og.toFixed(3)} title="Original gravity" />
          <StatCard value={demoRecipe.fg.toFixed(3)} title="Final gravity" />
          <StatCard value={demoRecipe.abv.toFixed(1)} unit="%" title="ABV" />
          <StatCard value={demoRecipe.ibu} unit="IBU" title="Bitterness" />
          <StatCard value={demoRecipe.ebc} unit="EBC" title="Colour" />
          <StatCard value={demoRecipe.volumeL} unit="L" title="Batch size" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader title={t("recipe.titleDetail")} showBack />
      <Card padding="p-0" className="mt-2">
        <EmptyState
          icon={<BookOpen />}
          title={`Recipe ${id}`}
          body={t("recipe.detailComingSoon")}
        />
      </Card>
    </PageLayout>
  );
}
