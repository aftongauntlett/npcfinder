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
import { useTheme } from "../../../hooks/useTheme";

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
  const { themeColor } = useTheme();

  const template = getTemplate("job_tracker");
  const statusOptions = template?.statusOptions || [];

  // Transform tasks to job applications
  const jobApplications = tasks.map((task) => ({
    id: task.id,
    company_name:
      (task.item_data?.company_name as string) ||
      task.title ||
      "Unknown Company",
    company_url: (task.item_data?.company_url as string) || undefined,
    position:
      (task.item_data?.position as string) || task.title || "Unknown Position",
    salary_range: (task.item_data?.salary_range as string) || undefined,
    location: (task.item_data?.location as string) || undefined,
    employment_type: (task.item_data?.employment_type as string) || undefined,
    date_applied:
      (task.item_data?.date_applied as string) || task.created_at.split("T")[0],
    notes: (task.item_data?.notes as string) || task.description || undefined,
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
        : newStatus === "Interviewing" ||
          [
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
      void deleteTask.mutateAsync(taskId).catch((error) => {
        console.error("Failed to delete task:", error);
        alert("Failed to delete task. Please try again.");
      });
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
    <div className="space-y-4 px-2 sm:px-0">
      {jobApplications.length === 0 ? (
        /* Empty State Card */
        <div
          onClick={onCreateTask}
          className="flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
          style={
            {
              "--hover-border-color": themeColor,
            } as React.CSSProperties
          }
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = themeColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "";
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: `${themeColor}20` }}
          >
            <Plus className="w-8 h-8" style={{ color: themeColor }} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Add Your First Job Application
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm">
            Track your job search progress. Paste a job posting URL or manually
            enter details.
          </p>
        </div>
      ) : (
        <>
          {/* Add Item Button */}
          <div className="flex justify-end">
            <Button
              onClick={onCreateTask}
              variant="action"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Add</span>
              <span className="sm:hidden">Add Item</span>
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
        </>
      )}
    </div>
  );
};
