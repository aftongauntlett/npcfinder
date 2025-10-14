import React, { useState } from "react";
import db from "../../lib/database";

interface MealFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

interface MealFormData {
  date: string;
  period: string;
  quality: number;
  notes: string;
}

const MEAL_PERIODS = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
] as const;

const QUALITY_OPTIONS = [
  { value: 5, label: "Excellent - Very Healthy" },
  { value: 4, label: "Good - Mostly Healthy" },
  { value: 3, label: "Average - Balanced" },
  { value: 2, label: "Fair - Could Be Better" },
  { value: 1, label: "Poor - Unhealthy" },
] as const;

const MealForm: React.FC<MealFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<MealFormData>({
    date: new Date().toISOString().split("T")[0],
    period: "breakfast",
    quality: 3,
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quality" ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      await db.meals.add({
        date: new Date(formData.date).toISOString(),
        period: formData.period,
        quality: formData.quality,
        notes: formData.notes,
        createdAt: new Date(),
      });
      onSubmit();
    } catch (error) {
      console.error("Failed to save meal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit(e);
      }}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="meal-date"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Date
        </label>
        <input
          type="date"
          id="meal-date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
          required
          aria-required="true"
        />
      </div>

      <div>
        <label
          htmlFor="meal-period"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Meal Period
        </label>
        <select
          id="meal-period"
          name="period"
          value={formData.period}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
          required
          aria-required="true"
        >
          {MEAL_PERIODS.map((period) => (
            <option key={period.value} value={period.value}>
              {period.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="meal-quality"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Quality Rating
        </label>
        <select
          id="meal-quality"
          name="quality"
          value={formData.quality}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
          required
          aria-required="true"
        >
          {QUALITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="meal-notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Notes
        </label>
        <textarea
          id="meal-notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors resize-none"
          placeholder="What did you eat? How did it make you feel?"
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
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Saving..." : "Save Meal"}
        </button>
      </div>
    </form>
  );
};

export default MealForm;
