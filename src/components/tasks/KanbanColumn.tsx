/**
 * Kanban Column Component
 * Represents a single section/column in the Kanban board (now called "Grid")
 */

import React, { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTaskCard } from "./SortableTaskCard";
import type { Task, BoardSection } from "../../services/tasksService.types";
import Button from "../shared/ui/Button";
import ConfirmDialog from "../shared/ui/ConfirmDialog";

interface KanbanColumnProps {
  section: BoardSection;
  tasks: Task[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onRenameSection?: (sectionId: string, newName: string) => void;
  onDeleteSection?: (sectionId: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  section,
  tasks,
  onCreateTask,
  onEditTask,
  onRenameSection,
  onDeleteSection,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(section.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { setNodeRef } = useDroppable({
    id: section.id,
  });

  const handleRename = () => {
    if (editedName.trim() && editedName !== section.name && onRenameSection) {
      onRenameSection(section.id, editedName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setEditedName(section.name);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex-shrink-0 w-80 group">
      <div
        ref={setNodeRef}
        className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-4 h-full min-h-[400px]"
      >
        {/* Column Header */}
        <div className="flex items-center justify-between mb-4">
          {isEditing ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              autoFocus
              className="flex-1 bg-white dark:bg-gray-800 border border-purple-500 rounded px-2 py-1 text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ) : (
            <>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {section.name}
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  {tasks.length}
                </span>
              </h3>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onRenameSection && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="subtle"
                    size="icon"
                    icon={<Pencil className="w-3.5 h-3.5" />}
                    aria-label={`Rename ${section.name}`}
                  />
                )}
                {onDeleteSection && (
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="subtle"
                    size="icon"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    aria-label={`Delete ${section.name}`}
                    className="hover:text-red-600 dark:hover:text-red-400"
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Tasks */}
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 min-h-[200px]">
            {tasks.length === 0 ? (
              <button
                onClick={onCreateTask}
                className="w-full py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group"
              >
                <Plus className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 group-hover:text-primary mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-primary">
                  Add your first task
                </p>
              </button>
            ) : (
              <>
                {tasks.map((task) => (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    onEditTask={onEditTask}
                  />
                ))}
                {/* Bottom Add Button */}
                <button
                  onClick={onCreateTask}
                  className="w-full py-3 mt-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all flex items-center justify-center gap-2 group"
                >
                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                  <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-primary">
                    Add task
                  </span>
                </button>
              </>
            )}
          </div>
        </SortableContext>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => onDeleteSection?.(section.id)}
        title="Delete Column?"
        message={`Are you sure you want to delete "${section.name}"? ${
          tasks.length > 0
            ? `This will also delete ${tasks.length} task${
                tasks.length === 1 ? "" : "s"
              } in this column.`
            : ""
        }`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default KanbanColumn;
