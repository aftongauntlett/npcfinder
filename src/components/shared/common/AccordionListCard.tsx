/**
 * AccordionListCard Component
 *
 * Lightweight accordion card for list items (jobs, recipes, etc.)
 * Provides consistent action button + chevron pattern
 * Simpler styling than AccordionCard (no backdrop blur, simpler animations)
 */

import React, { useState, ReactNode } from "react";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";

interface CustomAction {
  label?: string; // Optional - for icon-only buttons
  icon: ReactNode;
  onClick: () => void;
  variant?:
    | "primary"
    | "secondary"
    | "subtle"
    | "danger"
    | "action"
    | "gradient";
  ariaLabel?: string;
  className?: string; // Custom className for styling overrides
}

interface AccordionListCardProps {
  // Header content
  children: ReactNode; // Main content shown when collapsed

  // Expanded content
  expandedContent?: ReactNode;

  // Actions
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  customActions?: CustomAction[]; // Additional action buttons (e.g., recommend, status change)

  // State
  defaultExpanded?: boolean;
  className?: string;
  onExpandChange?: (isExpanded: boolean) => void; // Callback when expand state changes
}

/**
 * AccordionListCard - Reusable accordion pattern for list cards
 *
 * Provides consistent layout:
 * - Action buttons (edit/delete) visible on hover (desktop) or always (mobile)
 * - Chevron always visible, positioned to right of action buttons
 * - Proper spacing and click handling
 *
 * Usage:
 * <AccordionListCard
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   expandedContent={<div>Details here</div>}
 * >
 *   <div>Card header content</div>
 * </AccordionListCard>
 */
const AccordionListCard: React.FC<AccordionListCardProps> = ({
  children,
  expandedContent,
  onEdit,
  onDelete,
  onClick,
  customActions,
  defaultExpanded = false,
  className = "",
  onExpandChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggleExpand = (newState: boolean) => {
    setIsExpanded(newState);
    onExpandChange?.(newState);
  };

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
      handleToggleExpand(!isExpanded);
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
        handleToggleExpand(!isExpanded);
      }
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
    >
      <Card
        variant="interactive"
        hover="none"
        spacing="none"
        className={`group relative hover:bg-gray-900/[0.04] dark:hover:bg-gray-900 cursor-pointer ${className}`}
      >
        {/* Header */}
        <div className="p-4">
          {/* Content with action buttons + chevron */}
          <div className="flex items-start justify-between gap-3">
            {/* Main content */}
            <div className="flex-1 min-w-0">{children}</div>

            {/* Right: Action buttons + Chevron */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* All action buttons - visible on hover on desktop, always visible on mobile */}
              {(customActions?.length || onEdit || onDelete) && (
                <div
                  className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  data-action-buttons
                >
                  {/* Custom actions */}
                  {customActions?.map((action, index) => (
                    <Button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick();
                      }}
                      variant={action.variant || "subtle"}
                      size="icon"
                      icon={action.icon}
                      aria-label={action.ariaLabel || action.label}
                      className={`h-8 w-8 ${action.className || ""}`}
                    />
                  ))}

                  {/* Standard actions */}
                  {onEdit && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                      variant="subtle"
                      size="icon"
                      icon={<Pencil className="w-4 h-4" />}
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
              )}

              {/* Chevron - always visible */}
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && expandedContent && (
          <div
            className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-3"
            data-expanded-content
          >
            {expandedContent}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AccordionListCard;
