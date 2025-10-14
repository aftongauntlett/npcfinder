import React, { useState } from "react";
import db from "../../lib/database";

interface WeightFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

interface WeightFormData {
  date: string;
  weight: string;
  note: string;
}

const WeightForm: React.FC<WeightFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<WeightFormData>({
    date: new Date().toISOString().split("T")[0],
    weight: "",
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
    if (!formData.weight) return;

    setIsSubmitting(true);
    try {
      await db.weights.add({
        date: new Date(formData.date).toISOString(),
        weight: parseFloat(formData.weight),
        note: formData.note,
        createdAt: new Date(),
      });
      onSubmit();
    } catch (error) {
      console.error("Failed to save weight:", error);
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
          htmlFor="weight-date"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Date
        </label>
        <input
          type="date"
          id="weight-date"
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
          htmlFor="weight"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Weight (lbs) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.1"
          id="weight"
          name="weight"
          value={formData.weight}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
          placeholder="Enter weight in pounds"
          required
          aria-required="true"
        />
      </div>

      <div>
        <label
          htmlFor="weight-note"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Note (optional)
        </label>
        <textarea
          id="weight-note"
          name="note"
          value={formData.note}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors resize-none"
          placeholder="Any notes about this measurement..."
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
          disabled={isSubmitting || !formData.weight}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Saving..." : "Save Weight"}
        </button>
      </div>
    </form>
  );
};

export default WeightForm;
