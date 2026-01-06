import React, { useMemo } from "react";
import { Music } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import PersonalMusicLibrary from "./PersonalMusicLibrary";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { TabPanel } from "../../shared";

// Static page meta options (stable reference)
const pageMetaOptions = {
  title: "Music",
  description: "Your complete music library",
  noIndex: true,
};

type TabId = "library";

/**
 * Music Page
 *
 * Uses unified AppLayout for consistent spacing and footer
 */
const MusicPage: React.FC = () => {
  usePageMeta(pageMetaOptions);

  // Media intentionally uses a single "Library" tab.
  // "Add" is an action (opens the search/add modal), not a mode,
  // to avoid state-based navigation.
  const activeTab: TabId = "library";

  const tabs = useMemo(
    () => [{ id: "library" as TabId, label: "Library", icon: Music }],
    []
  );

  return (
    <AppLayout
      title="Music"
      description="Your complete music library"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={() => {
        // Single-tab layout: no-op by design.
      }}
    >
      <TabPanel id="library-panel" tabId="library-tab">
        <PersonalMusicLibrary initialFilter="all" />
      </TabPanel>
    </AppLayout>
  );
};

export default MusicPage;
