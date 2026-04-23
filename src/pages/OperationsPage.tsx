import { useTranslation } from "@/hooks/useTranslation";
import { useApp } from "@/context/AppContext";
import { ROLE_LABELS } from "@/types/permissions";
import { PageLayout, PageHeader, Card, SectionHeader, GroupedList, ListRow, StatusChip } from "@/components/ui";
import { ArrowRight, CalendarBlank, ChartLineUp, Flask, Receipt, Checks, BookOpen } from "@phosphor-icons/react";
import { DEMO_BATCHES, STATUS_LABELS, STATUS_VARIANTS } from "@/data/demo";
import { useNavigate } from "react-router-dom";

const METRICS = [
  { key: "batches", label: "Active batches", description: "Production lanes in motion" },
  { key: "tasks", label: "Open tasks", description: "Continuations waiting" },
  { key: "agenda", label: "Agenda today", description: "Upcoming checkpoints" },
] as const;

export default function OperationsPage() {
  const { t } = useTranslation();
  const { breweryContext, role, isDemoMode } = useApp();
  const navigate = useNavigate();

  const activeBatches = (isDemoMode ? DEMO_BATCHES : []).filter((b) => b.status !== "packaged");

  return (
    <PageLayout>
      <PageHeader
        title={t("operations.title")}
        subtitle={breweryContext ? `${breweryContext.name} · ${ROLE_LABELS[role]}` : undefined}
      />

      <section className="relative overflow-hidden rounded-[32px] border border-white/85 bg-[linear-gradient(160deg,#334661_0%,#1A2538_58%,#131C2C_100%)] px-5 py-5 text-white shadow-[0_18px_46px_rgba(15,23,42,0.30)]">
        <div className="absolute -top-16 -right-14 h-48 w-48 rounded-full bg-white/12 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-20 left-0 h-40 w-40 rounded-full bg-sky-200/10 blur-3xl" aria-hidden="true" />

        <p className="text-[12px] font-medium tracking-[0.01em] text-white/78">Mission control</p>
        <h2 className="mt-1.5 text-[34px] font-semibold leading-[0.98] tracking-[-0.03em]">Everything calm. Everything visible.</h2>
        <p className="mt-3 max-w-[36ch] text-[14px] leading-relaxed text-white/80">
          Ops stays overview-first. Start any live work through On brasse to keep guidance and traceability intact.
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/14 pt-3.5">
          <div>
            <p className="text-[12px] text-white/72">Current production</p>
            <p className="text-[20px] font-semibold tracking-[-0.02em] tabular">{activeBatches.length} active lanes</p>
          </div>
          <button
            onClick={() => navigate("/brew")}
            className="interactive shrink-0 rounded-full bg-white/94 px-4 py-2 text-[13px] font-semibold text-primary inline-flex items-center gap-1.5"
          >
            Enter On brasse
            <ArrowRight size={13} weight="bold" />
          </button>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2.5">
        {METRICS.map((metric) => {
          const value =
            metric.key === "batches"
              ? activeBatches.length
              : metric.key === "tasks"
                ? isDemoMode ? 6 : 0
                : isDemoMode ? 3 : 0;

          return (
            <div key={metric.key} className="rounded-[20px] border border-white/80 bg-surface/80 px-3 py-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.08)]">
              <p className="text-[12px] text-secondary leading-tight">{metric.label}</p>
              <p className="mt-1.5 text-[28px] font-semibold leading-none tracking-[-0.03em] text-primary tabular">{value}</p>
              <p className="mt-2 text-[11px] text-tertiary leading-[1.25]">{metric.description}</p>
            </div>
          );
        })}
      </section>

      <SectionHeader title="Preview" />
      <Card className="p-0 rounded-[26px] border-white/80">
        <GroupedList>
          <ListRow
            icon={<Flask size={18} weight="regular" />}
            label="Batch states"
            secondaryLabel={activeBatches[0] ? `${activeBatches[0].recipeName} in progress` : "No active production"}
            value={
              activeBatches[0] ? (
                <StatusChip variant={STATUS_VARIANTS[activeBatches[0].status]} label={STATUS_LABELS[activeBatches[0].status]} />
              ) : undefined
            }
            showChevron
            onClick={() => navigate("/batches")}
          />
          <ListRow
            icon={<Checks size={18} weight="regular" />}
            label="Task queue"
            secondaryLabel="Continue unresolved cellar and packaging work"
            showChevron
            onClick={() => navigate("/brew")}
          />
          <ListRow
            icon={<CalendarBlank size={18} weight="regular" />}
            label="Agenda"
            secondaryLabel="Upcoming windows and operational checkpoints"
            showChevron
            onClick={() => navigate("/brew")}
          />
          <ListRow
            icon={<Receipt size={18} weight="regular" />}
            label="Financials"
            secondaryLabel="Tax, declarations, margin snapshots"
            showChevron
            onClick={() => navigate("/settings")}
          />
          <ListRow
            icon={<BookOpen size={18} weight="regular" />}
            label="Recipes"
            secondaryLabel="Browse and tune formulation baselines"
            showChevron
            onClick={() => navigate("/recipes")}
          />
        </GroupedList>
      </Card>

      <p className="px-1 text-[13px] text-secondary leading-relaxed inline-flex items-start gap-2.5">
        <ChartLineUp size={16} weight="regular" className="mt-0.5 shrink-0 text-tertiary" />
        Ops remains overview-only. Execute actions in On brasse for guided continuity.
      </p>
    </PageLayout>
  );
}
