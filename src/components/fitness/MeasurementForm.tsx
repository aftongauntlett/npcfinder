import React, { useState } from "react";
import db from "../../lib/database";

interface MeasurementFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

interface MeasurementFormData {
  date: string;
  waist: string;
  hip: string;
  chest: string;
  thigh: string;
  arm: string;
  note: string;
}

const MEASUREMENT_FIELDS = [
  { name: "waist" as const, label: "Waist" },
  { name: "hip" as const, label: "Hip" },
  { name: "chest" as const, label: "Chest" },
  { name: "thigh" as const, label: "Thigh" },
  { name: "arm" as const, label: "Arm" },
];

const MeasurementForm: React.FC<MeasurementFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<MeasurementFormData>({
    date: new Date().toISOString().split("T")[0],
    waist: "",
    hip: "",
    chest: "",
    thigh: "",
    arm: "",
    note: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasMeasurement = MEASUREMENT_FIELDS.some(
      (field) => formData[field.name]
    );
    if (!hasMeasurement) return;

    setIsSubmitting(true);
    try {
      await db.measurements.add({
        date: new Date(formData.date).toISOString(),
        waist: formData.waist ? parseFloat(formData.waist) : undefined,
        hip: formData.hip ? parseFloat(formData.hip) : undefined,
        chest: formData.chest ? parseFloat(formData.chest) : undefined,
        thigh: formData.thigh ? parseFloat(formData.thigh) : undefined,
        arm: formData.arm ? parseFloat(formData.arm) : undefined,
        note: formData.note,
        createdAt: new Date(),
      });
      onSubmit();
    } catch (error) {
      console.error("Failed to save measurements:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasMeasurement = MEASUREMENT_FIELDS.some(
    (field) => formData[field.name]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="measurement-date"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Date
        </label>
        <input
          type="date"
          id="measurement-date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
          required
          aria-required="true"
        />
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Enter at least one measurement (in inches)
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MEASUREMENT_FIELDS.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {field.label} (inches)
            </label>
            <input
              type="number"
              step="0.25"
              id={field.name}
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              placeholder="0.00"
              min="0"
            />
          </div>
        ))}
      </div>

      <div>
        <label
          htmlFor="measurement-note"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Note (optional)
        </label>
        <textarea
          id="measurement-note"
          name="note"
          value={formData.note}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors resize-none"
          placeholder="Any notes about these measurements..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !hasMeasurement}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Saving..." : "Save Measurements"}
        </button>
      </div>
    </form>
  );
};

export default MeasurementForm;
