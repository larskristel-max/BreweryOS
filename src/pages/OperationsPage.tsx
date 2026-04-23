import { useTranslation } from "@/hooks/useTranslation";
import { useApp } from "@/context/AppContext";
import { ROLE_LABELS } from "@/types/permissions";
import { PageLayout, PageHeader, Card, SectionHeader, GroupedList, ListRow, StatusChip } from "@/components/ui";
import { ArrowRight, CalendarBlank, ChartLineUp, Flask, Receipt, Checks, BookOpen } from "@phosphor-icons/react";
import { DEMO_BATCHES, STATUS_LABELS, STATUS_VARIANTS } from "@/data/demo";
import { useNavigate } from "react-router-dom";

const METRICS = [
  {
    key: "batches",
    label: "Active batches",
    description: "Current production lanes",
  },
  {
    key: "tasks",
    label: "Open tasks",
    description: "Items waiting continuation",
  },
  {
    key: "agenda",
    label: "Agenda",
    description: "Checkpoints scheduled today",
  },
  {
    key: "finance",
    label: "Finance",
    description: "Tax + margin snapshot",
  },
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

      <section className="relative overflow-hidden rounded-[24px] border border-primary/10 bg-[linear-gradient(152deg,#273346_0%,#111827_72%)] px-5 py-5 text-white shadow-[0_16px_36px_rgba(15,23,42,0.3)]">
        <div className="absolute -top-14 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <p className="text-[11px] uppercase tracking-[0.12em] text-white/65">Let&apos;s Brew core</p>
        <h2 className="mt-1 text-[30px] font-semibold leading-[1.02] tracking-[-0.03em]">Operate with confidence</h2>
        <p className="mt-2 max-w-[36ch] text-[13px] leading-relaxed text-white/78">
          Start real work in Let&apos;s Brew. Ops stays your calm mission overview.
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-2.5 py-1.5">
            <span className="text-[11px] text-white/75">Active</span>
            <span className="text-[13px] font-semibold tabular">{activeBatches.length}</span>
          </div>
          <button
            onClick={() => navigate("/brew")}
            className="interactive shrink-0 rounded-full bg-white text-primary px-4 py-2 text-[13px] font-semibold inline-flex items-center gap-1.5"
          >
            Open Let&apos;s Brew
            <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      </section>

      <section className="rounded-[22px] border border-primary/10 bg-surface/95 p-3.5 shadow-card">
        <div className="grid grid-cols-2 gap-2.5">
          {METRICS.map((metric) => {
            const value =
              metric.key === "batches"
                ? activeBatches.length
                : metric.key === "tasks"
                  ? isDemoMode ? 6 : 0
                  : metric.key === "agenda"
                    ? isDemoMode ? 3 : 0
                    : isDemoMode ? "€12k" : "—";

            return (
              <div key={metric.key} className="rounded-2xl border border-primary/8 bg-page/70 px-3.5 py-3">
                <p className="text-[10px] uppercase tracking-[0.08em] text-tertiary">{metric.label}</p>
                <p className="mt-1 text-[27px] leading-none font-semibold text-primary tabular">{value}</p>
                <p className="mt-1.5 text-[11px] leading-snug text-secondary">{metric.description}</p>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => navigate("/batches")}
          className="interactive mt-3 ml-1 text-footnote text-secondary inline-flex items-center gap-1"
        >
          See production details <ArrowRight size={12} weight="bold" />
        </button>
      </section>

      <SectionHeader title="Operational previews" />
      <Card className="p-0 rounded-[22px] border border-primary/10">
        <GroupedList>
          <ListRow
            icon={<Flask size={20} weight="regular" />}
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
            icon={<Checks size={20} weight="regular" />}
            label="Task queue"
            secondaryLabel="Continue unresolved cellar and packaging tasks"
            showChevron
            onClick={() => navigate("/brew")}
          />
          <ListRow
            icon={<CalendarBlank size={20} weight="regular" />}
            label="Agenda"
            secondaryLabel="Upcoming deadlines and brewing windows"
            showChevron
            onClick={() => navigate("/brew")}
          />
          <ListRow
            icon={<Receipt size={20} weight="regular" />}
            label="Financials"
            secondaryLabel="Tax, declarations, and cost performance"
            showChevron
            onClick={() => navigate("/settings")}
          />
          <ListRow
            icon={<BookOpen size={20} weight="regular" />}
            label="Recipes"
            secondaryLabel="Browse and tune formulation baselines"
            showChevron
            onClick={() => navigate("/recipes")}
          />
        </GroupedList>
      </Card>

      <p className="px-1 text-footnote text-secondary leading-relaxed inline-flex items-start gap-2">
        <ChartLineUp size={16} weight="regular" className="mt-0.5 shrink-0" />
        Ops remains read-first. Execute through Let&apos;s Brew to keep guided flow and traceability intact.
      </p>
    </PageLayout>
  );
}
