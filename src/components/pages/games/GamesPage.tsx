import React, { useMemo } from "react";
import { Gamepad2 } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import PersonalGameLibrary from "./PersonalGameLibrary";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { TabPanel } from "../../shared";

// Static page meta options (stable reference)
const pageMetaOptions = {
  title: "Games",
  description: "Your complete game library",
  noIndex: true,
};

type TabId = "library";

/**
 * Games Page
 *
 * Uses unified AppLayout for consistent spacing and footer
 */
const GamesPage: React.FC = () => {
  usePageMeta(pageMetaOptions);

  // Media intentionally uses a single "Library" tab.
  // "Add" is an action (opens the search/add modal), not a mode,
  // to avoid state-based navigation.
  const activeTab: TabId = "library";

  const tabs = useMemo(
    () => [{ id: "library" as TabId, label: "Library", icon: Gamepad2 }],
    []
  );

  return (
    <AppLayout
      title="Games"
      description="Your complete game library"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={() => {
        // Single-tab layout: no-op by design.
      }}
    >
      <TabPanel id="library-panel" tabId="library-tab">
        <PersonalGameLibrary initialFilter="all" />
      </TabPanel>
    </AppLayout>
  );
};

export default GamesPage;
