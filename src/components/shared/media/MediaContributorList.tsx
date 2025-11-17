import React from "react";

interface MediaContributorListProps {
  title: string;
  contributors: string[];
  variant?: "inline" | "chips";
  maxVisible?: number;
  className?: string;
}

const MediaContributorList: React.FC<MediaContributorListProps> = ({
  title,
  contributors,
  variant = "chips",
  maxVisible,
  className = "",
}) => {
  if (!contributors || contributors.length === 0) {
    return null;
  }

  if (variant === "inline") {
    return (
      <div className={`pb-5 ${className}`}>
        <p className="text-base italic text-gray-600 dark:text-gray-400 mt-3">
          by {contributors.join(", ")}
        </p>
      </div>
    );
  }

  // Chips variant
  const defaultMaxVisible = maxVisible ?? 8;
  const visibleContributors = contributors.slice(0, defaultMaxVisible);
  const hasMore = contributors.length > defaultMaxVisible;

  return (
    <div className={`pb-5 ${className}`}>
      <h3 className="text-sm font-medium text-primary mb-2.5 mt-0">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {visibleContributors.map((contributor, index) => (
          <span
            key={index}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
          >
            {contributor}
          </span>
        ))}
        {hasMore && (
          <span className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
            +{contributors.length - defaultMaxVisible} more
          </span>
        )}
      </div>
    </div>
  );
};

export default MediaContributorList;
