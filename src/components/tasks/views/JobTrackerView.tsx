import React from "react";
import { JobTrackerTable } from "./JobTrackerTable";
import { useTasks } from "../../../hooks/useTasksQueries";
import type { Task } from "../../../services/tasksService.types";
import type { StatusHistoryEntry } from "../../../services/tasksService.types";
import { Briefcase } from "lucide-react";
import EmptyState from "../../shared/common/EmptyState";

interface JobTrackerViewProps {
  boardId: string;
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const JobTrackerView: React.FC<JobTrackerViewProps> = ({
  boardId,
  onCreateTask,
  onEditTask,
  onDeleteTask,
}) => {
  const { data: tasks = [], isLoading } = useTasks(boardId);

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
    location_type:
      (task.item_data?.location_type as "Remote" | "Hybrid" | "In-Office") ||
      undefined,
    employment_type: (task.item_data?.employment_type as string) || undefined,
    date_applied:
      (task.item_data?.date_applied as string) || task.created_at.split("T")[0],
    job_description: (task.item_data?.job_description as string) || undefined,
    notes: (task.item_data?.notes as string) || task.description || undefined,
    status:
      (task.item_data?.status as string) ||
      (task.status === "todo"
        ? "Applied"
        : task.status === "in_progress"
        ? "Phone Screen"
        : task.status === "done"
        ? "Accepted"
        : "Applied"),
    status_history:
      (task.item_data?.status_history as StatusHistoryEntry[]) || undefined,
  }));

  const handleDelete = (taskId: string) => {
    onDeleteTask?.(taskId);
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
    <div className="px-2 sm:px-0">
      {jobApplications.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Add Your First Job Application"
          description="Track your job search progress. Paste a job posting URL or manually enter details."
          action={{
            label: "Add Job Application",
            onClick: onCreateTask,
          }}
        />
      ) : (
        <JobTrackerTable
          items={jobApplications}
          onEdit={(id) => {
            const task = tasks.find((t) => t.id === id);
            if (task) onEditTask(task);
          }}
          onDelete={handleDelete}
          onAdd={onCreateTask}
        />
      )}
    </div>
  );
};
