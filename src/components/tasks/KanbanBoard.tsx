/**
 * Kanban Board Component
 * Drag-and-drop board for managing tasks across sections
 */

import React, { useState } from "react";
import { Plus } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useBoardSections,
  useTasks,
  useMoveTask,
  useUpdateSection,
  useCreateSection,
  useDeleteSection,
} from "../../hooks/useTasksQueries";
import type { Task } from "../../services/tasksService.types";
import TaskCard from "./TaskCard";
import KanbanColumn from "./KanbanColumn";
import EmptyState from "../shared/ui/EmptyState";

interface KanbanBoardProps {
  boardId: string;
  onCreateTask: (sectionId?: string) => void;
  onEditTask: (task: Task) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  boardId,
  onCreateTask,
  onEditTask,
}) => {
  const { data: sections = [] } = useBoardSections(boardId);
  const { data: tasks = [] } = useTasks(boardId);
  const moveTask = useMoveTask();
  const updateSection = useUpdateSection();
  const createSection = useCreateSection();
  const deleteSection = useDeleteSection();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const handleRenameSection = (sectionId: string, newName: string) => {
    void updateSection.mutateAsync({
      boardId,
      sectionId,
      updates: { name: newName },
    });
  };

  const handleAddColumn = () => {
    void createSection.mutateAsync({
      boardId,
      sectionData: {
        name: "Custom",
        display_order: sections.length,
      },
    });
  };

  const handleDeleteSection = (sectionId: string) => {
    void deleteSection.mutateAsync({ boardId, sectionId });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by section
  const tasksBySection = tasks.reduce((acc, task) => {
    const sectionId = task.section_id || "unsectioned";
    if (!acc[sectionId]) {
      acc[sectionId] = [];
    }
    acc[sectionId].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Sort tasks within each section by display_order
  Object.keys(tasksBySection).forEach((sectionId) => {
    tasksBySection[sectionId].sort(
      (a, b) => (a.display_order || 0) - (b.display_order || 0)
    );
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a section (column)
    const targetSection = sections.find((s) => s.id === overId);
    if (targetSection) {
      // Move to this section
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.section_id !== targetSection.id) {
        const newOrder = tasksBySection[targetSection.id]?.length || 0;
        void moveTask.mutateAsync({
          taskId,
          sectionId: targetSection.id,
          newOrder,
        });
      }
      return;
    }

    // Check if dropped on another task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && taskId !== overId) {
        void moveTask.mutateAsync({
          taskId,
          sectionId: overTask.section_id || null,
          newOrder: overTask.display_order || 0,
        });
      }
    }
  };

  if (sections.length === 0) {
    return (
      <EmptyState
        icon={Plus}
        title="No sections in this board yet"
        description="Add your first task to get started"
        actionLabel="Add First Task"
        onAction={() => onCreateTask()}
        className="min-h-[400px]"
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {sections.map((section) => {
          const sectionTasks = tasksBySection[section.id] || [];
          return (
            <KanbanColumn
              key={section.id}
              section={section}
              tasks={sectionTasks}
              onCreateTask={() => onCreateTask(section.id)}
              onEditTask={onEditTask}
              onRenameSection={handleRenameSection}
              onDeleteSection={handleDeleteSection}
            />
          );
        })}

        {/* Add Column button (max 4 columns) */}
        {sections.length < 4 && (
          <div className="flex-shrink-0 w-80">
            <button
              onClick={handleAddColumn}
              className="w-full h-[200px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group flex flex-col items-center justify-center gap-3"
            >
              <Plus className="w-8 h-8 text-gray-400 dark:text-gray-500 group-hover:text-primary" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary">
                Add Column
              </span>
            </button>
          </div>
        )}

        {/* Unsectioned tasks column */}
        {tasksBySection.unsectioned &&
          tasksBySection.unsectioned.length > 0 && (
            <div className="flex-shrink-0 w-80">
              <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Unsectioned
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {tasksBySection.unsectioned.length}
                    </span>
                  </h3>
                </div>
                <SortableContext
                  items={tasksBySection.unsectioned.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {tasksBySection.unsectioned.map((task) => (
                      <div key={task.id}>
                        <TaskCard
                          task={task}
                          variant="kanban"
                          onClick={(taskId) => {
                            const foundTask = tasks.find(
                              (t) => t.id === taskId
                            );
                            if (foundTask) onEditTask(foundTask);
                          }}
                          draggable
                        />
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </div>
            </div>
          )}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} variant="kanban" /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
