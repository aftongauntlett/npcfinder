/**
 * To-Do Lists Page
 *
 * Simple, flexible lists for one-off tasks like packing, shopping, or quick checklists
 */

import React, { useState, useMemo } from "react";
import AppLayout from "../../layouts/AppLayout";
import TemplateView from "./TemplateView";
import CreateTaskModal from "../../tasks/CreateTaskModal";
import TaskDetailModal from "../../tasks/TaskDetailModal";
import { useBoards, useTasks } from "../../../hooks/useTasksQueries";

const TodoPage: React.FC = () => {
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

  return (
    <AppLayout
      title="To-Do Lists"
      description="Simple, flexible lists for one-off tasks like packing, shopping, or quick checklists"
    >
      <TemplateView
        templateType="markdown"
        boards={todoBoards}
        onCreateTask={handleCreateTask}
        onEditTask={handleEditTask}
      />

      {/* Modals */}
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

export default TodoPage;
