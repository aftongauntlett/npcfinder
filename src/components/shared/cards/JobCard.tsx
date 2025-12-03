import React, { useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Chip from "../ui/Chip";
import CustomDropdown from "../../ui/CustomDropdown";
import { useTheme } from "../../../hooks/useTheme";
import {
  Pencil,
  Trash2,
  ExternalLink,
  MapPin,
  DollarSign,
  Briefcase,
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
  statusOptions: string[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

/**
 * JobCard - Specialized card component for job applications
 * Features improved information hierarchy and no scale/grow hover effects
 */
const JobCard: React.FC<JobCardProps> = ({
  id,
  companyName,
  companyUrl,
  position,
  status,
  location,
  locationType,
  salaryRange,
  employmentType,
  statusHistory,
  jobDescription,
  notes,
  statusOptions,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const { themeColor } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
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

  return (
    <Card
      variant="interactive"
      hover="none"
      spacing="md"
      className="group relative hover:bg-gray-900/[0.04] dark:hover:bg-gray-900 cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Action Buttons - Always visible on mobile, hover on desktop */}
      <div className="absolute top-3 right-3 flex gap-2 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
        <Button
          variant="subtle"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(id);
          }}
          className="h-8 w-8 p-0"
          aria-label="Edit job application"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="h-8 w-8 p-0"
          aria-label="Delete job application"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Content - Compact Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 pr-24 lg:pr-2">
        {/* Left Column - Company & Position */}
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

          {/* Metadata Chips */}
          <div className="flex flex-wrap gap-2">
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
          </div>
        </div>

        {/* Right Column - Status Dropdown (narrower) */}
        <div className="lg:w-44" onClick={(e) => e.stopPropagation()}>
          <CustomDropdown
            id={`status-${id}`}
            label="Status"
            value={status}
            onChange={(value) => onStatusChange(id, value)}
            options={statusOptions}
            themeColor={themeColor}
            className="status-dropdown"
          />
        </div>
      </div>

      {/* Expandable Details Section */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* Job Description */}
          {hasDescription && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Job Description
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {jobDescription}
              </p>
            </div>
          )}

          {/* Timeline (Status History) */}
          {statusHistory && statusHistory.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Timeline
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                {formatStatusHistory()}
              </p>
            </div>
          )}

          {/* Notes */}
          {hasNotes && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Notes
              </p>
              <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 rounded-md p-3">
                {notes}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default JobCard;
