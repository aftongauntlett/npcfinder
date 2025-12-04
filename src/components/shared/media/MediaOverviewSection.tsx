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
      <h3 className="font-semibold text-primary dark:text-primary-light">
        Overview
      </h3>
      {description && (
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {description}
        </p>
      )}
      {children}
    </div>
  );
};

export default MediaOverviewSection;
