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
  StatCard,
  StatusChip,
  EmptyState,
} from "@/components/ui";
import { Flask } from "@phosphor-icons/react";
import { DEMO_BATCHES, STATUS_LABELS, STATUS_VARIANTS } from "@/data/demo";

export default function BatchesPage() {
  const { t } = useTranslation();
  const { isDemoMode } = useApp();
  const navigate = useNavigate();

  const active   = isDemoMode ? DEMO_BATCHES.filter((b) => b.status !== "packaged") : [];
  const archived = isDemoMode ? DEMO_BATCHES.filter((b) => b.status === "packaged")  : [];

  return (
    <PageLayout>
      <PageHeader title={t("batch.title")} />

      {isDemoMode ? (
        <>
          <SectionHeader title="Active" />
          <GroupedList>
            {active.map((batch) => (
              <ListRow
                key={batch.id}
                icon={<Flask size={20} weight="regular" />}
                label={batch.recipeName}
                secondaryLabel={`${batch.batchNumber} · ${batch.volumeL} L`}
                value={
                  <StatusChip
                    variant={STATUS_VARIANTS[batch.status]}
                    label={STATUS_LABELS[batch.status]}
                  />
                }
                showChevron
                onClick={() => navigate(`/batches/${batch.id}`)}
              />
            ))}
          </GroupedList>

          {archived.length > 0 && (
            <>
              <SectionHeader title="Packaged" />
              <GroupedList>
                {archived.map((batch) => (
                  <ListRow
                    key={batch.id}
                    icon={<Flask size={20} weight="regular" />}
                    label={batch.recipeName}
                    secondaryLabel={`${batch.batchNumber} · ${batch.volumeL} L`}
                    value={
                      <StatusChip
                        variant={STATUS_VARIANTS[batch.status]}
                        label={STATUS_LABELS[batch.status]}
                      />
                    }
                    showChevron
                    onClick={() => navigate(`/batches/${batch.id}`)}
                  />
                ))}
              </GroupedList>
            </>
          )}
        </>
      ) : (
        <Card padding="p-0" className="mt-2">
          <EmptyState
            icon={<Flask />}
            title={t("batch.comingSoon")}
            body="All your active and archived batches will appear here."
          />
        </Card>
      )}
    </PageLayout>
  );
}
