import React, { useState } from "react";
import { Pencil, ExternalLink, Trash2 } from "lucide-react";
import Button from "../../shared/ui/Button";

interface JobApplication {
  id: string;
  company_name: string;
  company_url?: string;
  position?: string;
  salary_range?: string;
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th
              className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
              onClick={() => handleSort("company_name")}
            >
              Company
              <SortIcon column="company_name" />
            </th>
            <th
              className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
              onClick={() => handleSort("position")}
            >
              Position
              <SortIcon column="position" />
            </th>
            <th
              className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
              onClick={() => handleSort("salary_range")}
            >
              Salary
              <SortIcon column="salary_range" />
            </th>
            <th
              className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
              onClick={() => handleSort("date_applied")}
            >
              Date Applied
              <SortIcon column="date_applied" />
            </th>
            <th
              className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
              onClick={() => handleSort("status")}
            >
              Status
              <SortIcon column="status" />
            </th>
            <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700 dark:text-gray-200">
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
                  <select
                    value={item.status}
                    onChange={(e) => onStatusChange(item.id, e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium
                      bg-white dark:bg-gray-800
                      border border-gray-200 dark:border-gray-700
                      text-gray-700 dark:text-gray-300
                      hover:border-purple-300 dark:hover:border-purple-600
                      focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                      cursor-pointer transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => onEdit(item.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => onDelete(item.id)}
                      className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
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
  );
};
