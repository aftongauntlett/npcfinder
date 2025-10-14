import React, { useState, useEffect } from "react";
import { Trash2, Scale, Ruler, Dumbbell, Utensils } from "lucide-react";
import db from "../../lib/database";
import type { Weight, Measurement, Workout, Meal } from "../../lib/database";

type EntryType = "weight" | "measurement" | "workout" | "meal";

type Entry =
  | (Weight & { type: "weight" })
  | (Measurement & { type: "measurement" })
  | (Workout & { type: "workout" })
  | (Meal & { type: "meal" });

interface RecentEntriesProps {
  onDataChange: () => void;
}

const RecentEntries: React.FC<RecentEntriesProps> = ({ onDataChange }) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadRecentEntries();
  }, []);

  const loadRecentEntries = async () => {
    try {
      const [weights, measurements, workouts, meals] = await Promise.all([
        db.weights.orderBy("date").reverse().limit(10).toArray(),
        db.measurements.orderBy("date").reverse().limit(10).toArray(),
        db.workouts.orderBy("date").reverse().limit(10).toArray(),
        db.meals.orderBy("date").reverse().limit(10).toArray(),
      ]);

      const allEntries: Entry[] = [
        ...weights.map((entry) => ({ ...entry, type: "weight" as const })),
        ...measurements.map((entry) => ({
          ...entry,
          type: "measurement" as const,
        })),
        ...workouts.map((entry) => ({ ...entry, type: "workout" as const })),
        ...meals.map((entry) => ({ ...entry, type: "meal" as const })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20);

      setEntries(allEntries);
    } catch (error) {
      console.error("Failed to load recent entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entry: Entry) => {
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

      if (entry.id !== undefined) {
        await table.delete(entry.id);
      }
      await loadRecentEntries();
      onDataChange();
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  };

  const getEntryIcon = (type: EntryType) => {
    const icons = {
      weight: Scale,
      measurement: Ruler,
      workout: Dumbbell,
      meal: Utensils,
    };
    const Icon = icons[type];
    return <Icon className="w-4 h-4" aria-hidden="true" />;
  };

  const getEntryDescription = (entry: Entry): string => {
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
        return `${entry.period} (Quality: ${entry.quality}/5)`;
      default:
        return "";
    }
  };

  const getTypeColor = (type: EntryType): string => {
    const colors = {
      weight: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900",
      measurement:
        "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900",
      workout:
        "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900",
      meal: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900",
    };
    return colors[type];
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Recent Entries
        </h3>
        <div className="animate-pulse space-y-4" aria-label="Loading entries">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-200 dark:bg-gray-700 rounded"
            />
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
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={`${entry.type}-${entry.id}`}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${getTypeColor(entry.type)}`}>
                  {getEntryIcon(entry.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {entry.type}
                    </span>
                    <time
                      className="text-sm text-gray-500 dark:text-gray-400"
                      dateTime={entry.date}
                    >
                      {new Date(entry.date).toLocaleDateString()}
                    </time>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {getEntryDescription(entry)}
                  </p>
                  {"note" in entry && entry.note && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {entry.note}
                    </p>
                  )}
                  {"notes" in entry && entry.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {entry.notes}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => void handleDelete(entry)}
                className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                aria-label={`Delete ${entry.type} entry from ${new Date(
                  entry.date
                ).toLocaleDateString()}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentEntries;
