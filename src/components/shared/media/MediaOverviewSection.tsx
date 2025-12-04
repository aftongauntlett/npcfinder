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
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
        Overview
      </h3>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {description}
        </p>
      )}
      {children}
    </div>
  );
};

export default MediaOverviewSection;
