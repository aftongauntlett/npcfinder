import React, { useMemo } from "react";
import { Film } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import PersonalWatchList from "../../media/PersonalWatchList";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { TabPanel } from "../../shared";

// Static page meta options (stable reference)
const pageMetaOptions = {
  title: "Movies & TV",
  description: "Your complete movie and TV library",
  noIndex: true,
};

type TabId = "library";

/**
 * Movies & TV Page
 *
 * Uses unified AppLayout for consistent spacing and footer
 */
const MoviesPage: React.FC = () => {
  usePageMeta(pageMetaOptions);

  // Media intentionally uses a single "Library" tab.
  // "Add" is an action (opens the search/add modal), not a mode,
  // to avoid state-based navigation.
  const activeTab: TabId = "library";

  const tabs = useMemo(
    () => [{ id: "library" as TabId, label: "Library", icon: Film }],
    []
  );

  return (
    <AppLayout
      title="Movies & TV"
      description="Your complete movie and TV library"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={() => {
        // Single-tab layout: no-op by design.
      }}
    >
      <TabPanel id="library-panel" tabId="library-tab">
        <PersonalWatchList initialFilter="all" />
      </TabPanel>
    </AppLayout>
  );
};

export default MoviesPage;
