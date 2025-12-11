import React, { useRef, useState, useMemo, useEffect } from "react";
import { JobTrackerTable } from "./JobTrackerTable";
import { Pagination } from "../../shared/common/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { useUrlPaginationState } from "../../../hooks/useUrlPaginationState";
import { useTasks } from "../../../hooks/useTasksQueries";
import type { Task } from "../../../services/tasksService.types";
import type { StatusHistoryEntry } from "../../../services/tasksService.types";
import { Briefcase } from "lucide-react";
import { EmptyStateAddCard, LocalSearchInput } from "../../shared";
import FilterSortMenu from "../../shared/common/FilterSortMenu";
import type { FilterSortSection } from "../../shared/common/FilterSortMenu";
import {
  getPersistedFilters,
  persistFilters,
} from "../../../utils/persistenceUtils";

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
  const listTopRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

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
    status: (task.item_data?.status as string) || "Applied",
    status_history:
      (task.item_data?.status_history as StatusHistoryEntry[]) || undefined,
  }));

  // Extract unique statuses
  const availableStatuses = useMemo(() => {
    const statusSet = new Set<string>();
    jobApplications.forEach((item) => {
      if (item.status) {
        statusSet.add(item.status);
      }
    });
    return Array.from(statusSet).sort();
  }, [jobApplications]);

  // Filter by status first
  const statusFilteredJobs = useMemo(() => {
    if (statusFilters.includes("all") || statusFilters.length === 0) {
      return jobApplications;
    }
    return jobApplications.filter((item) => statusFilters.includes(item.status));
  }, [jobApplications, statusFilters]);

  // Then filter by search query
  const searchFilteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return statusFilteredJobs;

    const query = searchQuery.toLowerCase();
    return statusFilteredJobs.filter((job) => {
      const matchesCompany = job.company_name.toLowerCase().includes(query);
      const matchesPosition = job.position.toLowerCase().includes(query);
      return matchesCompany || matchesPosition;
    });
  }, [statusFilteredJobs, searchQuery]);

  // Finally sort
  const filteredJobApplications = useMemo(() => {
    const sorted = [...searchFilteredJobs];
    switch (activeSort) {
      case "date-newest":
        return sorted.sort(
          (a, b) =>
            new Date(b.date_applied).getTime() -
            new Date(a.date_applied).getTime()
        );
      case "date-oldest":
        return sorted.sort(
          (a, b) =>
            new Date(a.date_applied).getTime() -
            new Date(b.date_applied).getTime()
        );
      case "company-asc":
        return sorted.sort((a, b) => a.company_name.localeCompare(b.company_name));
      case "company-desc":
        return sorted.sort((a, b) => b.company_name.localeCompare(a.company_name));
      case "position-asc":
        return sorted.sort((a, b) => (a.position || "").localeCompare(b.position || ""));
      case "position-desc":
        return sorted.sort((a, b) => (b.position || "").localeCompare(a.position || ""));
      case "status-asc":
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      case "status-desc":
        return sorted.sort((a, b) => b.status.localeCompare(a.status));
      default:
        return sorted;
    }
  }, [searchFilteredJobs, activeSort]);

  // Filter sections for FilterSortMenu
  const filterSortSections: FilterSortSection[] = useMemo(
    () => [
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
    ],
    [availableStatuses]
  );

  const handleFilterChange = (sectionId: string, value: string | string[]) => {
    if (sectionId === "status") {
      const statuses = Array.isArray(value) ? value : [value];
      setStatusFilters(statuses);
    } else if (sectionId === "sort") {
      setActiveSort(value as string);
    }
  };

  // URL-based pagination state
  const { page, perPage, setPage, setPerPage } = useUrlPaginationState(1, 10);

  // Pagination with URL state for bookmarkable pages
  const pagination = usePagination({
    items: filteredJobApplications,
    initialPage: page,
    initialItemsPerPage: perPage,
    persistenceKey: "tasks-job-tracker",
    onPageChange: setPage,
    onItemsPerPageChange: setPerPage,
  });

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
        <EmptyStateAddCard
          icon={Briefcase}
          title="Add Your First Job Application"
          description="Track your job search progress. Paste a job posting URL or manually enter details."
          onClick={onCreateTask}
          ariaLabel="Add your first job application"
        />
      ) : (
        <>
          {/* Header with Search */}
          <div ref={listTopRef} className="flex items-center gap-3 mb-4">
            <div className="flex-1 max-w-md">
              <LocalSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search Jobs..."
                filterButton={
                  <FilterSortMenu
                    sections={filterSortSections}
                    activeFilters={{
                      status: statusFilters,
                      sort: activeSort,
                    }}
                    onFilterChange={handleFilterChange}
                    label=""
                  />
                }
              />
            </div>
          </div>

          <JobTrackerTable
            items={pagination.paginatedItems}
            onEdit={(id) => {
              const task = tasks.find((t) => t.id === id);
              if (task) onEditTask(task);
            }}
            onDelete={handleDelete}
            onAdd={onCreateTask}
            hideFilterSort
          />

          {/* Pagination */}
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.filteredItems.length}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={(page) => {
              pagination.goToPage(page);
              listTopRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            onItemsPerPageChange={(count) => {
              pagination.setItemsPerPage(count);
              listTopRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </>
      )}
    </div>
  );
};
