import React, { useState, useEffect } from "react";
import { Download, Upload, Save } from "lucide-react";
import db, { type Settings as SettingsType } from "../lib/database";
import { useTheme } from "../hooks/useTheme";

const Settings: React.FC = () => {
  const { changeTheme } = useTheme();
  const [settings, setSettings] = useState<SettingsType>({
    id: 1,
    goalWeight: null,
    weeklyWorkoutTarget: 3,
    theme: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await db.settings.get(1);
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]:
        name === "weeklyWorkoutTarget"
          ? parseInt(value)
          : name === "goalWeight"
          ? value === ""
            ? null
            : parseFloat(value)
          : value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await db.settings.put({
        ...settings,
        updatedAt: new Date(),
      });
      changeTheme(settings.theme as "light" | "dark" | "system");
      alert("Settings saved!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = async () => {
    try {
      const data = {
        weights: await db.weights.toArray(),
        measurements: await db.measurements.toArray(),
        workouts: await db.workouts.toArray(),
        meals: await db.meals.toArray(),
        settings: await db.settings.toArray(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fitness-data-${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export data:", error);
      alert("Failed to export data");
    }
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        await Promise.all([
          db.weights.bulkPut(data.weights || []),
          db.measurements.bulkPut(data.measurements || []),
          db.workouts.bulkPut(data.workouts || []),
          db.meals.bulkPut(data.meals || []),
          db.settings.bulkPut(data.settings || []),
        ]);
        alert("Data imported successfully!");
        loadSettings();
      } catch (error) {
        console.error("Failed to import data:", error);
        alert("Failed to import data");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
        Fitness Settings
      </h2>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="goalWeight"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Goal Weight (lbs)
          </label>
          <input
            type="number"
            id="goalWeight"
            name="goalWeight"
            value={settings.goalWeight ?? ""}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Enter goal weight"
          />
        </div>

        <div>
          <label
            htmlFor="weeklyWorkoutTarget"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Weekly Workout Target
          </label>
          <input
            type="number"
            id="weeklyWorkoutTarget"
            name="weeklyWorkoutTarget"
            min="1"
            max="7"
            value={settings.weeklyWorkoutTarget}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="theme"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Theme
          </label>
          <select
            id="theme"
            name="theme"
            value={settings.theme}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" aria-hidden="true" />
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Data Management
        </h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Export Data
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" aria-hidden="true" />
            Import Data
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
              aria-label="Import fitness data"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default Settings;
