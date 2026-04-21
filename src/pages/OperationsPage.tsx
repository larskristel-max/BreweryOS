import { useTranslation } from "@/hooks/useTranslation";
import { useApp } from "@/context/AppContext";
import { CanDo, RequiresRole } from "@/components/PermissionGuard";
import { ROLE_LABELS } from "@/types/permissions";
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
import { ChartBar, Plus, CurrencyDollar, Flask } from "@phosphor-icons/react";
import { DEMO_BATCHES, STATUS_LABELS, STATUS_VARIANTS } from "@/data/demo";
import { useNavigate } from "react-router-dom";

export default function OperationsPage() {
  const { t } = useTranslation();
  const { breweryContext, role, isDemoMode } = useApp();
  const navigate = useNavigate();

  const activeBatches = isDemoMode
    ? DEMO_BATCHES.filter((b) => b.status !== "packaged")
    : [];

  return (
    <PageLayout>
      <PageHeader
        title={t("operations.title")}
        subtitle={
          breweryContext
            ? `${breweryContext.name} · ${ROLE_LABELS[role]}`
            : undefined
        }
      />

      {isDemoMode ? (
        <>
          {/* Stats row */}
          <SectionHeader title="This week" />
          <div className="grid grid-cols-3 gap-2.5">
            <StatCard value={DEMO_BATCHES.length} title="Total batches" />
            <StatCard value={activeBatches.length} title="Active" />
            <StatCard value={1} title="Packaged" />
          </div>

          {/* Active batches */}
          <SectionHeader title="Active batches" />
          <GroupedList>
            {activeBatches.map((batch) => (
              <ListRow
                key={batch.id}
                icon={<Flask size={20} weight="regular" />}
                label={batch.recipeName}
                secondaryLabel={batch.batchNumber}
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

          {/* Quick actions */}
          <SectionHeader title="Quick actions" />
          <GroupedList>
            <ListRow
              icon={<Plus size={20} weight="bold" />}
              label="New Batch"
              secondaryLabel="Demo mode — changes won't be saved"
              showChevron
              onClick={() => {}}
            />
            <ListRow
              icon={<CurrencyDollar size={20} weight="regular" />}
              label="Finance & Declarations"
              secondaryLabel="Demo mode — read only"
              showChevron
              onClick={() => {}}
            />
          </GroupedList>
        </>
      ) : (
        <>
          <SectionHeader title="Quick actions" />
          <GroupedList>
            <CanDo action="canCreateBatch">
              <ListRow
                icon={<Plus size={20} weight="bold" />}
                label="New Batch"
                showChevron
                onClick={() => {}}
              />
            </CanDo>
            <RequiresRole action="canAccessFinance" explanation="Finance access requires Owner or Finance role">
              <ListRow
                icon={<CurrencyDollar size={20} weight="regular" />}
                label="Finance & Declarations"
                showChevron
                onClick={() => {}}
              />
            </RequiresRole>
          </GroupedList>

          <SectionHeader title="Overview" />
          <Card padding="p-0">
            <EmptyState
              icon={<ChartBar />}
              title={t("operations.comingSoon")}
              body="Your brewery dashboard will appear here."
            />
          </Card>
        </>
      )}
    </PageLayout>
  );
}
