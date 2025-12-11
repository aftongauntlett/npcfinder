import React, { useRef, useState, useMemo, useEffect } from "react";
import { JobTrackerTable } from "./JobTrackerTable";
import { Pagination } from "../../shared/common/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import { useUrlPaginationState } from "../../../hooks/useUrlPaginationState";
import { useTasks } from "../../../hooks/useTasksQueries";
import type { Task } from "../../../services/tasksService.types";
import type { StatusHistoryEntry } from "../../../services/tasksService.types";
import { Briefcase } from "lucide-react";
import { EmptyStateAddCard, AccordionToolbar } from "../../shared";
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
  const [collapseKey, setCollapseKey] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Load persisted filter state
  const persistenceKey = "job-tracker-filters";
  const persistedFilters = getPersistedFilters(persistenceKey, {
    activeSort: "date-applied-newest",
    statusFilters: ["all"],
    locationFilters: ["all"],
  });

  const [activeSort, setActiveSort] = useState<string>(
    persistedFilters.activeSort as string
  );
  const [statusFilters, setStatusFilters] = useState<string[]>(
    persistedFilters.statusFilters as string[]
  );
  const [locationFilters, setLocationFilters] = useState<string[]>(
    persistedFilters.locationFilters as string[]
  );

  // Persist filter changes
  useEffect(() => {
    persistFilters(persistenceKey, {
      activeSort,
      statusFilters,
      locationFilters,
    });
  }, [activeSort, statusFilters, locationFilters]);

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

  // Extract unique location types
  const availableLocationTypes = useMemo(() => {
    const locationSet = new Set<string>();
    jobApplications.forEach((item) => {
      if (item.location_type) {
        locationSet.add(item.location_type);
      }
    });
    return Array.from(locationSet).sort();
  }, [jobApplications]);

  // Filter by status first
  const statusFilteredJobs = useMemo(() => {
    if (statusFilters.includes("all") || statusFilters.length === 0) {
      return jobApplications;
    }
    return jobApplications.filter((item) => statusFilters.includes(item.status));
  }, [jobApplications, statusFilters]);

  // Then filter by location type
  const locationFilteredJobs = useMemo(() => {
    if (locationFilters.includes("all") || locationFilters.length === 0) {
      return statusFilteredJobs;
    }
    return statusFilteredJobs.filter((item) => 
      item.location_type && locationFilters.includes(item.location_type)
    );
  }, [statusFilteredJobs, locationFilters]);

  // Then filter by search query
  const searchFilteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return locationFilteredJobs;

    const query = searchQuery.toLowerCase();
    return locationFilteredJobs.filter((job) => {
      const matchesCompany = job.company_name.toLowerCase().includes(query);
      const matchesPosition = job.position.toLowerCase().includes(query);
      return matchesCompany || matchesPosition;
    });
  }, [locationFilteredJobs, searchQuery]);

  // Finally sort
  const filteredJobApplications = useMemo(() => {
    const sorted = [...searchFilteredJobs];
    switch (activeSort) {
      case "date-applied-newest":
        return sorted.sort(
          (a, b) =>
            new Date(b.date_applied).getTime() -
            new Date(a.date_applied).getTime()
        );
      case "date-applied-oldest":
        return sorted.sort(
          (a, b) =>
            new Date(a.date_applied).getTime() -
            new Date(b.date_applied).getTime()
        );
      case "name-asc":
        return sorted.sort((a, b) => a.company_name.localeCompare(b.company_name));
      case "name-desc":
        return sorted.sort((a, b) => b.company_name.localeCompare(a.company_name));
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
        id: "location",
        title: "LOCATION",
        options: [
          { id: "all", label: "All Locations" },
          ...availableLocationTypes.map((locationType) => ({
            id: locationType,
            label: locationType,
          })),
        ],
        multiSelect: true,
      },
      {
        id: "sort",
        title: "SORT BY",
        options: [
          { id: "date-applied-newest", label: "Date Applied (Newest)" },
          { id: "date-applied-oldest", label: "Date Applied (Oldest)" },
          { id: "name-asc", label: "Name (A-Z)" },
          { id: "name-desc", label: "Name (Z-A)" },
        ],
        multiSelect: false,
      },
    ],
    [availableStatuses, availableLocationTypes]
  );

  const handleFilterChange = (sectionId: string, value: string | string[]) => {
    if (sectionId === "status") {
      const statuses = Array.isArray(value) ? value : [value];
      setStatusFilters(statuses);
    } else if (sectionId === "location") {
      const locations = Array.isArray(value) ? value : [value];
      setLocationFilters(locations);
    } else if (sectionId === "sort") {
      setActiveSort(value as string);
    }
  };

  // Collapse all handler - increments key to force re-render with default collapsed state
  const handleCollapseAll = () => {
    setCollapseKey(prev => prev + 1);
    setExpandedItems(new Set()); // Clear all expanded items
  };

  // Track expansion changes
  const handleExpandChange = (id: string, isExpanded: boolean) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (isExpanded) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
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
          {/* Toolbar with Search, Collapse All, and Add Button */}
          <div ref={listTopRef}>
            <AccordionToolbar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search Jobs..."
              filterSortSections={filterSortSections}
              activeFilters={{
                status: statusFilters,
                location: locationFilters,
                sort: activeSort,
              }}
              onFilterChange={handleFilterChange}
              onCollapseAll={handleCollapseAll}
              hasExpandedItems={expandedItems.size > 0}
              onActionClick={onCreateTask}
              actionLabel="Add"
            />
          </div>

          <JobTrackerTable
            items={pagination.paginatedItems}
            onEdit={(id) => {
              const task = tasks.find((t) => t.id === id);
              if (task) onEditTask(task);
            }}
            onDelete={handleDelete}
            collapseKey={collapseKey}
            onExpandChange={handleExpandChange}
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
