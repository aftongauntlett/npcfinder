/**
 * AccordionCard Component
 *
 * Shared accordion card component for Tasks and Boards
 * Provides consistent styling and behavior
 */

import React, { useState, ReactNode } from "react";
import { ChevronDown, Edit2, Trash2, ExternalLink, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import Button from "../ui/Button";

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
  onShare?: () => void;
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
  onShare,
  onOpenInTab,
  onClick,
  defaultExpanded = false,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't toggle if clicking action buttons or links
    if (target.closest("[data-action-buttons]") || target.closest("a")) {
      return;
    }

    // Don't toggle if clicking inside expanded content area
    if (target.closest("[data-expanded-content]")) {
      return;
    }

    if (onClick && !isExpanded) {
      onClick();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    // Don't toggle if pressing Enter/Space on action buttons, links, or inside expanded content
    if (
      target.closest("[data-action-buttons]") ||
      target.closest("a") ||
      target.closest("[data-expanded-content]")
    ) {
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (onClick && !isExpanded) {
        onClick();
      } else {
        setIsExpanded(!isExpanded);
      }
    }
  };

  return (
    <motion.div
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      className={`relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-all duration-200 cursor-pointer group overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${className}`}
    >
      {/* Header */}
      <div className="p-4">
        {/* Top Row */}
        <div className="flex items-start justify-between gap-3">
          {/* Left: Icon, Title, Subtitle, Metadata Chips */}
          <div className="flex-1 min-w-0 flex items-start gap-2">
            {/* Icon */}
            {icon && <div className="flex-shrink-0">{icon}</div>}

            {/* Title and Subtitle */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  {title}
                </h3>
                {/* Metadata chips (priority, status, etc.) - now on the right of title */}
                {metadata && <div className="flex-shrink-0">{metadata}</div>}
              </div>
              {subtitle && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          {/* Right: Action buttons + Chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Quick action buttons - visible on hover on desktop, always visible on mobile */}
            <div
              className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              data-action-buttons
            >
              {onOpenInTab && isExpanded && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenInTab();
                  }}
                  variant="subtle"
                  size="icon"
                  icon={<ExternalLink className="w-4 h-4" />}
                  aria-label="Open in new tab"
                  title="Open in new tab"
                  className="h-8 w-8"
                />
              )}
              {onShare && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare();
                  }}
                  variant="subtle"
                  size="icon"
                  icon={<Share2 className="w-4 h-4" />}
                  aria-label="Share"
                  className="h-8 w-8"
                />
              )}
              {onEdit && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  variant="subtle"
                  size="icon"
                  icon={<Edit2 className="w-4 h-4" />}
                  aria-label="Edit"
                  className="h-8 w-8"
                />
              )}
              {onDelete && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  variant="danger"
                  size="icon"
                  icon={<Trash2 className="w-4 h-4" />}
                  aria-label="Delete"
                  className="h-8 w-8"
                />
              )}
            </div>

            {/* Chevron - rotates on expand */}
            <motion.div
              data-chevron
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
            <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed mt-1.5">
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
          className="px-4 pb-4 pt-3"
          data-expanded-content
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
