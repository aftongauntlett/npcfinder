import React, { useState, useMemo, useEffect } from "react";
import { JobCard } from "../../shared/cards";
import FilterSortMenu from "../../shared/common/FilterSortMenu";
import type { FilterSortSection } from "../../shared/common/FilterSortMenu";
import Button from "../../shared/ui/Button";
import { Plus } from "lucide-react";
import type { StatusHistoryEntry } from "../../../services/tasksService.types";
import {
  getPersistedFilters,
  persistFilters,
} from "../../../utils/persistenceUtils";

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
  onAdd: () => void;
}

export const JobTrackerTable: React.FC<JobTrackerTableProps> = ({
  items,
  onEdit,
  onDelete,
  onAdd,
}) => {
  // Load persisted filter state
  const persistenceKey = "job-tracker-filters";
  const persistedFilters = getPersistedFilters(persistenceKey, {
    activeSort: "date-newest",
    statusFilters: ["all"],
  });

  const [activeSort, setActiveSort] = useState<string>(
    persistedFilters.activeSort as string
  );
  const [statusFilters, setStatusFilters] = useState<string[]>(
    persistedFilters.statusFilters as string[]
  );

  // Persist filter changes
  useEffect(() => {
    persistFilters(persistenceKey, {
      activeSort,
      statusFilters,
    });
  }, [activeSort, statusFilters]);

  // Extract unique statuses
  const availableStatuses = useMemo(() => {
    const statusSet = new Set<string>();
    items.forEach((item) => {
      if (item.status) {
        statusSet.add(item.status);
      }
    });
    return Array.from(statusSet).sort();
  }, [items]);

  // Filter items by status
  const filteredItems = useMemo(() => {
    if (statusFilters.includes("all") || statusFilters.length === 0) {
      return items;
    }
    return items.filter((item) => statusFilters.includes(item.status));
  }, [items, statusFilters]);

  // Sort filtered items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (activeSort) {
      case "date-newest":
        return (
          new Date(b.date_applied).getTime() -
          new Date(a.date_applied).getTime()
        );
      case "date-oldest":
        return (
          new Date(a.date_applied).getTime() -
          new Date(b.date_applied).getTime()
        );
      case "company-asc":
        return a.company_name.localeCompare(b.company_name);
      case "company-desc":
        return b.company_name.localeCompare(a.company_name);
      case "position-asc":
        return (a.position || "").localeCompare(b.position || "");
      case "position-desc":
        return (b.position || "").localeCompare(a.position || "");
      case "status-asc":
        return a.status.localeCompare(b.status);
      case "status-desc":
        return b.status.localeCompare(a.status);
      default:
        return 0;
    }
  });

  const filterSortSections: FilterSortSection[] = [
    {
      id: "status",
      title: "STATUS",
      options: [
        { id: "all", label: "All Statuses" },
        ...availableStatuses.map((status) => ({
          id: status,
          label: status,
        })),
      ],
      multiSelect: true,
    },
    {
      id: "sort",
      title: "SORT BY",
      options: [
        { id: "date-newest", label: "Date (Newest)" },
        { id: "date-oldest", label: "Date (Oldest)" },
        { id: "company-asc", label: "Company (A-Z)" },
        { id: "company-desc", label: "Company (Z-A)" },
        { id: "position-asc", label: "Position (A-Z)" },
        { id: "position-desc", label: "Position (Z-A)" },
        { id: "status-asc", label: "Status (A-Z)" },
        { id: "status-desc", label: "Status (Z-A)" },
      ],
      multiSelect: false,
    },
  ];

  const handleFilterChange = (sectionId: string, value: string | string[]) => {
    if (sectionId === "status") {
      const statuses = Array.isArray(value) ? value : [value];
      setStatusFilters(statuses);
    } else if (sectionId === "sort") {
      setActiveSort(value as string);
    }
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {sortedItems.length > 0 && (
        <div className="flex flex-nowrap items-center justify-between gap-3">
          <FilterSortMenu
            sections={filterSortSections}
            activeFilters={{
              status: statusFilters,
              sort: activeSort,
            }}
            onFilterChange={handleFilterChange}
            label="Sort & Filter"
          />

          <Button
            onClick={onAdd}
            variant="action"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
          >
            Add
          </Button>
        </div>
      )}

      {/* Empty State */}
      {sortedItems.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
          <p className="text-gray-500 dark:text-gray-400">
            No job applications yet. Click "Add" to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((item) => (
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
