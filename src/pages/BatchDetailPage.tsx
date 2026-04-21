import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useApp } from "@/context/AppContext";
import {
  PageLayout,
  PageHeader,
  SectionHeader,
  Card,
  StatCard,
  StatusChip,
  GroupedList,
  ListRow,
  EmptyState,
} from "@/components/ui";
import { Flask, Note, Calendar } from "@phosphor-icons/react";
import { DEMO_BATCHES, STATUS_LABELS, STATUS_VARIANTS } from "@/data/demo";

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { isDemoMode } = useApp();
  const navigate = useNavigate();

  const demoBatch = isDemoMode
    ? DEMO_BATCHES.find((b) => b.id === id) ?? null
    : null;

  if (isDemoMode && demoBatch) {
    return (
      <PageLayout>
        <PageHeader
          title={demoBatch.recipeName}
          subtitle={demoBatch.batchNumber}
          showBack
        />

        {/* Status chip row */}
        <div className="flex gap-2 mt-1 mb-1">
          <StatusChip
            variant={STATUS_VARIANTS[demoBatch.status]}
            label={STATUS_LABELS[demoBatch.status]}
          />
          <StatusChip variant="neutral" label={`${demoBatch.volumeL} L`} />
        </div>

        {/* Measurements */}
        <SectionHeader title="Measurements" />
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard
            value={demoBatch.og?.toFixed(3) ?? "—"}
            title="Original gravity"
            dimmed={!demoBatch.og}
          />
          <StatCard
            value={demoBatch.fg?.toFixed(3) ?? "—"}
            title="Final gravity"
            dimmed={!demoBatch.fg}
          />
          <StatCard
            value={demoBatch.abv ? `${demoBatch.abv.toFixed(1)}` : "—"}
            unit={demoBatch.abv ? "%" : undefined}
            title="ABV"
            dimmed={!demoBatch.abv}
          />
          <StatCard
            value={demoBatch.ibu ?? "—"}
            unit={demoBatch.ibu ? "IBU" : undefined}
            title="Bitterness"
            dimmed={!demoBatch.ibu}
          />
        </div>

        {/* Info */}
        <SectionHeader title="Info" />
        <GroupedList>
          <ListRow
            icon={<Calendar size={20} weight="regular" />}
            label="Brew date"
            value={demoBatch.startedAt}
          />
          {demoBatch.notes && (
            <ListRow
              icon={<Note size={20} weight="regular" />}
              label="Notes"
              secondaryLabel={demoBatch.notes}
            />
          )}
        </GroupedList>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader title={t("batch.titleDetail")} showBack />
      <Card padding="p-0" className="mt-2">
        <EmptyState
          icon={<Flask />}
          title={`Batch ${id}`}
          body={t("batch.detailComingSoon")}
        />
      </Card>
    </PageLayout>
  );
}
