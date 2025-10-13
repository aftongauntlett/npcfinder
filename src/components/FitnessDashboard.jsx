import React, { useState, useEffect } from "react";
import {
  Plus,
  TrendingUp,
  Target,
  Calendar,
  Activity,
  Settings as SettingsIcon,
} from "lucide-react";
import db from "../lib/database";
import QuickLogModal from "./fitness/QuickLogModal";
import TrendChart from "./fitness/TrendChart";
import RecentEntries from "./fitness/RecentEntries";
import Settings from "./Settings";
import StatCard from "./shared/StatCard";
import Card from "./shared/Card";

const FitnessDashboard = () => {
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" or "settings"
  const [stats, setStats] = useState({
    todayLogs: 0,
    streak: 0,
    recentWeight: null,
    recentWorkouts: [],
  });
  const [weightData, setWeightData] = useState([]);
  const [waistData, setWaistData] = useState([]);

  useEffect(() => {
    loadDashboardData();
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
      const recentWeight = await db.weights.orderBy("date").reverse().first();

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

      const allDates = new Set();
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
    loadDashboardData();
    setShowQuickLog(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Fitness Dashboard
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("settings")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-label="Open settings"
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            Settings
          </button>
          <button
            onClick={() => setShowQuickLog(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-label="Open quick log modal"
          >
            <Plus className="w-4 h-4 mr-2" />
            Quick Log
          </button>
        </div>
      </div>

      {activeTab === "dashboard" ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Calendar}
              label="Today's Logs"
              value={stats.todayLogs}
              iconColor="text-gray-400"
            />
            <StatCard
              icon={Target}
              label="Day Streak"
              value={stats.streak}
              iconColor="text-green-400"
            />
            <StatCard
              icon={TrendingUp}
              label="Current Weight"
              value={
                stats.recentWeight
                  ? `${stats.recentWeight.weight} lbs`
                  : "No data"
              }
              iconColor="text-blue-400"
            />
            <StatCard
              icon={Activity}
              label="Recent Workouts"
              value={stats.recentWorkouts.length}
              iconColor="text-purple-400"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <TrendChart
              title="Weight Trend"
              data={weightData}
              dataKey="weight"
              unit="lbs"
              color="#3B82F6"
            />
            <TrendChart
              title="Waist Measurements"
              data={waistData}
              dataKey="waist"
              unit="in"
              color="#10B981"
            />
          </div>

          {/* Recent Entries */}
          <RecentEntries onDataChange={loadDashboardData} />
        </>
      ) : (
        <Card>
          <button
            onClick={() => setActiveTab("dashboard")}
            className="mb-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Dashboard
          </button>
          <Settings />
        </Card>
      )}

      {/* Quick Log Modal */}
      {showQuickLog && (
        <QuickLogModal
          onClose={() => setShowQuickLog(false)}
          onLogAdded={handleLogAdded}
        />
      )}
    </div>
  );
};

export default FitnessDashboard;
