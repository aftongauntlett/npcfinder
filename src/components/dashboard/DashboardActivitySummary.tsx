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
  LayoutGrid,
  Users,
  Briefcase,
  ChefHat,
  ShoppingCart,
  ListTodo,
  Columns,
} from "lucide-react";
import StatCard from "../shared/common/StatCard";
import AccordionListCard from "../shared/common/AccordionListCard";
import { Card } from "@/components/shared";
import type { useDashboardStats } from "@/hooks/useDashboardStats";

interface DashboardActivitySummaryProps {
  stats: ReturnType<typeof useDashboardStats>["data"];
  statsLoading: boolean;
}

/**
 * DashboardActivitySummary
 *
 * Displays task and board activity in two sections:
 * 1. Grid of StatCards showing key metrics (overdue, today, total boards, shared)
 * 2. Activity Overview with accordion cards for each board type
 */
export const DashboardActivitySummary: React.FC<
  DashboardActivitySummaryProps
> = ({ stats, statsLoading }) => {
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
          <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
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
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertCircle}
          label="Overdue Tasks"
          value={stats.overdueTasks}
          iconColor="text-red-400"
          valueColor={
            stats.overdueTasks > 0
              ? "text-red-500 dark:text-red-400"
              : "text-white dark:text-white"
          }
        />
        <StatCard
          icon={Calendar}
          label="Today's Tasks"
          value={stats.todayTasks}
          iconColor="text-blue-400"
          valueColor="text-white dark:text-white"
        />
        <StatCard
          icon={LayoutGrid}
          label="Total Boards"
          value={stats.totalBoards}
          iconColor="text-purple-400"
          valueColor="text-white dark:text-white"
        />
        <StatCard
          icon={Users}
          label="Shared Boards"
          value={stats.sharedBoardsCount}
          iconColor="text-green-400"
          valueColor="text-white dark:text-white"
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track your job search progress, application deadlines, and
                    interview schedules.
                  </p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Save and organize your favorite recipes, meal plans, and
                    cooking ideas.
                  </p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Keep track of shopping items and grocery needs.
                  </p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage daily tasks and personal to-do items.
                  </p>
                </div>
              }
            >
              <div className="flex items-center gap-3">
                <ListTodo className="w-5 h-5 text-purple-500 dark:text-purple-400 flex-shrink-0" />
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Organize projects and workflows with custom kanban boards.
                  </p>
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
