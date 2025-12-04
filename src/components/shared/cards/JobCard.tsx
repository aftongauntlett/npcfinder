import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AccordionListCard from "../common/AccordionListCard";
import Chip from "../ui/Chip";
import {
  ExternalLink,
  MapPin,
  DollarSign,
  Briefcase,
  Calendar,
} from "lucide-react";

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

  const getLocationTypeIcon = () => {
    switch (locationType) {
      case "Remote":
        return "🏠";
      case "Hybrid":
        return "🔄";
      case "In-Office":
        return "🏢";
      default:
        return null;
    }
  };

  // Header content (always visible)
  const headerContent = (
    <div className="space-y-2">
      {/* Company Name with Link */}
      <div className="flex items-center gap-2">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          {companyName}
        </h3>
        {companyUrl && (
          <a
            href={companyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            aria-label="Visit company website"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Position Title */}
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {position}
      </p>

      {/* Metadata Chips - All left-aligned */}
      <div className="flex flex-wrap items-center gap-2">
        {locationType && (
          <Chip variant="info" size="sm">
            <span className="flex items-center gap-1">
              {getLocationTypeIcon()} {locationType}
            </span>
          </Chip>
        )}
        {employmentType && (
          <Chip variant="primary" size="sm">
            <span className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {employmentType}
            </span>
          </Chip>
        )}
        {salaryRange && (
          <Chip variant="success" size="sm">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {salaryRange}
            </span>
          </Chip>
        )}
        {location && (
          <Chip variant="warning" size="sm">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {location}
            </span>
          </Chip>
        )}
        <Chip variant="info" size="sm">
          {status}
        </Chip>
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Calendar className="w-3 h-3" />
          {formatDate(dateApplied)}
        </span>
      </div>
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
    >
      {headerContent}
    </AccordionListCard>
  );
};

export default JobCard;
