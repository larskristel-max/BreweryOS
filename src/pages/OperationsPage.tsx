import { useTranslation } from "@/hooks/useTranslation";
import { useApp } from "@/context/AppContext";
import { ROLE_LABELS } from "@/types/permissions";
import { PageLayout, PageHeader, Card, SectionHeader, GroupedList, ListRow, StatusChip } from "@/components/ui";
import { ArrowRight, CalendarBlank, ChartLineUp, Flask, Receipt, Checks, BookOpen } from "@phosphor-icons/react";
import { DEMO_BATCHES, STATUS_LABELS, STATUS_VARIANTS } from "@/data/demo";
import { useNavigate } from "react-router-dom";

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

      <Card className="mt-3 bg-[linear-gradient(145deg,#1f2937,#111827)] text-white shadow-[0_14px_30px_rgba(15,23,42,0.36)]">
        <p className="text-[11px] uppercase tracking-[0.1em] text-white/70">System Core</p>
        <div className="mt-1.5 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[26px] leading-[1.08] font-semibold tracking-[-0.02em]">Let&apos;s Brew</h2>
            <p className="text-[13px] text-white/75 mt-1">Start, continue, or log operational work through the guided flow.</p>
          </div>
          <button
            onClick={() => navigate("/brew")}
            className="interactive shrink-0 rounded-pill bg-white text-black px-3.5 py-2 text-[13px] font-semibold inline-flex items-center gap-1.5"
          >
            Open
            <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      </Card>

      <SectionHeader title="Mission control" />
      <div className="grid grid-cols-2 gap-2.5">
        <Card className="p-3.5">
          <p className="text-caption text-secondary uppercase tracking-[0.06em]">Active batches</p>
          <p className="text-[28px] leading-none mt-1 font-semibold tabular">{activeBatches.length}</p>
          <button
            onClick={() => navigate("/batches")}
            className="interactive mt-3 text-footnote text-amber inline-flex items-center gap-1"
          >
            See more <ArrowRight size={12} weight="bold" />
          </button>
        </Card>
        <Card className="p-3.5">
          <p className="text-caption text-secondary uppercase tracking-[0.06em]">Open tasks</p>
          <p className="text-[28px] leading-none mt-1 font-semibold tabular">{isDemoMode ? 6 : 0}</p>
          <span className="mt-3 text-footnote text-secondary">Tracked in workflow queue</span>
        </Card>
        <Card className="p-3.5">
          <p className="text-caption text-secondary uppercase tracking-[0.06em]">Agenda</p>
          <p className="text-[28px] leading-none mt-1 font-semibold tabular">{isDemoMode ? 3 : 0}</p>
          <span className="mt-3 text-footnote text-secondary">Priority checkpoints today</span>
        </Card>
        <Card className="p-3.5">
          <p className="text-caption text-secondary uppercase tracking-[0.06em]">Finance</p>
          <p className="text-[28px] leading-none mt-1 font-semibold tabular">{isDemoMode ? "€12k" : "—"}</p>
          <span className="mt-3 text-footnote text-secondary">Declarations + margin watch</span>
        </Card>
      </div>

      <SectionHeader title="Operational previews" />
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

      <Card className="mt-4 p-3.5 bg-surface/70 border border-hairline shadow-none">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-secondary">
            <ChartLineUp size={18} weight="regular" />
          </span>
          <p className="text-footnote text-secondary leading-relaxed">
            Ops is now a read-first mission view. Execute work through Let&apos;s Brew to keep flow guidance and traceability intact.
          </p>
        </div>
      </Card>
    </PageLayout>
  );
}
