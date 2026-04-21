import { supabase } from "@/lib/supabase";
import { useApp } from "@/context/AppContext";
import { ROLE_LABELS } from "@/types/permissions";
import { CanDo } from "@/components/PermissionGuard";
import { useNavigate } from "react-router-dom";
import {
  PageLayout,
  PageHeader,
  SectionHeader,
  GroupedList,
  ListRow,
  Card,
} from "@/components/ui";
import { Buildings, Users, SignOut, Globe, Clock, Receipt, Notebook } from "@phosphor-icons/react";

export default function SettingsPage() {
  const { breweryContext, role, isDemoMode, exitDemoMode } = useApp();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/signin";
  }

  function handleExitDemo() {
    exitDemoMode();
    navigate("/signin");
  }

  return (
    <PageLayout>
      <PageHeader
        title="Settings"
        subtitle={breweryContext ? `${breweryContext.name} · ${ROLE_LABELS[role]}` : undefined}
      />

      {isDemoMode && (
        <>
          <SectionHeader title="Demo mode" />
          <Card padding="p-4">
            <p className="text-[15px] text-secondary m-0 mb-3 leading-relaxed">
              You're exploring Operon with demo data from{" "}
              <strong className="text-primary font-semibold">Hopsburg Brewing Co.</strong>{" "}
              — nothing is saved.
            </p>
            <button
              onClick={handleExitDemo}
              className="w-full py-3 rounded-button border-0 bg-amber-tint text-amber
                         text-[16px] font-semibold cursor-pointer font-[inherit]"
            >
              Exit demo & sign in
            </button>
          </Card>
        </>
      )}

      {breweryContext && (
        <>
          <SectionHeader title="Brewery" />
          <GroupedList>
            <ListRow
              icon={<Globe size={20} weight="regular" />}
              label="Country"
              value={breweryContext.country}
            />
            <ListRow
              icon={<Globe size={20} weight="regular" />}
              label="Language"
              value={breweryContext.language}
            />
            <ListRow
              icon={<Clock size={20} weight="regular" />}
              label="Timezone"
              value={breweryContext.timezone}
            />
            <ListRow
              icon={<Receipt size={20} weight="regular" />}
              label="Excise duty"
              value={breweryContext.exciseEnabled ? "Enabled" : "Disabled"}
            />
            {breweryContext.notionSourceId && (
              <ListRow
                icon={<Notebook size={20} weight="regular" />}
                label="Notion source"
                value={breweryContext.notionSourceId}
              />
            )}
          </GroupedList>
        </>
      )}

      {!isDemoMode && (
        <>
          <CanDo action="canManageSettings">
            <SectionHeader title="Administration" />
            <GroupedList>
              <ListRow
                icon={<Buildings size={20} weight="regular" />}
                label="Brewery settings"
                showChevron
                onClick={() => {}}
              />
              <CanDo action="canManageUsers">
                <ListRow
                  icon={<Users size={20} weight="regular" />}
                  label="Manage team members"
                  showChevron
                  onClick={() => {}}
                />
              </CanDo>
            </GroupedList>
          </CanDo>

          <SectionHeader title="Account" />
          <GroupedList>
            <ListRow
              icon={<SignOut size={20} weight="regular" />}
              label="Sign out"
              onClick={handleSignOut}
              destructive
            />
          </GroupedList>
        </>
      )}
    </PageLayout>
  );
}
