import React, { useMemo } from "react";
import { BookOpen } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import PersonalReadingList from "./PersonalReadingList";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { TabPanel } from "../../shared";

// Static page meta options (stable reference)
const pageMetaOptions = {
  title: "Books",
  description: "Your complete book library",
  noIndex: true,
};

type TabId = "library";

/**
 * Books Page
 *
 * Uses unified AppLayout for consistent spacing and footer
 */
const BooksPage: React.FC = () => {
  usePageMeta(pageMetaOptions);

  // Media intentionally uses a single "Library" tab.
  // "Add" is an action (opens the search/add modal), not a mode,
  // to avoid state-based navigation.
  const activeTab: TabId = "library";

  const tabs = useMemo(
    () => [{ id: "library" as TabId, label: "Library", icon: BookOpen }],
    []
  );

  return (
    <AppLayout
      title="Books"
      description="Your complete book library"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={() => {
        // Single-tab layout: no-op by design.
      }}
    >
      <TabPanel id="library-panel" tabId="library-tab">
        <PersonalReadingList initialFilter="all" />
      </TabPanel>
    </AppLayout>
  );
};

export default BooksPage;
