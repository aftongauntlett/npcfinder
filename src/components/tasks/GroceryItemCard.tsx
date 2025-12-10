/**
 * Grocery Item Card
 *
 * Displays a single grocery item with checkbox toggle, quantity, category badge, and actions
 */

import React, { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import Card from "../shared/ui/Card";
import Accordion from "../shared/common/Accordion";
import Button from "../shared/ui/Button";
import Chip from "../shared/ui/Chip";
import ConfirmDialog from "../shared/ui/ConfirmDialog";
import type { Task } from "../../services/tasksService.types";
import { CATEGORY_COLORS } from "../../utils/taskConstants";

interface GroceryItemCardProps {
  task: Task;
  onTogglePurchased: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  isReadOnly?: boolean;
}

const GroceryItemCard: React.FC<GroceryItemCardProps> = ({
  task,
  onTogglePurchased,
  onEdit,
  onDelete,
  isReadOnly = false,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const itemData =
    (task.item_data as {
      item_name?: string;
      category?: string;
      quantity?: string;
      notes?: string;
    }) || {};

  const isPurchased = !!task.completed_at;
  const category = itemData.category || "Other";
  const categoryColors =
    CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
    CATEGORY_COLORS.Other;

  const handleDelete = () => {
    onDelete(task.id);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Card
        variant="default"
        className={`group ${isPurchased ? "opacity-60" : ""}`}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={() => onTogglePurchased(task.id)}
            disabled={isReadOnly}
            className={`
              flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center
              transition-colors mt-0.5
              ${
                isPurchased
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500"
              }
              ${isReadOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
            aria-label={isPurchased ? "Mark as needed" : "Mark as purchased"}
          >
            {isPurchased && (
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Item Details */}
          <div className="flex-1 min-w-0">
            <h3
              className={`
                font-semibold text-base
                ${
                  isPurchased
                    ? "line-through text-gray-500 dark:text-gray-400"
                    : "text-gray-900 dark:text-gray-100"
                }
              `}
            >
              {itemData.item_name || task.title}
            </h3>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {/* Category Badge */}
              <Chip
                variant="default"
                size="sm"
                className={`${categoryColors.bg} ${categoryColors.text} ${categoryColors.border} border`}
              >
                {category}
              </Chip>

              {/* Quantity */}
              {itemData.quantity && (
                <span
                  className={`text-sm ${
                    isPurchased
                      ? "text-gray-400 dark:text-gray-500"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {itemData.quantity}
                </span>
              )}
            </div>

            {/* Notes - Accordion */}
            {itemData.notes && (
              <div className="mt-2">
                <Accordion
                  title="Notes"
                  variant="compact"
                  defaultExpanded={false}
                >
                  <div className="p-3 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                    {itemData.notes}
                  </div>
                </Accordion>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isReadOnly && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="subtle"
                size="icon"
                onClick={() => onEdit(task.id)}
                aria-label="Edit item"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="subtle"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Delete item"
                className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${
          itemData.item_name || task.title
        }"?`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};

export default GroceryItemCard;
