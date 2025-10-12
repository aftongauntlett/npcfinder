import React, { useState, useEffect } from "react";
import { Edit2, Trash2, Scale, Ruler, Dumbbell, Utensils } from "lucide-react";
import db from "../../lib/database";

const RecentEntries = ({ onDataChange }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentEntries();
  }, []);

  const loadRecentEntries = async () => {
    try {
      // Get recent entries from each table
      const [weights, measurements, workouts, meals] = await Promise.all([
        db.weights.orderBy("date").reverse().limit(10).toArray(),
        db.measurements.orderBy("date").reverse().limit(10).toArray(),
        db.workouts.orderBy("date").reverse().limit(10).toArray(),
        db.meals.orderBy("date").reverse().limit(10).toArray(),
      ]);

      // Combine and sort by date
      const allEntries = [
        ...weights.map((entry) => ({ ...entry, type: "weight" })),
        ...measurements.map((entry) => ({ ...entry, type: "measurement" })),
        ...workouts.map((entry) => ({ ...entry, type: "workout" })),
        ...meals.map((entry) => ({ ...entry, type: "meal" })),
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20);

      setEntries(allEntries);
    } catch (error) {
      console.error("Failed to load recent entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entry) => {
    if (!confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    try {
      const table =
        entry.type === "weight"
          ? db.weights
          : entry.type === "measurement"
          ? db.measurements
          : entry.type === "workout"
          ? db.workouts
          : db.meals;

      await table.delete(entry.id);
      await loadRecentEntries();
      onDataChange();
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  };

  const getEntryIcon = (type) => {
    switch (type) {
      case "weight":
        return <Scale className="w-4 h-4" />;
      case "measurement":
        return <Ruler className="w-4 h-4" />;
      case "workout":
        return <Dumbbell className="w-4 h-4" />;
      case "meal":
        return <Utensils className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getEntryDescription = (entry) => {
    switch (entry.type) {
      case "weight":
        return `${entry.weight} lbs`;
      case "measurement": {
        const measurements = [];
        if (entry.waist) measurements.push(`Waist: ${entry.waist}"`);
        if (entry.hip) measurements.push(`Hip: ${entry.hip}"`);
        if (entry.chest) measurements.push(`Chest: ${entry.chest}"`);
        if (entry.thigh) measurements.push(`Thigh: ${entry.thigh}"`);
        if (entry.arm) measurements.push(`Arm: ${entry.arm}"`);
        return measurements.join(", ") || "Body measurements";
      }
      case "workout":
        return `${entry.type} - ${entry.duration} min`;
      case "meal":
        return `${entry.period} (${entry.quality})`;
      default:
        return "";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "weight":
        return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900";
      case "measurement":
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900";
      case "workout":
        return "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900";
      case "meal":
        return "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900";
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Recent Entries
        </h3>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-200 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Recent Entries
      </h3>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No entries yet. Start logging your fitness data!
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={`${entry.type}-${entry.id}`}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${getTypeColor(entry.type)}`}>
                  {getEntryIcon(entry.type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {entry.type}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {getEntryDescription(entry)}
                  </p>
                  {(entry.note || entry.notes) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {entry.note || entry.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDelete(entry)}
                  className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  aria-label="Delete entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentEntries;
