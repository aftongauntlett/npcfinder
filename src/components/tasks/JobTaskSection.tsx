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
  const [employmentType, setEmploymentType] = useState(
    (task.item_data?.employment_type as string) || ""
  );
  const [jobNotes, setJobNotes] = useState(
    (task.item_data?.notes as string) || ""
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
    "Phone Screen",
    "Interview - Round 1",
    "Interview - Round 2",
    "Interview - Round 3",
    "Offer Received",
    "Rejected",
    "No Response",
    "Accepted",
    "Declined",
  ];

  // Update fields when task changes
  useEffect(() => {
    setCompanyName((task.item_data?.company_name as string) || "");
    setCompanyUrl((task.item_data?.company_url as string) || "");
    setPosition((task.item_data?.position as string) || "");
    setSalaryRange((task.item_data?.salary_range as string) || "");
    setLocation((task.item_data?.location as string) || "");
    setEmploymentType((task.item_data?.employment_type as string) || "");
    setJobNotes((task.item_data?.notes as string) || "");
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
        employment_type: employmentType,
        notes: jobNotes,
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
    employmentType,
    jobNotes,
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
      </div>

      {/* Description (formerly Notes) - larger and supports markdown */}
      <Textarea
        id="job-description"
        label="Description"
        value={jobNotes}
        onChange={(e) => setJobNotes(e.target.value)}
        placeholder="**Role Overview**&#10;&#10;Key responsibilities:\n- Lead feature development\n- Collaborate with cross-functional teams\n- Mentor junior engineers"
        rows={6}
        helperText="Supports basic markdown: **bold**, - bullet lists"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          onChange={(e) => setLocation(e.target.value)}
          placeholder="San Francisco, CA"
        />
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
            { value: "Internship", label: "Internship" },
            { value: "Remote", label: "Remote" },
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
              className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5"
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
    </>
  );
};

export default JobTaskSection;
