import React from "react";
import PropTypes from "prop-types";
import PageContainer from "../shared/PageContainer";
import Card from "../shared/Card";

/**
 * Reusable Media Page Layout
 * Consistent structure for Movies/TV/Games/Books pages
 */
const MediaPageLayout = ({
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            {title}
          </h1>

          {/* Search Bar */}
          {searchBar && <div className="mb-4">{searchBar}</div>}

          {/* Action Buttons (Random, Top 10, etc) */}
          {actionButtons && (
            <div className="flex flex-wrap gap-3 mb-4">{actionButtons}</div>
          )}

          {/* Filters */}
          {filters && <div className="mb-6">{filters}</div>}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Content (3/4 width on large screens) */}
          <div className="lg:col-span-3">{content}</div>

          {/* Sidebar (1/4 width on large screens) */}
          {sidebar && (
            <div className="lg:col-span-1">
              <div className="sticky top-4">{sidebar}</div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

MediaPageLayout.propTypes = {
  title: PropTypes.string.isRequired,
  searchBar: PropTypes.node,
  filters: PropTypes.node,
  actionButtons: PropTypes.node,
  content: PropTypes.node.isRequired,
  sidebar: PropTypes.node,
};

export default MediaPageLayout;
