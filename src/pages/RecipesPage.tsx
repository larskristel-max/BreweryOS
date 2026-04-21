import { useTranslation } from "@/hooks/useTranslation";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import {
  PageLayout,
  PageHeader,
  SectionHeader,
  Card,
  GroupedList,
  ListRow,
  StatusChip,
  EmptyState,
} from "@/components/ui";
import { BookOpen } from "@phosphor-icons/react";
import { DEMO_RECIPES } from "@/data/demo";

export default function RecipesPage() {
  const { t } = useTranslation();
  const { isDemoMode } = useApp();
  const navigate = useNavigate();

  return (
    <PageLayout>
      <PageHeader title={t("recipe.title")} />

      {isDemoMode ? (
        <>
          <SectionHeader title={`${DEMO_RECIPES.length} recipes`} />
          <GroupedList>
            {DEMO_RECIPES.map((recipe) => (
              <ListRow
                key={recipe.id}
                icon={<BookOpen size={20} weight="regular" />}
                label={recipe.name}
                secondaryLabel={recipe.style}
                value={
                  <StatusChip
                    variant="neutral"
                    label={`${recipe.abv.toFixed(1)}% ABV`}
                  />
                }
                showChevron
                onClick={() => navigate(`/recipes/${recipe.id}`)}
              />
            ))}
          </GroupedList>
        </>
      ) : (
        <Card padding="p-0" className="mt-2">
          <EmptyState
            icon={<BookOpen />}
            title={t("recipe.comingSoon")}
            body="Your recipe library will appear here."
          />
        </Card>
      )}
    </PageLayout>
  );
}
