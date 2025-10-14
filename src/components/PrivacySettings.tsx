import { useState } from "react";
import {
  exportUserData,
  downloadDataAsJson,
  getUserDataSummary,
  DATA_WE_COLLECT,
  PRIVACY_PROMISES,
} from "../lib/privacy";
import { useAuth } from "../contexts/AuthContext";
import Card from "./shared/Card";
import Button from "./shared/Button";

export function PrivacySettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dataSummary, setDataSummary] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleExportData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await exportUserData(user.id);
      if (error) throw error;

      downloadDataAsJson(data, `npc-finder-data-${user.email}`);
      alert("Your data has been downloaded!");
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSummary = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await getUserDataSummary(user.id);
      if (error) throw error;
      setDataSummary(data);
    } catch (error) {
      console.error("Failed to load summary:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">Privacy & Data</h2>

      {/* What We Collect */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">📋 What Data We Collect</h3>
        <div className="space-y-3 text-sm">
          <div>
            <strong>Authentication:</strong>
            <ul className="ml-4 mt-1 space-y-1 text-gray-600 dark:text-gray-400">
              {Object.entries(DATA_WE_COLLECT.authentication).map(
                ([key, value]) => (
                  <li key={key}>• {value}</li>
                )
              )}
            </ul>
          </div>
          <div>
            <strong>Content:</strong>
            <ul className="ml-4 mt-1 space-y-1 text-gray-600 dark:text-gray-400">
              {Object.entries(DATA_WE_COLLECT.content).map(([key, value]) => (
                <li key={key}>• {value}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Social:</strong>
            <ul className="ml-4 mt-1 space-y-1 text-gray-600 dark:text-gray-400">
              {Object.entries(DATA_WE_COLLECT.social).map(([key, value]) => (
                <li key={key}>• {value}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Privacy Promises */}
      <Card className="p-6 border-2 border-green-500 dark:border-green-600">
        <h3 className="text-xl font-semibold mb-4">✅ Our Privacy Promises</h3>
        <div className="space-y-2 text-sm">
          {Object.entries(PRIVACY_PROMISES).map(([key, value]) => (
            <div key={key} className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Honesty Section */}
      <Card className="p-6 border-2 border-yellow-500 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20">
        <h3 className="text-xl font-semibold mb-4">
          ⚠️ Important: What This ISN'T
        </h3>
        <div className="space-y-3 text-sm">
          <p className="font-semibold">
            This is NOT end-to-end encrypted like Signal.
          </p>
          <ul className="ml-4 space-y-2 text-gray-700 dark:text-gray-300">
            <li>• The admin (developer) can technically access the database</li>
            <li>• Supabase (our hosting provider) can access the data</li>
            <li>• This is a friend-group app, not a commercial service</li>
            <li>
              • We use the same privacy model as Netflix, Spotify, or IMDb
            </li>
          </ul>
          <p className="mt-4 text-gray-700 dark:text-gray-300">
            <strong>What IS protected:</strong> Your data is protected from
            other users. They can't see your stuff unless you share it with
            them.
          </p>
        </div>
      </Card>

      {/* Your Data Summary */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">📊 Your Data Summary</h3>
        {!dataSummary ? (
          <Button
            onClick={() => {
              void handleLoadSummary();
            }}
            disabled={loading}
          >
            {loading ? "Loading..." : "View What Data We Have"}
          </Button>
        ) : (
          <div className="space-y-2 text-sm">
            <p>
              Media items tracked:{" "}
              <strong>{dataSummary.media_items_count}</strong>
            </p>
            <p>
              Top lists created: <strong>{dataSummary.top_lists_count}</strong>
            </p>
            <p>
              Friend connections: <strong>{dataSummary.friends_count}</strong>
            </p>
            <p>
              Suggestions made: <strong>{dataSummary.suggestions_count}</strong>
            </p>
            <Button
              onClick={() => {
                void handleLoadSummary();
              }}
              variant="secondary"
              className="mt-4"
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        )}
      </Card>

      {/* Export Data */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">📦 Export Your Data</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Download all your data as a JSON file. You can view it, save it, or
          import it elsewhere.
        </p>
        <Button
          onClick={() => {
            void handleExportData();
          }}
          disabled={loading}
        >
          {loading ? "Exporting..." : "Download My Data"}
        </Button>
      </Card>

      {/* Delete Account */}
      <Card className="p-6 border-2 border-red-500 dark:border-red-600">
        <h3 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
          🗑️ Delete Account
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Want to leave? You can delete your account and all your data anytime.
        </p>
        <Button
          variant="secondary"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Hide Details" : "Show How to Delete"}
        </Button>

        {showDetails && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded text-sm">
            <p className="font-semibold mb-2">To delete your account:</p>
            <ol className="ml-4 space-y-2">
              <li>1. Export your data first (if you want to keep it)</li>
              <li>
                2. Contact the admin (they'll need to complete the deletion)
              </li>
              <li>
                3. This will delete all your media, lists, and connections
              </li>
              <li>4. This action is permanent and cannot be undone</li>
            </ol>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Note: Full account deletion requires admin action. This is a small
              friend-group app, not a commercial service with automated
              deletion.
            </p>
          </div>
        )}
      </Card>

      {/* Contact */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">💬 Questions?</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This is a small app for friends. If you have privacy concerns, just
          message the admin directly. We're all friends here. 🤝
        </p>
      </Card>
    </div>
  );
}
