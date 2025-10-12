import React, { useState } from "react";
import db from "../../lib/database";

const WorkoutForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "strength",
    duration: "",
    exercises: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const workoutTypes = [
    { value: "strength", label: "Strength Training" },
    { value: "walk", label: "Walking" },
    { value: "swim", label: "Swimming" },
    { value: "cardio", label: "Cardio" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.duration) return;

    setIsSubmitting(true);
    try {
      await db.workouts.add({
        date: new Date(formData.date).toISOString(),
        type: formData.type,
        duration: parseInt(formData.duration),
        exercises: formData.exercises,
        notes: formData.notes,
        createdAt: new Date(),
      });
      onSubmit();
    } catch (error) {
      console.error("Failed to save workout:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="workout-date"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Date
        </label>
        <input
          type="date"
          id="workout-date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required
        />
      </div>

      <div>
        <label
          htmlFor="workout-type"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Workout Type
        </label>
        <select
          id="workout-type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required
        >
          {workoutTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="workout-duration"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Duration (minutes)
        </label>
        <input
          type="number"
          id="workout-duration"
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Duration in minutes"
          min="1"
          required
        />
      </div>

      <div>
        <label
          htmlFor="exercises"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Exercises (optional)
        </label>
        <textarea
          id="exercises"
          name="exercises"
          value={formData.exercises}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="List exercises performed..."
        />
      </div>

      <div>
        <label
          htmlFor="workout-notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Notes (optional)
        </label>
        <textarea
          id="workout-notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Any additional notes about this workout..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !formData.duration}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Saving..." : "Save Workout"}
        </button>
      </div>
    </form>
  );
};

export default WorkoutForm;
