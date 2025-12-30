import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AccordionListCard from "../common/AccordionListCard";
import {
  ExternalLink,
  Check,
  Star,
  X,
  ShieldX,
  MessageCircleQuestion,
} from "lucide-react";
import { withOpacity } from "../../../data/landingTheme";

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

  // Get status icon and color based on status value
  const getStatusIcon = (statusValue: string) => {
    const normalizedStatus = statusValue.toLowerCase();

    if (normalizedStatus === "applied") {
      return {
        Icon: Check,
        color: "#16a34a", // green-600
        backgroundColor: withOpacity("#16a34a", 0.14),
      };
    } else if (normalizedStatus === "accepted") {
      return {
        Icon: Star,
        color: "#d97706", // yellow-600
        backgroundColor: withOpacity("#d97706", 0.14),
      };
    } else if (normalizedStatus === "rejected") {
      return {
        Icon: X,
        color: "#dc2626", // red-600
        backgroundColor: withOpacity("#dc2626", 0.14),
      };
    } else if (normalizedStatus === "declined") {
      return {
        Icon: ShieldX,
        color: "#2563eb", // blue-600
        backgroundColor: withOpacity("#2563eb", 0.14),
      };
    } else if (normalizedStatus === "no response") {
      return {
        Icon: MessageCircleQuestion,
        color: "#6b7280", // gray-500
        backgroundColor: withOpacity("#6b7280", 0.14),
      };
    }

    // Default for interview or other statuses
    return {
      Icon: Check,
      color: "#6b7280", // gray-500
      backgroundColor: withOpacity("#6b7280", 0.14),
    };
  };

  // Build job chips (status chips for header) - removed status chip as it's now an icon
  const jobChips: Array<{ key: string; label: string; className: string }> = [
    // Status chip removed - now using icon instead
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
    <div className="flex items-start gap-3">
      {/* Status Icon */}
      <span
        className="icon-container-lg flex-shrink-0"
        style={{ backgroundColor: getStatusIcon(status).backgroundColor }}
        aria-hidden="true"
      >
        {(() => {
          const { Icon, color } = getStatusIcon(status);
          return <Icon className="w-5 h-5" style={{ color }} />;
        })()}
      </span>

      {/* Title and Chips */}
      <div className="flex-1 min-w-0">
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
          {/* Chips (collapsed on mobile: show 1 + +n) */}
          {jobChips.length > 0 && (
            <>
              <div className="flex items-center gap-2 flex-wrap sm:hidden">
                <span className={`chip-base ${jobChips[0].className}`}>
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
                    className={`chip-base ${chip.className}`}
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
    </div>
  );

  // Expanded content (shown when accordion is open)
  const expandedContent = (
    <div className="space-y-4">
      {/* Job Description */}
      {hasDescription && (
        <div>
          <h4 className="section-title">Job Description:</h4>
          <p className="text-body whitespace-pre-wrap leading-relaxed">
            {jobDescription}
          </p>
        </div>
      )}

      {/* Timeline (Status History) */}
      {statusHistory && statusHistory.length > 0 && (
        <div>
          <h4 className="section-title">Timeline</h4>
          <p className="text-body leading-relaxed">{formatStatusHistory()}</p>
        </div>
      )}

      {/* Notes */}
      {hasNotes && (
        <div>
          <h4 className="section-title">Notes:</h4>
          <div className="text-body leading-relaxed prose prose-sm dark:prose-invert max-w-none">
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
