import React, { useState, useEffect } from "react";
import {
  Plus,
  TrendingUp,
  Target,
  Calendar,
  Activity,
  Settings as SettingsIcon,
} from "lucide-react";
import db, { type Weight, type Workout } from "../lib/database";
import QuickLogModal from "./fitness/QuickLogModal";
import TrendChart from "./fitness/TrendChart";
import RecentEntries from "./fitness/RecentEntries";
import Settings from "./Settings";
import StatCard from "./shared/StatCard";
import Card from "./shared/Card";

interface Stats {
  todayLogs: number;
  streak: number;
  recentWeight: Weight | null;
  recentWorkouts: Workout[];
}

interface ChartDataPoint {
  date: string;
  weight?: number;
  waist?: number;
  [key: string]: string | number | undefined;
}

const FitnessDashboard: React.FC = () => {
  const [showQuickLog, setShowQuickLog] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings">(
    "dashboard"
  );
  const [stats, setStats] = useState<Stats>({
    todayLogs: 0,
    streak: 0,
    recentWeight: null,
    recentWorkouts: [],
  });
  const [weightData, setWeightData] = useState<ChartDataPoint[]>([]);
  const [waistData, setWaistData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toDateString();

      // Count today's logs across all tables
      const [todayWeights, todayMeasurements, todayWorkouts, todayMeals] =
        await Promise.all([
          db.weights
            .where("date")
            .startsWith(today.split(" ").slice(1).join(" "))
            .count(),
          db.measurements
            .where("date")
            .startsWith(today.split(" ").slice(1).join(" "))
            .count(),
          db.workouts
            .where("date")
            .startsWith(today.split(" ").slice(1).join(" "))
            .count(),
          db.meals
            .where("date")
            .startsWith(today.split(" ").slice(1).join(" "))
            .count(),
        ]);

      const todayLogs =
        todayWeights + todayMeasurements + todayWorkouts + todayMeals;

      // Get recent weight
      const recentWeight =
        (await db.weights.orderBy("date").reverse().first()) || null;

      // Get recent workouts (last 5)
      const recentWorkouts = await db.workouts
        .orderBy("date")
        .reverse()
        .limit(5)
        .toArray();

      // Calculate streak (days with at least one log)
      const allEntries = await Promise.all([
        db.weights.toArray(),
        db.measurements.toArray(),
        db.workouts.toArray(),
        db.meals.toArray(),
      ]);

      const allDates = new Set<string>();
      allEntries.flat().forEach((entry) => {
        if (entry.date) {
          allDates.add(new Date(entry.date).toDateString());
        }
      });

      // Calculate streak from today backwards
      let streak = 0;
      const currentDate = new Date();
      while (allDates.has(currentDate.toDateString())) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }

      // Get weight data for chart (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const weights = await db.weights
        .where("date")
        .above(thirtyDaysAgo.toISOString())
        .reverse()
        .toArray();

      const measurements = await db.measurements
        .where("date")
        .above(thirtyDaysAgo.toISOString())
        .reverse()
        .toArray();

      setStats({
        todayLogs,
        streak,
        recentWeight,
        recentWorkouts,
      });

      setWeightData(
        weights.map((w) => ({
          date: new Date(w.date).toLocaleDateString(),
          weight: w.weight,
        }))
      );

      setWaistData(
        measurements
          .filter((m) => m.waist)
          .map((m) => ({
            date: new Date(m.date).toLocaleDateString(),
            waist: m.waist,
          }))
      );
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  };

  const handleLogAdded = () => {
    void loadDashboardData();
    setShowQuickLog(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Fitness Dashboard
        </h1>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              activeTab === "dashboard"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
            aria-label="View dashboard"
          >
            <Activity
              className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2"
              aria-hidden="true"
            />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              activeTab === "settings"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
            aria-label="View settings"
          >
            <SettingsIcon
              className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1 sm:mr-2"
              aria-hidden="true"
            />
            Settings
          </button>
        </div>
      </div>

      {activeTab === "settings" ? (
        <Settings />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <StatCard
              icon={Calendar}
              label="Today"
              value={`${stats.todayLogs} logs`}
            />
            <StatCard
              icon={TrendingUp}
              label="Streak"
              value={`${stats.streak} days`}
            />
            <StatCard
              icon={Target}
              label="Weight"
              value={
                stats.recentWeight
                  ? `${stats.recentWeight.weight} lbs`
                  : "No data"
              }
            />
            <StatCard
              icon={Activity}
              label="Workouts"
              value={`${stats.recentWorkouts.length} recent`}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {weightData.length > 0 && (
              <Card>
                <TrendChart
                  title="Weight Trend"
                  data={weightData}
                  dataKey="weight"
                  unit="lbs"
                  color="#8b5cf6"
                />
              </Card>
            )}
            {waistData.length > 0 && (
              <Card>
                <TrendChart
                  title="Waist Trend"
                  data={waistData}
                  dataKey="waist"
                  unit="in"
                  color="#10b981"
                />
              </Card>
            )}
          </div>

          {/* Recent Entries */}
          <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Recent Entries
              </h3>
              <button
                onClick={() => setShowQuickLog(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Quick Log
              </button>
            </div>
            <RecentEntries onDataChange={() => void loadDashboardData()} />
          </Card>

          {/* Quick Log Modal */}
          {showQuickLog && (
            <QuickLogModal
              onClose={() => setShowQuickLog(false)}
              onLogAdded={handleLogAdded}
            />
          )}
        </>
      )}
    </div>
  );
};

export default FitnessDashboard;
