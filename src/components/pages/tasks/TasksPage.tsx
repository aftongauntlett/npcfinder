/**
 * Tasks Page
 *
 * Tabbed view with:
 * - Tasks: Unassigned tasks (inbox)
 * - Kanban: Kanban template boards
 * - Recipes: Recipe template boards
 */

import React, { useState, useMemo } from "react";
import { ListTodo, LayoutGrid, ChefHat } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import InboxView from "./InboxView";
import TemplateView from "./TemplateView";
import { TabPanel } from "../../shared";
import CreateTaskModal from "../../tasks/CreateTaskModal";
import KanbanTaskModal from "../../tasks/KanbanTaskModal";
import RecipeFormModal from "../../tasks/RecipeFormModal";
import TaskDetailModal from "../../tasks/TaskDetailModal";
import {
  useBoards,
  useTask,
  useUnassignedTasksCount,
} from "../../../hooks/useTasksQueries";
import { useBoardTemplates } from "../../../hooks/useBoardTemplates";
import { useAllSingletonBoards } from "../../../hooks/useSingletonBoard";
import type { BoardWithStats } from "../../../services/tasksService.types";
import { usePageMeta } from "../../../hooks/usePageMeta";

type ViewType = "tasks" | "kanban" | "recipes";

// Static page meta options (stable reference)
const pageMetaOptions = {
  title: "Tasks",
  description: "Manage your tasks with flexible board-based organization",
  noIndex: true,
};

const TasksPage: React.FC = () => {
  usePageMeta(pageMetaOptions);

  const [selectedView, setSelectedView] = useState<ViewType>("tasks");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createTaskBoardId, setCreateTaskBoardId] = useState<
    string | undefined
  >();
  const [createTaskSectionId, setCreateTaskSectionId] = useState<
    string | undefined
  >();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const { data: boards = [] } = useBoards() as { data: BoardWithStats[] };
  // Fetch specific task when editing (lazy-loaded only when needed)
  const { data: editingTask = null } = useTask(editingTaskId);
  // Fetch unassigned tasks count for badge (lightweight count-only query)
  const { data: unassignedTasksCount = 0 } = useUnassignedTasksCount();

  // Get singleton board IDs for recipe and kanban
  const {
    recipeBoardId,
    kanbanBoardId,
    error: singletonError,
  } = useAllSingletonBoards();

  // Extract board filtering and task counts into dedicated hook
  const {
    kanbanBoards,
    recipeBoards,
    kanbanTaskCount,
    recipeTaskCount,
  } = useBoardTemplates(boards);

  // Find board for the editing task
  const editingTaskBoard = useMemo(() => {
    if (!editingTask?.board_id) return null;
    return boards.find((b) => b.id === editingTask.board_id) || null;
  }, [editingTask, boards]);

  // Find board for create task modal
  const createTaskBoard = useMemo(() => {
    if (!createTaskBoardId) return null;
    return boards.find((b) => b.id === createTaskBoardId) || null;
  }, [createTaskBoardId, boards]);

  // Dynamic title based on current view
  const pageTitle = useMemo(() => {
    switch (selectedView) {
      case "tasks":
        return "Tasks";
      case "kanban":
        return "Kanban";
      case "recipes":
        return "Recipes";
      default:
        return "Tasks";
    }
  }, [selectedView]);

  // Build tabs array
  const tabs = useMemo(() => {
    return [
      {
        id: "tasks",
        label: "Tasks",
        icon: ListTodo,
        badge: unassignedTasksCount > 0 ? unassignedTasksCount : undefined,
      },
      {
        id: "kanban",
        label: "Kanban",
        icon: LayoutGrid,
        badge: kanbanTaskCount > 0 ? kanbanTaskCount : undefined,
      },
      {
        id: "recipes",
        label: "Recipes",
        icon: ChefHat,
        badge: recipeTaskCount > 0 ? recipeTaskCount : undefined,
      },
    ];
  }, [unassignedTasksCount, kanbanTaskCount, recipeTaskCount]);

  // Handle create task from board
  // For singleton types (recipe, kanban), boardId is optional and handled automatically
  const handleCreateTask = (boardId?: string, sectionId?: string) => {
    // Determine which board to use based on current view
    let targetBoardId = boardId;

    if (!targetBoardId) {
      // Auto-assign singleton board based on current view
      if (selectedView === "recipes") {
        targetBoardId = recipeBoardId ?? undefined;
      } else if (selectedView === "kanban") {
        targetBoardId = kanbanBoardId ?? undefined;
      }
    }

    setCreateTaskBoardId(targetBoardId);
    setCreateTaskSectionId(sectionId);
    setShowCreateTask(true);
  };

  // Handle edit task
  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId);
  };

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setSelectedView(tabId as ViewType);
  };

  return (
    <AppLayout
      title={pageTitle}
      description="Quick access to tasks and organized boards for different workflows."
      tabs={tabs}
      activeTab={selectedView}
      onTabChange={handleTabChange}
    >
      {/* Content */}
      <TabPanel id={`${selectedView}-panel`} tabId={`${selectedView}-tab`}>
        {selectedView === "tasks" && <InboxView />}
        {selectedView === "kanban" && (
          <TemplateView
            templateType="kanban"
            boards={kanbanBoards}
            onCreateTask={handleCreateTask}
            onEditTask={handleEditTask}
            singletonError={singletonError}
          />
        )}
        {selectedView === "recipes" && (
          <TemplateView
            templateType="recipe"
            boards={recipeBoards}
            onCreateTask={handleCreateTask}
            onEditTask={handleEditTask}
            singletonError={singletonError}
          />
        )}
      </TabPanel>

      {/* Modals */}
      {/* Task Creation Modals */}
      {showCreateTask &&
        (createTaskBoard?.template_type === "recipe" ? (
          <RecipeFormModal
            isOpen={showCreateTask}
            onClose={() => {
              setShowCreateTask(false);
              setCreateTaskBoardId(undefined);
              setCreateTaskSectionId(undefined);
            }}
            boardId={createTaskBoardId!}
          />
        ) : createTaskBoard?.template_type === "kanban" ? (
          <KanbanTaskModal
            isOpen={showCreateTask}
            onClose={() => {
              setShowCreateTask(false);
              setCreateTaskBoardId(undefined);
              setCreateTaskSectionId(undefined);
            }}
            boardId={createTaskBoardId!}
            sectionId={createTaskSectionId}
          />
        ) : (
          <CreateTaskModal
            isOpen={showCreateTask}
            onClose={() => {
              setShowCreateTask(false);
              setCreateTaskBoardId(undefined);
              setCreateTaskSectionId(undefined);
            }}
            boardId={createTaskBoardId}
            boardType={
              createTaskBoard?.board_type || createTaskBoard?.template_type
            }
            defaultSectionId={createTaskSectionId}
          />
        ))}

      {editingTask &&
        (editingTaskBoard?.template_type === "kanban" ? (
          <KanbanTaskModal
            isOpen={!!editingTask}
            onClose={() => setEditingTaskId(null)}
            boardId={editingTask.board_id!}
            task={editingTask}
          />
        ) : (
          <TaskDetailModal
            task={editingTask}
            isOpen={!!editingTask}
            onClose={() => setEditingTaskId(null)}
          />
        ))}
    </AppLayout>
  );
};

export default TasksPage;
