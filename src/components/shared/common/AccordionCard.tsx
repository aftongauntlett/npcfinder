/**
 * AccordionCard Component
 *
 * Shared accordion card component for Tasks and Boards
 * Provides consistent styling and behavior
 */

import React, { useState, ReactNode } from "react";
import { ChevronDown, Edit2, Trash2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface AccordionCardProps {
  // Header content
  icon?: ReactNode;
  title: string;
  subtitle?: string | ReactNode;
  metadata?: ReactNode; // Priority badge for tasks, nothing for boards

  // Description
  description?: string;
  descriptionPreview?: boolean; // Show truncated description when closed

  // Expanded content (custom content like Kanban board)
  expandedContent?: ReactNode;

  // Actions
  onEdit?: () => void;
  onDelete?: () => void;
  onOpenInTab?: () => void;
  onClick?: () => void;

  // State
  defaultExpanded?: boolean;
  className?: string;
}

const AccordionCard: React.FC<AccordionCardProps> = ({
  icon,
  title,
  subtitle,
  metadata,
  description,
  descriptionPreview = true,
  expandedContent,
  onEdit,
  onDelete,
  onOpenInTab,
  onClick,
  defaultExpanded = false,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't toggle if clicking action buttons
    if (target.closest("[data-action-buttons]")) {
      return;
    }

    if (onClick && !isExpanded) {
      onClick();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <motion.div
      onClick={handleCardClick}
      className={`relative bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 hover:bg-gray-900/[0.04] dark:hover:bg-gray-900 transition-all duration-300 cursor-pointer group overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4">
        {/* Top Row */}
        <div className="flex items-start justify-between gap-3">
          {/* Left: Icon/Badge, Title, Subtitle */}
          <div className="flex-1 min-w-0 flex items-start gap-2">
            {/* Icon or Priority Badge */}
            {icon && <div className="flex-shrink-0">{icon}</div>}

            {/* Metadata (priority badge) */}
            {metadata && <div className="flex-shrink-0">{metadata}</div>}

            {/* Title and Subtitle */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base text-white">{title}</h3>
              {subtitle && (
                <div className="text-sm text-gray-400 mt-0.5">{subtitle}</div>
              )}
            </div>
          </div>

          {/* Right: Action buttons + Chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Quick action buttons - visible on hover on desktop, always visible on mobile */}
            <div
              className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              data-action-buttons
            >
              {onOpenInTab && isExpanded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenInTab();
                  }}
                  className="h-8 w-8 p-0 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  aria-label="Open in new tab"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="h-8 w-8 p-0 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  aria-label="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="h-8 w-8 p-0 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Chevron - rotates on expand */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </motion.div>
          </div>
        </div>

        {/* Description preview (truncated, only when closed) */}
        {!isExpanded &&
          descriptionPreview &&
          description &&
          description.trim().length > 0 && (
            <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed mt-2">
              {description}
            </p>
          )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="px-4 pb-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Full Description */}
          {description && description.trim().length > 0 && (
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-3">
              {description}
            </p>
          )}

          {/* Custom expanded content */}
          {expandedContent}
        </motion.div>
      )}
    </motion.div>
  );
};

export default AccordionCard;
