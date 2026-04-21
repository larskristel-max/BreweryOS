import { useTranslation } from "@/hooks/useTranslation";
import { PageLayout, PageHeader, Card, EmptyState } from "@/components/ui";
import { Plus } from "@phosphor-icons/react";

export default function RecipeNewPage() {
  const { t } = useTranslation();
  return (
    <PageLayout>
      <PageHeader title={t("recipe.titleNew")} showBack />
      <Card className="mt-2">
        <EmptyState
          icon={<Plus />}
          title={t("recipe.newComingSoon")}
          body="Recipe builder coming soon."
        />
      </Card>
    </PageLayout>
  );
}
