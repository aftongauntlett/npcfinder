/**
 * DashboardActivitySummary Component
 *
 * Displays task and board activity summaries on the dashboard.
 * Shows key metrics in StatCards and activity overview by board type.
 */

import React from "react";
import {
  AlertCircle,
  Calendar,
  Users,
  Briefcase,
  ChefHat,
  ShoppingCart,
  ListTodo,
  Columns,
  Inbox,
  CheckCircle2,
  Circle,
} from "lucide-react";
import AccordionListCard from "../shared/common/AccordionListCard";
import { Card } from "@/components/shared";
import { StatCard } from "./StatCard";
import type { useDashboardStats } from "@/hooks/useDashboardStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/queryKeys";

interface DashboardActivitySummaryProps {
  stats: ReturnType<typeof useDashboardStats>["data"];
  statsLoading: boolean;
}

interface Task {
  id: string;
  title: string;
  status: string;
  board_id: string;
  created_at: string;
}

/**
 * DashboardActivitySummary
 *
 * Displays task and board activity in two sections:
 * 1. Grid of StatCards showing key metrics (overdue, today, shared)
 * 2. Activity Overview with accordion cards for each board type
 */
export const DashboardActivitySummary: React.FC<
  DashboardActivitySummaryProps
> = ({ stats, statsLoading }) => {
  // Fetch tasks by template type
  const { data: taskBoards } = useQuery({
    queryKey: queryKeys.tasks.boards(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_boards_with_stats")
        .select("id, template_type")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!stats && !statsLoading,
  });

  // Helper function to fetch tasks for a specific template type
  const useTasksByTemplateType = (templateType: string) => {
    const boardIds = React.useMemo(() => {
      return (
        taskBoards
          ?.filter((b) => b.template_type === templateType)
          .map((b) => b.id) || []
      );
    }, [templateType]);

    return useQuery({
      queryKey: ["tasks", "by-template", templateType, boardIds],
      queryFn: async () => {
        if (boardIds.length === 0) return [];

        const { data, error } = await supabase
          .from("tasks")
          .select("id, title, status, board_id, created_at")
          .in("board_id", boardIds)
          .neq("status", "archived")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        return data || [];
      },
      enabled: boardIds.length > 0,
    });
  };

  const { data: jobTasks = [] } = useTasksByTemplateType("job_tracker");
  const { data: recipeTasks = [] } = useTasksByTemplateType("recipe");
  const { data: groceryTasks = [] } = useTasksByTemplateType("grocery");
  const { data: todoTasks = [] } = useTasksByTemplateType("markdown");
  const { data: kanbanTasks = [] } = useTasksByTemplateType("kanban");

  // Task list renderer
  const renderTaskList = (tasks: Task[], emptyMessage: string) => {
    if (tasks.length === 0) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          {emptyMessage}
        </p>
      );
    }

    return (
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-start gap-2">
            {task.status === "done" ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
            )}
            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
              {task.title}
            </span>
          </li>
        ))}
      </ul>
    );
  };
  if (statsLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow-sm">
        <p className="text-gray-600 dark:text-gray-400 text-center">
          Loading activity summary...
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow-sm">
        <p className="text-gray-600 dark:text-gray-400 text-center">
          Unable to load dashboard statistics.
        </p>
      </div>
    );
  }

  const hasAnyActivity =
    stats.totalBoards > 0 ||
    stats.totalTasks > 0 ||
    stats.sharedBoardsCount > 0;

  if (!hasAnyActivity) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow-sm">
        <div className="text-center">
          <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Activity Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start organizing your tasks by creating your first board!
          </p>
          <a
            href="/tasks"
            className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            Go to Tasks
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid - 3 cards matching media card design */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          title="Overdue"
          count={stats.overdueTasks}
          hoverCount={stats.overdueTasks}
          icon={AlertCircle}
          accentColor="pink"
          label="Tasks"
          hoverLabel="Tasks"
        />
        <StatCard
          title="Today"
          count={stats.todayTasks}
          hoverCount={stats.todayTasks}
          icon={Calendar}
          accentColor="blue"
          label="Tasks"
          hoverLabel="Tasks"
        />
        <StatCard
          title="Shared"
          count={stats.sharedBoardsCount}
          hoverCount={stats.sharedBoardsCount}
          icon={Users}
          accentColor="emerald"
          label="Boards"
          hoverLabel="Boards"
        />
      </div>

      {/* Activity Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Activity Overview
        </h2>
        <div className="space-y-3">
          {/* Job Applications */}
          {stats.jobTasksCount > 0 && (
            <AccordionListCard
              expandedContent={
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Track your job search progress, application deadlines, and
                    interview schedules.
                  </p>
                  {renderTaskList(
                    jobTasks,
                    "Add job application tasks to see them here."
                  )}
                </div>
              }
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Job Application Tasks
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.jobTasksCount}{" "}
                    {stats.jobTasksCount === 1 ? "task" : "tasks"}
                  </p>
                </div>
              </div>
            </AccordionListCard>
          )}

          {/* Recipes */}
          {stats.recipeTasksCount > 0 && (
            <AccordionListCard
              expandedContent={
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Save and organize your favorite recipes, meal plans, and
                    cooking ideas.
                  </p>
                  {renderTaskList(recipeTasks, "Add recipes to see them here.")}
                </div>
              }
            >
              <div className="flex items-center gap-3">
                <ChefHat className="w-5 h-5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Recipe Tasks
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.recipeTasksCount}{" "}
                    {stats.recipeTasksCount === 1 ? "recipe" : "recipes"}
                  </p>
                </div>
              </div>
            </AccordionListCard>
          )}

          {/* Grocery Lists */}
          {stats.groceryTasksCount > 0 && (
            <AccordionListCard
              expandedContent={
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Keep track of shopping items and grocery needs.
                  </p>
                  {renderTaskList(
                    groceryTasks,
                    "Add grocery items to see them here."
                  )}
                </div>
              }
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Grocery Items
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.groceryTasksCount}{" "}
                    {stats.groceryTasksCount === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
            </AccordionListCard>
          )}

          {/* To-Do Lists */}
          {stats.todoTasksCount > 0 && (
            <AccordionListCard
              expandedContent={
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Manage daily tasks and personal to-do items.
                  </p>
                  {renderTaskList(
                    todoTasks,
                    "Add to-do items to see them here."
                  )}
                </div>
              }
            >
              <div className="flex items-center gap-3">
                <ListTodo className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    To-Do Tasks
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.todoTasksCount}{" "}
                    {stats.todoTasksCount === 1 ? "task" : "tasks"}
                  </p>
                </div>
              </div>
            </AccordionListCard>
          )}

          {/* Kanban Boards */}
          {stats.kanbanTasksCount > 0 && (
            <AccordionListCard
              expandedContent={
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Organize projects and workflows with custom kanban boards.
                  </p>
                  {renderTaskList(
                    kanbanTasks,
                    "Add kanban tasks to see them here."
                  )}
                </div>
              }
            >
              <div className="flex items-center gap-3">
                <Columns className="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Kanban Tasks
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.kanbanTasksCount}{" "}
                    {stats.kanbanTasksCount === 1 ? "task" : "tasks"}
                  </p>
                </div>
              </div>
            </AccordionListCard>
          )}

          {/* Show message if no activity cards to display */}
          {stats.jobTasksCount === 0 &&
            stats.recipeTasksCount === 0 &&
            stats.groceryTasksCount === 0 &&
            stats.todoTasksCount === 0 &&
            stats.kanbanTasksCount === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  No tasks yet. Create boards and add tasks to see your activity
                  here.
                </p>
              </div>
            )}
        </div>
      </Card>
    </div>
  );
};
