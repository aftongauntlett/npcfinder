/**
 * Kanban Column Component
 * Represents a single section/column in the Kanban board (now called "Grid")
 *
 * Memoized: Prevents rerenders when tasks array reference changes but content is same
 */

import React, { useState, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Task, BoardSection } from "../../services/tasksService.types";
import { Button, Input, ConfirmationModal } from "../shared";
import TaskCard from "./TaskCard";

interface KanbanColumnProps {
  section: BoardSection;
  tasks: Task[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onRenameSection?: (sectionId: string, newName: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onDragStart?: (task: Task) => void;
  onDragEnd?: () => void;
  onDrop?: (targetSectionId: string, targetTaskId?: string) => void;
}

const KanbanColumnComponent: React.FC<KanbanColumnProps> = ({
  section,
  tasks,
  onCreateTask,
  onEditTask,
  onRenameSection,
  onDeleteSection,
  onDragStart,
  onDragEnd,
  onDrop,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(section.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragOverEmpty, setDragOverEmpty] = useState(false);

  const handleRename = useCallback(() => {
    if (editedName.trim() && editedName !== section.name && onRenameSection) {
      onRenameSection(section.id, editedName.trim());
    }
    setIsEditing(false);
  }, [editedName, section.name, section.id, onRenameSection]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleRename();
      } else if (e.key === "Escape") {
        setEditedName(section.name);
        setIsEditing(false);
      }
    },
    [handleRename, section.name]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
    setDragOverTaskId(null);
    setDragOverEmpty(false);
  }, []);

  const handleDropOnColumn = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      setDragOverTaskId(null);
      setDragOverEmpty(false);
      if (onDrop) {
        onDrop(section.id);
      }
    },
    [onDrop, section.id]
  );

  return (
    <div className="flex-1 min-w-[280px] sm:min-w-[320px] md:min-w-0 snap-start snap-always group">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDropOnColumn}
        className={`bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3 sm:p-4 h-full min-h-[400px] flex flex-col transition-all duration-200 ${
          dragOver ? "bg-primary/5 dark:bg-primary/10" : ""
        }`}
      >
        {/* Column Header */}
        <div className="flex items-center justify-between mb-4">
          {isEditing ? (
            <Input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              autoFocus
              inputClassName="font-semibold"
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
        <div className="space-y-2 min-h-[200px]">
          {tasks.length === 0 ? (
            <button
              onClick={onCreateTask}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverEmpty(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverEmpty(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverEmpty(false);
                if (onDrop) {
                  onDrop(section.id);
                }
              }}
              className={`w-full py-12 border-2 border-dashed rounded-lg transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                dragOverEmpty
                  ? "border-primary bg-primary/10 dark:bg-primary/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10"
              }`}
              aria-label="Add your first task to this column"
            >
              <Plus
                className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 group-hover:text-primary mb-2"
                aria-hidden="true"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-primary">
                Add your first task
              </p>
            </button>
          ) : (
            <>
              {tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => {
                    onDragStart?.(task);
                    setDragOverTaskId(null);
                  }}
                  onDragEnd={() => {
                    onDragEnd?.();
                    setDragOverTaskId(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverTaskId(task.id);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverTaskId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverTaskId(null);
                    if (onDrop) {
                      onDrop(section.id, task.id);
                    }
                  }}
                  className={`cursor-move transition-all duration-150 hover:opacity-80 active:opacity-50 ${
                    dragOverTaskId === task.id
                      ? "ring-2 ring-primary/50 rounded-lg"
                      : ""
                  }`}
                >
                  <TaskCard
                    task={task}
                    variant="kanban"
                    onClick={() => onEditTask(task)}
                  />
                </div>
              ))}
              {/* Bottom Add Button */}
              <button
                onClick={onCreateTask}
                className="w-full py-3 mt-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all flex items-center justify-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                aria-label="Add task to this column"
              >
                <Plus
                  className="w-4 h-4 text-gray-400 group-hover:text-primary"
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-primary">
                  Add task
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {onDeleteSection && (
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => onDeleteSection(section.id)}
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
          isLoading={false}
        />
      )}
    </div>
  );
};

// Memoize with custom comparison to prevent rerenders when tasks array reference changes but content is same
export default React.memo(
  KanbanColumnComponent,
  (prevProps, nextProps) =>
    prevProps.section.id === nextProps.section.id &&
    prevProps.section.name === nextProps.section.name &&
    prevProps.tasks.length === nextProps.tasks.length &&
    prevProps.tasks.every(
      (task, i) => task.id === nextProps.tasks[i]?.id
    ) &&
    prevProps.onDragStart === nextProps.onDragStart &&
    prevProps.onDragEnd === nextProps.onDragEnd &&
    prevProps.onDrop === nextProps.onDrop &&
    prevProps.onCreateTask === nextProps.onCreateTask &&
    prevProps.onEditTask === nextProps.onEditTask &&
    prevProps.onRenameSection === nextProps.onRenameSection &&
    prevProps.onDeleteSection === nextProps.onDeleteSection
);
