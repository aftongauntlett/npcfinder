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
  location,
  locationType,
  salaryRange,
  employmentType,
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
    <div className="space-y-1.5">
      {/* Title row with company name: job title and chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-gray-900 dark:text-white">
          <span className="font-semibold">{companyName}:</span> {position}
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
        {/* Only show employment type chip if it's NOT Full-time (case-insensitive) */}
        {employmentType && employmentType.toLowerCase() !== "full-time" && (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            {employmentType}
          </span>
        )}
        {/* Location chip with color coding: Remote=green, Hybrid=cyan, In-Office=orange */}
        {(location || locationType) && (
          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
            locationType === "Remote"
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : locationType === "Hybrid"
              ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400"
              : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
          }`}>
            {location || locationType}
          </span>
        )}
        {salaryRange && (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
            {salaryRange}
          </span>
        )}
      </div>

      {/* Status and date subtitle */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {status === "Applied" 
          ? `Applied • ${formatDate(dateApplied)}`
          : `${status} • Updated ${formatDate(dateApplied)}`}
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
