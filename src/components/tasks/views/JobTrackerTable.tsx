import React, { useState } from "react";
import { Pencil, ExternalLink, Trash2 } from "lucide-react";
import Button from "../../shared/ui/Button";

interface JobApplication {
  id: string;
  company_name: string;
  company_url?: string;
  position?: string;
  salary_range?: string;
  location?: string;
  employment_type?: string;
  date_applied: string;
  notes?: string;
  status: string;
}

interface JobTrackerTableProps {
  items: JobApplication[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  statusOptions: string[];
}

export const JobTrackerTable: React.FC<JobTrackerTableProps> = ({
  items,
  onEdit,
  onDelete,
  onStatusChange,
  statusOptions,
}) => {
  const [sortColumn, setSortColumn] = useState<keyof JobApplication | null>(
    "date_applied"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (column: keyof JobApplication) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sortColumn) return 0;

    const aVal = a[sortColumn] || "";
    const bVal = b[sortColumn] || "";

    if (sortColumn === "date_applied") {
      return sortDirection === "asc"
        ? new Date(aVal).getTime() - new Date(bVal).getTime()
        : new Date(bVal).getTime() - new Date(aVal).getTime();
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const SortIcon = ({ column }: { column: keyof JobApplication }) => {
    if (sortColumn !== column) {
      return (
        <span className="opacity-30 ml-1 inline-block w-3 text-xs">⇅</span>
      );
    }
    return (
      <span className="ml-1 inline-block w-3">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  // Helper function to get status badge styles
  const getStatusStyles = (status: string) => {
    const baseClasses =
      "px-3 py-1 rounded-full text-xs font-medium inline-flex items-center";

    if (status === "Applied") {
      return `${baseClasses} bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300`;
    } else if (
      [
        "Interviewing",
        "Phone Screen",
        "Interview - Round 1",
        "Interview - Round 2",
        "Interview - Round 3",
      ].includes(status)
    ) {
      return `${baseClasses} bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300`;
    } else if (["Rejected", "No Response", "Declined"].includes(status)) {
      return `${baseClasses} bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300`;
    } else if (status === "Accepted") {
      return `${baseClasses} bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300`;
    } else if (status === "Offer Received") {
      return `${baseClasses} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300`;
    }
    return `${baseClasses} bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300`;
  };

  // Quick status action buttons
  const quickStatusActions = ["Applied", "Interviewing", "Rejected"];

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      {sortedItems.length > 0 && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th
                  className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 w-[20%]"
                  onClick={() => handleSort("company_name")}
                >
                  Company
                  <SortIcon column="company_name" />
                </th>
                <th
                  className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 w-[20%]"
                  onClick={() => handleSort("position")}
                >
                  Position
                  <SortIcon column="position" />
                </th>
                <th
                  className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 w-[15%]"
                  onClick={() => handleSort("salary_range")}
                >
                  Salary
                  <SortIcon column="salary_range" />
                </th>
                <th
                  className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 w-[15%]"
                  onClick={() => handleSort("date_applied")}
                >
                  Dates
                  <SortIcon column="date_applied" />
                </th>
                <th
                  className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 w-[15%]"
                  onClick={() => handleSort("status")}
                >
                  Status
                  <SortIcon column="status" />
                </th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-200 w-[15%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8 text-gray-500 dark:text-gray-400"
                  >
                    No job applications yet. Click "Add Item" to get started.
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {item.company_name}
                        </span>
                        {item.company_url && (
                          <a
                            href={item.company_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {item.position || "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {item.salary_range || "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                      {formatDate(item.date_applied)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={getStatusStyles(item.status)}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="subtle"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item.id);
                          }}
                          className="h-8 w-8 p-0"
                          aria-label="Edit job application"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="subtle"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                          }}
                          className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          aria-label="Delete job application"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {sortedItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No job applications yet. Click "Add" to get started.
          </div>
        ) : (
          sortedItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onEdit(item.id)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 hover:border-purple-500 dark:hover:border-purple-400 transition-colors cursor-pointer"
            >
              {/* Company and Position */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {item.company_name}
                  </h3>
                  {item.company_url && (
                    <a
                      href={item.company_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                {item.position && (
                  <p className="text-gray-700 dark:text-gray-300">
                    {item.position}
                  </p>
                )}
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {item.salary_range && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Salary:
                    </span>
                    <p className="text-gray-700 dark:text-gray-300">
                      {item.salary_range}
                    </p>
                  </div>
                )}
                {item.location && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Location:
                    </span>
                    <p className="text-gray-700 dark:text-gray-300">
                      {item.location}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Applied:
                  </span>
                  <p className="text-gray-700 dark:text-gray-300">
                    {formatDate(item.date_applied)}
                  </p>
                </div>
                {item.employment_type && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Type:
                    </span>
                    <p className="text-gray-700 dark:text-gray-300">
                      {item.employment_type}
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Status Actions */}
              <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                {quickStatusActions.map((status) => (
                  <button
                    key={status}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange(item.id, status);
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      item.status === status
                        ? status === "Applied"
                          ? "bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white"
                          : status === "Interviewing"
                          ? "bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100"
                          : "bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <select
                  value={item.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    onStatusChange(item.id, e.target.value);
                  }}
                  className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
