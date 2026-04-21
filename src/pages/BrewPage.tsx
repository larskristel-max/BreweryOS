import { useTranslation } from "@/hooks/useTranslation";
import { PageLayout, PageHeader, Card, EmptyState } from "@/components/ui";
import { BeerBottle } from "@phosphor-icons/react";

export default function BrewPage() {
  const { t } = useTranslation();
  return (
    <PageLayout>
      <PageHeader title={t("brew.title")} />
      <Card className="mt-2">
        <EmptyState
          icon={<BeerBottle />}
          title={t("brew.comingSoon")}
          body="Let's Brew will guide you through each step of your brew day."
        />
      </Card>
    </PageLayout>
  );
}
