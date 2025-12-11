import React from "react";
import { JobCard } from "../../shared/cards";
import type { StatusHistoryEntry } from "../../../services/tasksService.types";

interface JobApplication {
  id: string;
  company_name: string;
  company_url?: string;
  position?: string;
  salary_range?: string;
  location?: string;
  location_type?: "Remote" | "Hybrid" | "In-Office";
  employment_type?: string;
  date_applied: string;
  job_description?: string;
  notes?: string;
  status: string;
  status_history?: StatusHistoryEntry[];
}

interface JobTrackerTableProps {
  items: JobApplication[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const JobTrackerTable: React.FC<JobTrackerTableProps> = ({
  items,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="space-y-3">
      {/* Empty State */}
      {items.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
          <p className="text-gray-500 dark:text-gray-400">
            No job applications yet. Click "Add" to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <JobCard
              key={item.id}
              id={item.id}
              companyName={item.company_name}
              companyUrl={item.company_url}
              position={item.position || "No position specified"}
              status={item.status}
              dateApplied={item.date_applied}
              location={item.location}
              locationType={item.location_type}
              salaryRange={item.salary_range}
              employmentType={item.employment_type}
              statusHistory={item.status_history}
              jobDescription={item.job_description}
              notes={item.notes}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
