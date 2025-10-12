import React, { useState, useEffect } from "react";
import { Download, Upload, Save } from "lucide-react";
import db from "../lib/database";
import { useTheme } from "../hooks/useTheme";

const Settings = () => {
  const { changeTheme } = useTheme();
  const [settings, setSettings] = useState({
    goalWeight: "",
    weeklyWorkoutTarget: 3,
    theme: "system",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await db.settings.get(1);
      if (savedSettings) {
        setSettings({
          goalWeight: savedSettings.goalWeight || "",
          weeklyWorkoutTarget: savedSettings.weeklyWorkoutTarget || 3,
          theme: savedSettings.theme || "system",
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: name === "weeklyWorkoutTarget" ? parseInt(value) : value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await db.settings.update(1, {
        ...settings,
        updatedAt: new Date(),
      });

      // Update theme
      await changeTheme(settings.theme);

      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = async () => {
    try {
      const [weights, measurements, workouts, meals, settingsData] =
        await Promise.all([
          db.weights.toArray(),
          db.measurements.toArray(),
          db.workouts.toArray(),
          db.meals.toArray(),
          db.settings.toArray(),
        ]);

      const exportData = {
        weights,
        measurements,
        workouts,
        meals,
        settings: settingsData,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
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
      alert("Failed to export data. Please try again.");
    }
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (!confirm("This will replace all existing data. Are you sure?")) {
          return;
        }

        // Clear existing data
        await Promise.all([
          db.weights.clear(),
          db.measurements.clear(),
          db.workouts.clear(),
          db.meals.clear(),
        ]);

        // Import new data
        if (data.weights) await db.weights.bulkAdd(data.weights);
        if (data.measurements) await db.measurements.bulkAdd(data.measurements);
        if (data.workouts) await db.workouts.bulkAdd(data.workouts);
        if (data.meals) await db.meals.bulkAdd(data.meals);

        if (data.settings && data.settings.length > 0) {
          await db.settings.update(1, data.settings[0]);
          loadSettings();
        }

        alert("Data imported successfully!");
      } catch (error) {
        console.error("Failed to import data:", error);
        alert("Failed to import data. Please check the file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const themeOptions = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Settings
      </h1>

      <div className="space-y-8">
        {/* Goals */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Goals & Targets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="goalWeight"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Goal Weight (lbs)
              </label>
              <input
                type="number"
                step="0.1"
                id="goalWeight"
                name="goalWeight"
                value={settings.goalWeight}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your goal weight"
              />
            </div>
            <div>
              <label
                htmlFor="weeklyWorkoutTarget"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Weekly Workout Target
              </label>
              <input
                type="number"
                min="1"
                max="14"
                id="weeklyWorkoutTarget"
                name="weeklyWorkoutTarget"
                value={settings.weeklyWorkoutTarget}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Appearance
          </h2>
          <div>
            <label
              htmlFor="theme"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Theme
            </label>
            <select
              id="theme"
              name="theme"
              value={settings.theme}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Data Management
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={exportData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </button>

            <label className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
