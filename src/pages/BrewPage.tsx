import { useTranslation } from "@/hooks/useTranslation";
import { PageLayout, PageHeader, Card, GroupedList, ListRow, SectionHeader } from "@/components/ui";
import { BeerBottle, Flask, Drop, Package, ArrowRight } from "@phosphor-icons/react";

export default function BrewPage() {
  const { t } = useTranslation();
  return (
    <PageLayout>
      <PageHeader title={t("brew.title")} subtitle="Primary operating flow" />

      <section className="relative overflow-hidden rounded-[32px] border border-white/85 bg-[linear-gradient(160deg,#3D5270_0%,#25344A_62%,#1A2435_100%)] px-5 py-5 text-white shadow-[0_18px_46px_rgba(15,23,42,0.30)]">
        <div className="absolute -top-16 -right-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium text-white/78">On brasse runtime</p>
            <h2 className="mt-1.5 text-[32px] font-semibold leading-[0.98] tracking-[-0.03em]">Act → Suggest → Confirm</h2>
            <p className="mt-3 text-[14px] text-white/80 max-w-[33ch]">Capture real brew activity quickly with guided structure and no blocking steps.</p>
          </div>
          <span className="mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10">
            <BeerBottle size={20} weight="fill" className="text-white" />
          </span>
        </div>
      </section>

      <SectionHeader title="Suggested next actions" />
      <Card className="p-0 rounded-[26px] border-white/80">
        <GroupedList>
          <ListRow icon={<Flask size={18} weight="regular" />} label="Resume brew execution" secondaryLabel="Continue active batch guidance" showChevron />
          <ListRow icon={<Drop size={18} weight="regular" />} label="Log gravity / temperature" secondaryLabel="Quick capture with confirmation" showChevron />
          <ListRow icon={<Package size={18} weight="regular" />} label="Run packaging flow" secondaryLabel="Create child lots and movements" showChevron />
        </GroupedList>
      </Card>

      <div className="rounded-[20px] border border-white/80 bg-surface/78 px-4 py-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.08)]">
        <p className="text-[13px] text-secondary inline-flex items-center gap-1.5">
          {t("brew.comingSoon")} <ArrowRight size={12} weight="bold" />
        </p>
      </div>
    </PageLayout>
  );
}
