import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AccordionListCard from "../common/AccordionListCard";
import { ExternalLink } from "lucide-react";

interface JobCardProps {
  id: string;
  companyName: string;
  companyUrl?: string;
  position: string;
  status: string;
  dateApplied: string;
  location?: string;
  locationType?: "Remote" | "Hybrid" | "In-Office";
  salaryRange?: string;
  employmentType?: string;
  statusHistory?: Array<{ status: string; date: string }>;
  jobDescription?: string;
  notes?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isExpanded?: boolean; // Controlled expansion state
  onExpandChange?: (isExpanded: boolean) => void; // Callback when expand state changes
}

/**
 * JobCard - Specialized card component for job applications
 * Uses AccordionListCard for consistent accordion pattern
 */
const JobCard: React.FC<JobCardProps> = ({
  id,
  companyName,
  companyUrl,
  position,
  status,
  dateApplied,
  salaryRange,
  statusHistory,
  jobDescription,
  notes,
  onEdit,
  onDelete,
  isExpanded,
  onExpandChange,
}) => {
  const hasNotes = notes && notes.trim().length > 0;
  const hasDescription = jobDescription && jobDescription.trim().length > 0;

  // Get status chip color based on status value
  const getStatusChipColor = (statusValue: string): string => {
    const normalizedStatus = statusValue.toLowerCase();
    
    if (normalizedStatus === "applied") {
      return "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600";
    } else if (normalizedStatus === "rejected") {
      return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
    } else if (normalizedStatus === "interview") {
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
    } else if (normalizedStatus === "no response") {
      return "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
    } else if (normalizedStatus === "declined") {
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
    } else if (normalizedStatus === "accepted") {
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
    }
    
    // Default color for any other status
    return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
  };

  // Build job chips (status chips for header)
  const jobChips: Array<{ key: string; label: string; className: string }> = [
    {
      key: "status",
      label: status,
      className: getStatusChipColor(status),
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatStatusHistory = () => {
    if (!statusHistory || statusHistory.length === 0) return null;

    return statusHistory
      .slice(0, 3)
      .map((entry) => `${entry.status} (${formatDate(entry.date)})`)
      .join(" → ");
  };

  // Header content (always visible)
  const headerContent = (
    <div>
      {/* Title row with company name: job title and chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-gray-900 dark:text-white">
          <span className="font-semibold text-primary dark:text-primary-light">{companyName}:</span> {position}
        </h3>
        {companyUrl && (
          <a
            href={companyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:opacity-80 transition-opacity flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
            aria-label="Visit company website"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        {/* Chips (collapsed on mobile: show 1 + +n) */}
        {jobChips.length > 0 && (
          <>
            <div className="flex items-center gap-2 flex-wrap sm:hidden">
              <span
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${jobChips[0].className}`}
              >
                {jobChips[0].label}
              </span>
              {jobChips.length > 1 && (
                <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  +{jobChips.length - 1}
                </span>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              {jobChips.map((chip) => (
                <span
                  key={chip.key}
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${chip.className}`}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Salary and date subtitle */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {salaryRange && `${salaryRange} • `}
        {status === "Applied" 
          ? `Applied ${formatDate(dateApplied)}`
          : `Updated ${formatDate(dateApplied)}`}
      </p>
    </div>
  );

  // Expanded content (shown when accordion is open)
  const expandedContent = (
    <div className="space-y-4">
      {/* Job Description */}
      {hasDescription && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Job Description
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {jobDescription}
          </p>
        </div>
      )}

      {/* Timeline (Status History) */}
      {statusHistory && statusHistory.length > 0 && (
        <div>
          <h4 className="font-semibold text-primary dark:text-primary-light mb-2">
            Timeline
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {formatStatusHistory()}
          </p>
        </div>
      )}

      {/* Notes */}
      {hasNotes && (
        <div>
          <h4 className="font-semibold text-primary dark:text-primary-light mb-2">
            Description
          </h4>
          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Override default styling for better integration
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2 space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="ml-0">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900 dark:text-gray-100">
                    {children}
                  </strong>
                ),
              }}
            >
              {notes}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <AccordionListCard
      onEdit={() => onEdit(id)}
      onDelete={() => onDelete(id)}
      expandedContent={expandedContent}
      isExpanded={isExpanded}
      onExpandChange={onExpandChange}
    >
      {headerContent}
    </AccordionListCard>
  );
};

export default JobCard;
