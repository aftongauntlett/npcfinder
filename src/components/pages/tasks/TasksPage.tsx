/**
 * Tasks Page
 *
 * Horizontal tab layout with:
 * - Tasks (unassigned) + Boards tabs + Dynamic board tabs
 * - Content area (selected view)
 */

import React, { useState, useMemo } from "react";
import { ListChecks, LayoutGrid } from "lucide-react";
import AppLayout from "../../layouts/AppLayout";
import InboxView from "./InboxView";
import BoardsView from "./BoardsView";
import BoardContentView from "./BoardContentView";
import CreateTaskModal from "../../tasks/CreateTaskModal";
import TaskDetailModal from "../../tasks/TaskDetailModal";
import { useBoards, useTasks } from "../../../hooks/useTasksQueries";
import { useIsMobile } from "../../../hooks/useIsMobile";

type ViewType = "tasks" | "boards" | { type: "board"; boardId: string };

// Maximum number of board tabs that can be open at once
const MAX_OPEN_BOARDS = 5;

/**
 * Tasks Page
 *
 * Features:
 * - Tasks: Unassigned tasks (no board)
 * - Boards: Overview of all boards
 * - Individual boards: Dynamic tabs for each opened board
 */
const TasksPage: React.FC = () => {
  const [selectedView, setSelectedView] = useState<ViewType>("tasks");
  const [openBoardIds, setOpenBoardIds] = useState<string[]>([]);
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
  const isMobile = useIsMobile();

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
    if (typeof selectedView === "string") {
      return selectedView === "tasks" ? "Tasks" : "Boards";
    }
    const board = boards.find((b) => b.id === selectedView.boardId);
    return board?.name || "Board";
  }, [selectedView, boards]);

  // Build tabs array: Tasks + Boards + Open Board Tabs
  const tabs = useMemo(() => {
    const baseTabs = [
      {
        id: "tasks",
        label: "Tasks",
        icon: ListChecks,
      },
      {
        id: "boards",
        label: "Boards",
        icon: LayoutGrid,
        badge: boards.length > 0 ? boards.length : undefined,
      },
    ];

    // On mobile, skip dynamic board tabs
    if (isMobile) {
      return baseTabs;
    }

    // Add tabs for open boards (desktop only)
    const boardTabs = openBoardIds.map((boardId) => {
      const board = boards.find((b) => b.id === boardId);
      return {
        id: `board-${boardId}`,
        label: board?.name || "Board",
        closeable: true,
      };
    });

    return [...baseTabs, ...boardTabs];
  }, [boards, openBoardIds, isMobile]);

  // Get active tab ID from selectedView
  const activeTabId = useMemo(() => {
    if (typeof selectedView === "string") {
      return selectedView;
    }
    return `board-${selectedView.boardId}`;
  }, [selectedView]);

  // Handle board selection - opens new tab (desktop) or navigates (mobile handled in BoardsView)
  const handleSelectBoard = (boardId: string) => {
    // Skip tab management on mobile
    if (isMobile) {
      setSelectedView({ type: "board", boardId });
      return;
    }

    if (!openBoardIds.includes(boardId)) {
      let updatedBoardIds = [...openBoardIds, boardId];

      // If we exceed max tabs, remove the oldest (first) board tab
      if (updatedBoardIds.length > MAX_OPEN_BOARDS) {
        updatedBoardIds = updatedBoardIds.slice(1);
      }

      setOpenBoardIds(updatedBoardIds);
    }
    setSelectedView({ type: "board", boardId });
  };

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
    if (tabId === "tasks") {
      setSelectedView("tasks");
    } else if (tabId === "boards") {
      setSelectedView("boards");
    } else if (tabId.startsWith("board-")) {
      const boardId = tabId.replace("board-", "");
      setSelectedView({ type: "board", boardId });
    }
  };

  // Handle tab close
  const handleCloseTab = (tabId: string) => {
    if (tabId.startsWith("board-")) {
      const boardId = tabId.replace("board-", "");
      setOpenBoardIds(openBoardIds.filter((id) => id !== boardId));

      // If closing active tab, switch to boards view
      if (
        typeof selectedView === "object" &&
        selectedView.boardId === boardId
      ) {
        setSelectedView("boards");
      }
    }
  };

  return (
    <AppLayout
      title={pageTitle}
      description="Quick access to one-off tasks and to-dos. Use boards for organized projects and workflows."
      tabs={tabs}
      activeTab={activeTabId}
      onTabChange={handleTabChange}
      onTabClose={handleCloseTab}
    >
      {/* Content */}
      <div role="tabpanel" id={`${activeTabId}-panel`}>
        {selectedView === "tasks" && <InboxView />}
        {selectedView === "boards" && (
          <BoardsView
            onSelectBoard={handleSelectBoard}
            onCreateTask={handleCreateTask}
            onEditTask={handleEditTask}
            isMobile={isMobile}
          />
        )}
        {typeof selectedView === "object" && selectedView.type === "board" && (
          <BoardContentView boardId={selectedView.boardId} />
        )}
      </div>

      {/* Modals */}
      {showCreateTask && (
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
      )}

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
