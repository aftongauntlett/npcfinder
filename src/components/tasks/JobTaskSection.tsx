/**
 * Job Task Section Component
 * Encapsulates all job application fields, status history, and applied date handling
 * Provides a builder function for job-specific item_data
 */

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/datepicker.css";
import Input from "../shared/ui/Input";
import Textarea from "../shared/ui/Textarea";
import Select from "../shared/ui/Select";
import type {
  Task,
  StatusHistoryEntry,
} from "../../services/tasksService.types";
import { getTemplate } from "../../utils/boardTemplates";
import { detectLocationTypeFromLocationText } from "../../utils/locationTypeDetection";

interface JobTaskSectionProps {
  task: Task;
  onBuildItemData: (
    builder: () => Record<string, unknown>,
    isValid: boolean
  ) => void;
}

const JobTaskSection: React.FC<JobTaskSectionProps> = ({
  task,
  onBuildItemData,
}) => {
  // Job tracker specific fields
  const [companyName, setCompanyName] = useState(
    (task.item_data?.company_name as string) || ""
  );
  const [companyUrl, setCompanyUrl] = useState(
    (task.item_data?.company_url as string) || ""
  );
  const [position, setPosition] = useState(
    (task.item_data?.position as string) || ""
  );
  const [salaryRange, setSalaryRange] = useState(
    (task.item_data?.salary_range as string) || ""
  );
  const [location, setLocation] = useState(
    (task.item_data?.location as string) || ""
  );
  const [locationType, setLocationType] = useState<"Remote" | "Hybrid" | "In-Office">(
    (task.item_data?.location_type as "Remote" | "Hybrid" | "In-Office") || "In-Office"
  );
  const [employmentType, setEmploymentType] = useState(
    (task.item_data?.employment_type as string) || ""
  );
  const [jobNotes, setJobNotes] = useState(
    (task.item_data?.notes as string) || ""
  );
  const [jobDescription, setJobDescription] = useState(
    (task.item_data?.job_description as string) || ""
  );
  const [jobStatus, setJobStatus] = useState(
    (task.item_data?.status as string) || "Applied"
  );
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>(
    (task.item_data?.status_history as StatusHistoryEntry[]) || []
  );

  // Track previous job status to detect changes
  const [prevJobStatus, setPrevJobStatus] = useState(jobStatus);

  // Get job tracker template for status options
  const jobTrackerTemplate = getTemplate("job_tracker");
  const jobStatusOptions = jobTrackerTemplate?.statusOptions || [
    "Applied",
    "No Response",
    "Interview",
    "Accepted",
    "Rejected",
    "Declined",
  ];

  // Update fields when task changes
  useEffect(() => {
    setCompanyName((task.item_data?.company_name as string) || "");
    setCompanyUrl((task.item_data?.company_url as string) || "");
    setPosition((task.item_data?.position as string) || "");
    setSalaryRange((task.item_data?.salary_range as string) || "");
    setLocation((task.item_data?.location as string) || "");
    setLocationType((task.item_data?.location_type as "Remote" | "Hybrid" | "In-Office") || "In-Office");
    setEmploymentType((task.item_data?.employment_type as string) || "");
    setJobNotes((task.item_data?.notes as string) || "");
    setJobDescription((task.item_data?.job_description as string) || "");
    const currentJobStatus = (task.item_data?.status as string) || "Applied";
    setJobStatus(currentJobStatus);
    setPrevJobStatus(currentJobStatus); // Sync prevJobStatus to prevent duplicate entries

    // Initialize status_history from existing array or create from date_applied for legacy tasks
    const existingHistory = task.item_data
      ?.status_history as StatusHistoryEntry[];
    if (existingHistory && existingHistory.length > 0) {
      setStatusHistory(existingHistory);
    } else if (task.item_data?.date_applied) {
      // Legacy task with date_applied but no status_history
      setStatusHistory([
        {
          status: currentJobStatus,
          date: task.item_data.date_applied as string,
        },
      ]);
    } else {
      setStatusHistory([]);
    }
  }, [task]);

  // Handle status changes - append to status history
  useEffect(() => {
    if (jobStatus !== prevJobStatus) {
      const newEntry: StatusHistoryEntry = {
        status: jobStatus,
        date: new Date().toISOString().split("T")[0],
      };
      setStatusHistory((prev) => [...prev, newEntry]);
      setPrevJobStatus(jobStatus);
    }
  }, [jobStatus, prevJobStatus]);

  // Provide builder function to parent
  useEffect(() => {
    const buildItemData = (): Record<string, unknown> => {
      // Find the date of the first "Applied" status in history, or use existing date_applied
      const appliedEntry = statusHistory.find(
        (entry) => entry.status === "Applied"
      );
      const dateApplied =
        appliedEntry?.date ||
        (task.item_data?.date_applied as string) ||
        new Date().toISOString().split("T")[0];

      return {
        ...(task.item_data || {}),
        company_name: companyName,
        company_url: companyUrl,
        position: position,
        salary_range: salaryRange,
        location: location,
        location_type: locationType,
        employment_type: employmentType,
        notes: jobNotes,
        job_description: jobDescription,
        status: jobStatus,
        date_applied: dateApplied,
        status_history: statusHistory,
      };
    };

    const isValid = companyName.trim() !== "" && position.trim() !== "";
    onBuildItemData(buildItemData, isValid);
  }, [
    companyName,
    companyUrl,
    position,
    salaryRange,
    location,
    locationType,
    employmentType,
    jobNotes,
    jobDescription,
    jobStatus,
    statusHistory,
    task.item_data,
    onBuildItemData,
  ]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="company-name"
          label="Company Name"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company name"
        />
        <Input
          id="position"
          label="Position"
          type="text"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="Software Engineer"
        />
        <Input
          id="salary-range"
          label="Salary Range"
          type="text"
          value={salaryRange}
          onChange={(e) => setSalaryRange(e.target.value)}
          placeholder="$100k - $150k"
        />
        <Input
          id="location"
          label="Location"
          type="text"
          value={location}
          onChange={(e) => {
            const newLocation = e.target.value;
            setLocation(newLocation);
            // Auto-detect location type from manual entry
            setLocationType(detectLocationTypeFromLocationText(newLocation));
          }}
          placeholder="San Francisco, CA"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          id="employment-type"
          label="Employment Type"
          value={employmentType}
          onChange={(e) => setEmploymentType(e.target.value)}
          placeholder="Select type"
          options={[
            { value: "Full-time", label: "Full-time" },
            { value: "Part-time", label: "Part-time" },
            { value: "Contract", label: "Contract" },
          ]}
        />
        <Input
          id="company-url"
          label="Company URL"
          type="url"
          value={companyUrl}
          onChange={(e) => setCompanyUrl(e.target.value)}
          placeholder="https://company.com/careers/job-id"
        />
      </div>

      {/* Status and Applied Date - 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          id="job-status"
          label="Status"
          value={jobStatus}
          onChange={(e) => setJobStatus(e.target.value)}
          options={jobStatusOptions.map((status) => ({
            value: status,
            label: status,
          }))}
        />

        {/* Date for current status */}
        {statusHistory.length > 0 && (
          <div>
            <label
              htmlFor="status-date"
              className="block text-sm font-bold text-primary mb-1.5"
            >
              Applied Date
            </label>
            <DatePicker
              id="status-date"
              selected={
                statusHistory[statusHistory.length - 1]?.date
                  ? new Date(statusHistory[statusHistory.length - 1].date)
                  : new Date()
              }
              onChange={(date: Date | null) => {
                if (date && statusHistory.length > 0) {
                  const updatedHistory = [...statusHistory];
                  updatedHistory[updatedHistory.length - 1] = {
                    ...updatedHistory[updatedHistory.length - 1],
                    date: date.toISOString().split("T")[0],
                  };
                  setStatusHistory(updatedHistory);
                }
              }}
              dateFormat="MM/dd/yyyy"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none transition-colors"
              wrapperClassName="w-full"
              calendarClassName="dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        )}
      </div>

      {/* Job Description - supports markdown */}
      <Textarea
        id="job-description"
        label="Job Description"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        placeholder="Paste or type the full job description here..."
        rows={6}
        resize="vertical"
      />

      {/* Notes - supports markdown */}
      <Textarea
        id="job-notes"
        label="Notes"
        value={jobNotes}
        onChange={(e) => setJobNotes(e.target.value)}
        placeholder="Interview notes, contacts, follow-ups..."
        rows={4}
        resize="vertical"
      />
    </>
  );
};

export default JobTaskSection;
