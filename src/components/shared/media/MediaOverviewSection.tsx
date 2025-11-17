import React from "react";

interface MediaOverviewSectionProps {
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

const MediaOverviewSection: React.FC<MediaOverviewSectionProps> = ({
  description,
  children,
  className = "",
}) => {
  // Only render if there's actual content
  if (!description && !children) return null;

  return (
    <div className={`pb-5 ${className}`}>
      <h3 className="text-sm font-medium text-primary mb-2.5 mt-0">Overview</h3>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed m-0 mb-4">
          {description}
        </p>
      )}
      {children}
    </div>
  );
};

export default MediaOverviewSection;
