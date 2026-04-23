import { useTranslation } from "@/hooks/useTranslation";
import { PageLayout, PageHeader, Card, GroupedList, ListRow } from "@/components/ui";
import { BeerBottle, Flask, Drop, Package, ArrowRight } from "@phosphor-icons/react";

export default function BrewPage() {
  const { t } = useTranslation();
  return (
    <PageLayout>
      <PageHeader title={t("brew.title")} subtitle="Primary operating flow" />

      <Card className="mt-3 bg-[linear-gradient(145deg,#B45309,#92400E)] text-white shadow-[0_14px_30px_rgba(146,64,14,0.35)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.1em] text-white/75">Guided runtime</p>
            <h2 className="text-[24px] leading-[1.1] font-semibold mt-1">Act → Suggest → Confirm</h2>
            <p className="text-[13px] text-white/80 mt-2">Capture real brew activity without blocking operations.</p>
          </div>
          <BeerBottle size={30} weight="duotone" className="shrink-0 text-white" />
        </div>
      </Card>

      <Card className="mt-3 p-0">
        <GroupedList>
          <ListRow icon={<Flask size={20} weight="regular" />} label="Resume brew execution" secondaryLabel="Continue active batch guidance" showChevron />
          <ListRow icon={<Drop size={20} weight="regular" />} label="Log gravity / temperature" secondaryLabel="Quick capture with confirmation" showChevron />
          <ListRow icon={<Package size={20} weight="regular" />} label="Run packaging flow" secondaryLabel="Create child lots and movements" showChevron />
        </GroupedList>
      </Card>

      <p className="mt-4 px-1 text-footnote text-secondary inline-flex items-center gap-1.5">
        {t("brew.comingSoon")} <ArrowRight size={12} weight="bold" />
      </p>
    </PageLayout>
  );
}
