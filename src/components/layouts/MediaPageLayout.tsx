import React from "react";
import PageContainer from "../shared/PageContainer";

interface MediaPageLayoutProps {
  title: string;
  searchBar?: React.ReactNode;
  filters?: React.ReactNode;
  actionButtons?: React.ReactNode;
  content: React.ReactNode;
  sidebar?: React.ReactNode;
}

const MediaPageLayout: React.FC<MediaPageLayoutProps> = ({
  title,
  searchBar,
  filters,
  actionButtons,
  content,
  sidebar,
}) => {
  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            {title}
          </h1>

          {/* Search Bar */}
          {searchBar && <div className="mb-4">{searchBar}</div>}

          {/* Action Buttons */}
          {actionButtons && (
            <div className="flex flex-wrap gap-3 mb-4">{actionButtons}</div>
          )}

          {/* Filters */}
          {filters && <div className="mb-6">{filters}</div>}
        </header>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Content */}
          <main className="lg:col-span-3">{content}</main>

          {/* Sidebar */}
          {sidebar && (
            <aside className="lg:col-span-1">
              <div className="sticky top-4">{sidebar}</div>
            </aside>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default MediaPageLayout;
