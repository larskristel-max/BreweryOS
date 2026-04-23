import { useTranslation } from "@/hooks/useTranslation";
import { PageLayout, PageHeader, Card, GroupedList, ListRow, SectionHeader } from "@/components/ui";
import { BeerBottle, Flask, Drop, Package, ArrowRight } from "@phosphor-icons/react";

export default function BrewPage() {
  const { t } = useTranslation();
  return (
    <PageLayout>
      <PageHeader title={t("brew.title")} subtitle="Primary operating flow" />

      <section className="relative overflow-hidden rounded-[24px] border border-primary/10 bg-[linear-gradient(152deg,#273346_0%,#111827_72%)] px-5 py-5 text-white shadow-[0_16px_36px_rgba(15,23,42,0.3)]">
        <div className="absolute -top-14 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/65">Guided runtime</p>
            <h2 className="mt-1 text-[28px] font-semibold leading-[1.04] tracking-[-0.03em]">Act → Suggest → Confirm</h2>
            <p className="mt-2 text-[13px] text-white/80 max-w-[34ch]">Capture real brew activity quickly without blocking operations.</p>
          </div>
          <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
            <BeerBottle size={20} weight="duotone" className="text-white" />
          </span>
        </div>
      </section>

      <SectionHeader title="Suggested next actions" />
      <Card className="p-0 rounded-[22px] border border-primary/10">
        <GroupedList>
          <ListRow icon={<Flask size={20} weight="regular" />} label="Resume brew execution" secondaryLabel="Continue active batch guidance" showChevron />
          <ListRow icon={<Drop size={20} weight="regular" />} label="Log gravity / temperature" secondaryLabel="Quick capture with confirmation" showChevron />
          <ListRow icon={<Package size={20} weight="regular" />} label="Run packaging flow" secondaryLabel="Create child lots and movements" showChevron />
        </GroupedList>
      </Card>

      <div className="rounded-2xl border border-primary/10 bg-surface/85 px-4 py-3.5">
        <p className="text-footnote text-secondary inline-flex items-center gap-1.5">
          {t("brew.comingSoon")} <ArrowRight size={12} weight="bold" />
        </p>
      </div>
    </PageLayout>
  );
}
