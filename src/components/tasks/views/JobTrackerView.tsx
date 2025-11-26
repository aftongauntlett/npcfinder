import React from "react";
import { JobTrackerTable } from "./JobTrackerTable";
import {
  useTasks,
  useUpdateTask,
  useDeleteTask,
} from "../../../hooks/useTasksQueries";
import type { Task } from "../../../services/tasksService.types";
import { getTemplate } from "../../../utils/boardTemplates";
import { Plus } from "lucide-react";
import Button from "../../shared/ui/Button";

interface JobTrackerViewProps {
  boardId: string;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
}

export const JobTrackerView: React.FC<JobTrackerViewProps> = ({
  boardId,
  onCreateTask,
  onEditTask,
}) => {
  const { data: tasks = [], isLoading } = useTasks(boardId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const template = getTemplate("job_tracker");
  const statusOptions = template?.statusOptions || [];

  // Transform tasks to job applications
  const jobApplications = tasks.map((task) => ({
    id: task.id,
    company_name: (task.item_data?.company_name as string) || task.title,
    company_url: task.item_data?.company_url as string | undefined,
    position: task.item_data?.position as string | undefined,
    salary_range: task.item_data?.salary_range as string | undefined,
    date_applied:
      (task.item_data?.date_applied as string) || task.created_at.split("T")[0],
    notes: task.item_data?.notes as string | undefined,
    status:
      task.status === "todo"
        ? "Applied"
        : task.status === "in_progress"
        ? "Phone Screen"
        : task.status === "done"
        ? "Accepted"
        : "Applied",
  }));

  const handleStatusChange = (taskId: string, newStatus: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Map job tracker statuses back to system statuses
    const systemStatus =
      newStatus === "Accepted"
        ? "done"
        : newStatus === "Rejected" ||
          newStatus === "No Response" ||
          newStatus === "Declined"
        ? "archived"
        : [
            "Phone Screen",
            "Interview - Round 1",
            "Interview - Round 2",
            "Interview - Round 3",
            "Offer Received",
          ].includes(newStatus)
        ? "in_progress"
        : "todo";

    void updateTask.mutateAsync({
      taskId: taskId,
      updates: {
        status: systemStatus as Task["status"],
      },
    });
  };

  const handleDelete = (taskId: string) => {
    if (
      window.confirm("Are you sure you want to delete this job application?")
    ) {
      void deleteTask.mutateAsync(taskId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">
          Loading applications...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Item Button */}
      <div className="flex justify-end">
        <Button
          onClick={onCreateTask}
          variant="action"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
        >
          Add
        </Button>
      </div>

      {/* Job Tracker Table */}
      <JobTrackerTable
        items={jobApplications}
        onEdit={(id) => {
          const task = tasks.find((t) => t.id === id);
          if (task) onEditTask(task);
        }}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        statusOptions={statusOptions}
      />
    </div>
  );
};
