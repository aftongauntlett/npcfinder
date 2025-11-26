/**
 * Task Navigation Sidebar
 *
 * Left pane navigation for Tasks page
 * Contains Smart Views and Board list
 */

import React, { useState } from "react";
import { Inbox, Calendar, CalendarClock, Plus } from "lucide-react";
import Input from "../shared/ui/Input";
import { useBoards, useCreateTask } from "../../hooks/useTasksQueries";

type ViewType =
  | "inbox"
  | "today"
  | "upcoming"
  | { type: "board"; boardId: string };

interface TaskNavigationProps {
  selectedView: ViewType;
  onViewChange: (view: ViewType) => void;
  onCreateBoard: () => void;
}

const TaskNavigation: React.FC<TaskNavigationProps> = ({
  selectedView,
  onViewChange,
  onCreateBoard,
}) => {
  const { data: boards = [] } = useBoards();
  const createTask = useCreateTask();
  const [quickAddValue, setQuickAddValue] = useState("");

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddValue.trim()) return;

    // Create task in Inbox (no board_id)
    void createTask
      .mutateAsync({
        title: quickAddValue.trim(),
        board_id: null,
      })
      .then(() => {
        setQuickAddValue("");
        // Switch to inbox view if not already there
        if (selectedView !== "inbox") {
          onViewChange("inbox");
        }
      })
      .catch((error) => {
        console.error("Failed to create quick task:", error);
      });
  };

  const isViewSelected = (view: ViewType): boolean => {
    if (typeof view === "string" && typeof selectedView === "string") {
      return view === selectedView;
    }
    if (
      typeof view === "object" &&
      typeof selectedView === "object" &&
      "boardId" in view &&
      "boardId" in selectedView
    ) {
      return view.boardId === selectedView.boardId;
    }
    return false;
  };

  return (
    <div className="w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Quick Add Task */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <form onSubmit={handleQuickAdd}>
          <Input
            type="text"
            value={quickAddValue}
            onChange={(e) => setQuickAddValue(e.target.value)}
            placeholder="Quick add task..."
          />
        </form>
      </div>

      {/* Smart Views */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Smart Views
        </h3>
        <nav className="space-y-1">
          <button
            onClick={() => onViewChange("inbox")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isViewSelected("inbox")
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Inbox</span>
          </button>

          <button
            onClick={() => onViewChange("today")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isViewSelected("today")
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Today</span>
          </button>

          <button
            onClick={() => onViewChange("upcoming")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isViewSelected("upcoming")
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            }`}
          >
            <CalendarClock className="w-4 h-4" />
            <span>Upcoming</span>
          </button>
        </nav>
      </div>

      {/* Boards */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Boards
          </h3>
          <button
            onClick={onCreateBoard}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Create board"
          >
            <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <nav className="space-y-1">
          {boards.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2">
              No boards yet
            </p>
          ) : (
            boards.map((board) => {
              const viewObj: ViewType = { type: "board", boardId: board.id };
              const isSelected = isViewSelected(viewObj);

              return (
                <button
                  key={board.id}
                  onClick={() => onViewChange(viewObj)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  }`}
                >
                  {board.icon && (
                    <span className="text-base">{board.icon}</span>
                  )}
                  <span className="flex-1 text-left truncate">
                    {board.name}
                  </span>
                  {board.total_tasks > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {board.total_tasks}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </nav>
      </div>
    </div>
  );
};

export default TaskNavigation;
