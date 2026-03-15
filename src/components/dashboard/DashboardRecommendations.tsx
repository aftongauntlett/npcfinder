import React, { useState } from "react";
import { Button } from "@/components/shared";
import { RecommendationsTabPanel } from "./RecommendationsTabPanel";
import { TAB_CONFIG, type RecommendationMediaTab } from "./recommendationTabs";

function DashboardRecommendationsComponent() {
  const [activeTab, setActiveTab] =
    useState<RecommendationMediaTab>("movies-tv");

  return (
    <div className="container mx-auto px-4 sm:px-6">
      <div className="mb-4 flex flex-wrap gap-2">
        {TAB_CONFIG.map((tab) => (
          <Button
            key={tab.id}
            variant="subtle"
            className={
              activeTab === tab.id
                ? "bg-primary text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <RecommendationsTabPanel tabId={activeTab} />
    </div>
  );
}

export const DashboardRecommendations = React.memo(
  DashboardRecommendationsComponent,
);
