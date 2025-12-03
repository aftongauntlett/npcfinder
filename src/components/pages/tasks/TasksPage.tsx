/**
 * Tasks Page
 *
 * Features:
 * - Tasks: Unassigned tasks (no board)
 * - Kanban: Kanban template boards
 * - Job Applications: Job tracker template boards
 * - Recipes: Recipe template boards
 */

import React, { useState, useMemo } from "react";
import {
  ListChecks,
  LayoutGrid,
  Briefcase,
  ChefHat,
  ListTodo,
} from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import InboxView from "./InboxView";
import TemplateView from "./TemplateView";
import CreateTaskModal from "../../tasks/CreateTaskModal";
import RecipeFormModal from "../../tasks/RecipeFormModal";
import TaskDetailModal from "../../tasks/TaskDetailModal";
import { useBoards, useTasks } from "../../../hooks/useTasksQueries";

type ViewType = "tasks" | "todo" | "kanban" | "job_applications" | "recipes";

const TasksPage: React.FC = () => {
  const [selectedView, setSelectedView] = useState<ViewType>("tasks");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createTaskBoardId, setCreateTaskBoardId] = useState<
    string | undefined
  >();
  const [createTaskSectionId, setCreateTaskSectionId] = useState<
    string | undefined
  >();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const { data: boards = [] } = useBoards();
  const { data: tasks = [] } = useTasks();

  // Filter boards by template type
  const todoBoards = useMemo(
    () => boards.filter((b) => b.template_type === "markdown"),
    [boards]
  );
  const kanbanBoards = useMemo(
    () => boards.filter((b) => b.template_type === "kanban"),
    [boards]
  );
  const jobBoards = useMemo(
    () => boards.filter((b) => b.template_type === "job_tracker"),
    [boards]
  );
  const recipeBoards = useMemo(
    () => boards.filter((b) => b.template_type === "recipe"),
    [boards]
  );

  // Find task being edited
  const editingTask = useMemo(() => {
    if (!editingTaskId) return null;
    return tasks.find((t) => t.id === editingTaskId) || null;
  }, [editingTaskId, tasks]);

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
      case "todo":
        return "To-Do Lists";
      case "kanban":
        return "Kanban";
      case "job_applications":
        return "Job Applications";
      case "recipes":
        return "Recipes";
      default:
        return "Tasks";
    }
  }, [selectedView]);

  // Build tabs array with template-specific views
  const tabs = useMemo(() => {
    return [
      {
        id: "tasks",
        label: "Tasks",
        icon: ListChecks,
      },
      {
        id: "todo",
        label: "To-Do Lists",
        icon: ListTodo,
        badge: todoBoards.length > 0 ? todoBoards.length : undefined,
      },
      {
        id: "kanban",
        label: "Kanban",
        icon: LayoutGrid,
        badge: kanbanBoards.length > 0 ? kanbanBoards.length : undefined,
      },
      {
        id: "job_applications",
        label: "Job Applications",
        icon: Briefcase,
        badge: jobBoards.length > 0 ? jobBoards.length : undefined,
      },
      {
        id: "recipes",
        label: "Recipes",
        icon: ChefHat,
        badge: recipeBoards.length > 0 ? recipeBoards.length : undefined,
      },
    ];
  }, [
    todoBoards.length,
    kanbanBoards.length,
    jobBoards.length,
    recipeBoards.length,
  ]);

  // Handle create task from board
  const handleCreateTask = (boardId: string, sectionId?: string) => {
    setCreateTaskBoardId(boardId);
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
      description="Quick access to one-off tasks and to-dos. Use boards for organized projects and workflows."
      tabs={tabs}
      activeTab={selectedView}
      onTabChange={handleTabChange}
    >
      {/* Content */}
      <div role="tabpanel" id={`${selectedView}-panel`}>
        {selectedView === "tasks" && <InboxView />}
        {selectedView === "todo" && (
          <TemplateView
            templateType="markdown"
            boards={todoBoards}
            onCreateTask={handleCreateTask}
            onEditTask={handleEditTask}
          />
        )}
        {selectedView === "kanban" && (
          <TemplateView
            templateType="kanban"
            boards={kanbanBoards}
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
        {selectedView === "recipes" && (
          <TemplateView
            templateType="recipe"
            boards={recipeBoards}
            onCreateTask={handleCreateTask}
            onEditTask={handleEditTask}
          />
        )}
      </div>

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

      {editingTask && (
        <TaskDetailModal
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTaskId(null)}
        />
      )}
    </AppLayout>
  );
};

export default TasksPage;
