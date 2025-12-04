/**
 * Tasks Page
 *
 * Tabbed view with:
 * - Tasks: Unassigned tasks (inbox)
 * - Kanban: Kanban template boards
 * - To-Do Lists: Markdown template boards
 * - Grocery: Grocery template boards
 * - Recipes: Recipe template boards
 * - Job Applications: Job tracker template boards
 */

import React, { useState, useMemo } from "react";
import {
  ListChecks,
  LayoutGrid,
  ShoppingCart,
  ChefHat,
  Briefcase,
} from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import InboxView from "./InboxView";
import TemplateView from "./TemplateView";
import GroceryListView from "../../tasks/views/GroceryListView";
import CreateTaskModal from "../../tasks/CreateTaskModal";
import RecipeFormModal from "../../tasks/RecipeFormModal";
import TaskDetailModal from "../../tasks/TaskDetailModal";
import {
  useBoards,
  useTasks,
  useSharedBoards,
} from "../../../hooks/useTasksQueries";
import type { BoardWithStats } from "../../../services/tasksService.types";

type ViewType = "tasks" | "kanban" | "grocery" | "recipes" | "job_applications";

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

  const { data: boards = [] } = useBoards() as { data: BoardWithStats[] };
  const { data: sharedBoards = [] } = useSharedBoards() as {
    data: BoardWithStats[];
  };
  const { data: tasks = [] } = useTasks(undefined, { unassigned: true });

  // Filter boards by template type
  const kanbanBoards = useMemo(
    () => boards.filter((b) => b.template_type === "kanban"),
    [boards]
  );

  const groceryBoards = useMemo(
    () => boards.filter((b) => b.template_type === "grocery"),
    [boards]
  );

  const sharedGroceryBoards = useMemo(
    () => sharedBoards.filter((b) => b.template_type === "grocery"),
    [sharedBoards]
  );

  const recipeBoards = useMemo(
    () => boards.filter((b) => b.template_type === "recipe"),
    [boards]
  );
  const jobBoards = useMemo(
    () => boards.filter((b) => b.template_type === "job_tracker"),
    [boards]
  );

  // Calculate task counts for each template type
  const groceryTaskCount = useMemo(
    () =>
      groceryBoards.reduce((sum, board) => sum + (board.total_tasks || 0), 0),
    [groceryBoards]
  );

  const recipeTaskCount = useMemo(
    () =>
      recipeBoards.reduce((sum, board) => sum + (board.total_tasks || 0), 0),
    [recipeBoards]
  );

  const jobTaskCount = useMemo(
    () => jobBoards.reduce((sum, board) => sum + (board.total_tasks || 0), 0),
    [jobBoards]
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
      case "kanban":
        return "Kanban";
      case "grocery":
        return "Grocery";
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
        icon: ListChecks,
        badge: tasks.length > 0 ? tasks.length : undefined,
      },
      {
        id: "kanban",
        label: "Kanban",
        icon: LayoutGrid,
        badge: kanbanBoards.length > 0 ? kanbanBoards.length : undefined,
      },
      {
        id: "grocery",
        label: "Grocery",
        icon: ShoppingCart,
        badge: groceryTaskCount > 0 ? groceryTaskCount : undefined,
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
    tasks.length,
    kanbanBoards.length,
    groceryTaskCount,
    recipeTaskCount,
    jobTaskCount,
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
      description="Quick access to tasks and organized boards for different workflows."
      tabs={tabs}
      activeTab={selectedView}
      onTabChange={handleTabChange}
    >
      {/* Content */}
      <div role="tabpanel" id={`${selectedView}-panel`}>
        {selectedView === "tasks" && <InboxView />}
        {selectedView === "kanban" && (
          <TemplateView
            templateType="kanban"
            boards={kanbanBoards}
            onCreateTask={handleCreateTask}
            onEditTask={handleEditTask}
          />
        )}
        {selectedView === "grocery" && (
          <>
            {groceryBoards.length === 0 && sharedGroceryBoards.length === 0 ? (
              <TemplateView
                templateType="grocery"
                boards={groceryBoards}
                onCreateTask={handleCreateTask}
                onEditTask={handleEditTask}
              />
            ) : (
              <div className="container mx-auto px-4 sm:px-6">
                <div className="space-y-8">
                  {/* Owned Boards */}
                  {groceryBoards.length > 0 && (
                    <div className="space-y-6">
                      {groceryBoards.map((board) => (
                        <GroceryListView
                          key={board.id}
                          board={board}
                          onEditTask={handleEditTask}
                          isReadOnly={false}
                        />
                      ))}
                    </div>
                  )}

                  {/* Shared Boards */}
                  {sharedGroceryBoards.length > 0 && (
                    <div className="space-y-6">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Shared with Me
                      </h2>
                      {sharedGroceryBoards.map((board) => (
                        <GroceryListView
                          key={board.id}
                          board={board}
                          onEditTask={handleEditTask}
                          isReadOnly={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
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
