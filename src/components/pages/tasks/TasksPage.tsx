/**
 * Tasks Page
 *
 * Tabbed view with:
 * - Tasks: Unassigned tasks (inbox)
 * - Kanban: Kanban template boards
 * - Calendar: Calendar view of tasks with due dates
 * - Recipes: Recipe template boards
 * - Job Applications: Job tracker template boards
 */

import React, { useState, useMemo } from "react";
import {
  ListTodo,
  LayoutGrid,
  ChefHat,
  Briefcase,
  Calendar,
} from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import InboxView from "./InboxView";
import TemplateView from "./TemplateView";
import CalendarView from "../../tasks/views/CalendarView";
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

type ViewType = "tasks" | "kanban" | "calendar" | "recipes" | "job_applications";

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
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);

  const { data: boards = [] } = useBoards() as { data: BoardWithStats[] };
  // Fetch specific task when editing (lazy-loaded only when needed)
  const { data: editingTask = null } = useTask(editingTaskId);
  // Fetch unassigned tasks count for badge (lightweight count-only query)
  const { data: unassignedTasksCount = 0 } = useUnassignedTasksCount();

  // Get singleton board IDs for job_tracker and recipe
  const { jobBoardId, recipeBoardId } = useAllSingletonBoards();

  // Extract board filtering and task counts into dedicated hook
  const {
    kanbanBoards,
    recipeBoards,
    jobBoards,
    recipeTaskCount,
    jobTaskCount,
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
      case "calendar":
        return "Calendar";
      case "recipes":
        return "Recipes";
      case "job_applications":
        return "Job Applications";
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
        badge: kanbanBoards.length > 0 ? kanbanBoards.length : undefined,
      },
      {
        id: "calendar",
        label: "Calendar",
        icon: Calendar,
      },
      {
        id: "recipes",
        label: "Recipes",
        icon: ChefHat,
        badge: recipeTaskCount > 0 ? recipeTaskCount : undefined,
      },
      {
        id: "job_applications",
        label: "Job Applications",
        icon: Briefcase,
        badge: jobTaskCount > 0 ? jobTaskCount : undefined,
      },
    ];
  }, [
    unassignedTasksCount,
    kanbanBoards.length,
    recipeTaskCount,
    jobTaskCount,
  ]);

  // Handle create task from board
  // For singleton types (job_tracker, recipe), boardId is optional and handled automatically
  const handleCreateTask = (boardId?: string, sectionId?: string) => {
    // Determine which board to use based on current view
    let targetBoardId = boardId;

    if (!targetBoardId) {
      // Auto-assign singleton board based on current view
      if (selectedView === "job_applications") {
        targetBoardId = jobBoardId ?? undefined;
      } else if (selectedView === "recipes") {
        targetBoardId = recipeBoardId ?? undefined;
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
      <TabPanel
        id={`${selectedView}-panel`}
        tabId={`${selectedView}-tab`}
      >
        {selectedView === "tasks" && <InboxView />}
        {selectedView === "kanban" && (
          <TemplateView
            templateType="kanban"
            boards={kanbanBoards}
            onCreateTask={handleCreateTask}
            onEditTask={handleEditTask}
          />
        )}
        {selectedView === "calendar" && (
          <div className="container mx-auto px-4 sm:px-6">
            <CalendarView 
              onDayClick={(date) => {
                setSelectedCalendarDate(date);
                setCreateTaskBoardId(undefined);
                setCreateTaskSectionId(undefined);
                setShowCreateTask(true);
              }}
            />
          </div>
        )}
        {selectedView === "recipes" && (
          <TemplateView
            templateType="recipe"
            boards={recipeBoards}
            onCreateTask={handleCreateTask}
            onEditTask={handleEditTask}
          />
        )}
        {selectedView === "job_applications" && (
          <TemplateView
            templateType="job_tracker"
            boards={jobBoards}
            onCreateTask={handleCreateTask}
            onEditTask={handleEditTask}
          />
        )}
      </TabPanel>

      {/* Modals */}
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
              setSelectedCalendarDate(null);
            }}
            boardId={createTaskBoardId}
            boardType={
              createTaskBoard?.board_type || createTaskBoard?.template_type
            }
            defaultSectionId={createTaskSectionId}
            defaultDueDate={selectedCalendarDate}
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
