import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Plus, Lightbulb, RefreshCw } from "lucide-react";
import { isAdmin } from "../lib/admin";
import {
  getSuggestions,
  createSuggestion,
  updateSuggestion,
  updateSuggestionStatus,
  deleteSuggestion,
  subscribeSuggestions,
} from "../lib/suggestions";
import KanbanColumn from "./suggestions/KanbanColumn";
import NewSuggestionForm from "./suggestions/NewSuggestionForm";
import Button from "./shared/Button";
import Alert from "./shared/Alert";
import { SUGGESTION_STATUSES } from "../utils/suggestionConstants";
import { isSetupError } from "../utils/errorUtils";

const STATUSES = SUGGESTION_STATUSES;

const Suggestions = ({ currentUser }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [error, setError] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  const userIsAdmin = currentUser && isAdmin(currentUser.id);

  useEffect(() => {
    loadSuggestions();

    // Subscribe to real-time updates
    const subscription = subscribeSuggestions(async (payload) => {
      console.log("Real-time update:", payload);
      // Reload suggestions when changes occur
      await loadSuggestions();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await getSuggestions();

    if (fetchError) {
      console.error("Error loading suggestions:", fetchError);
      setError(isSetupError(fetchError) ? "setup" : "load");
    } else {
      setSuggestions(data || []);
    }

    setIsLoading(false);
  };

  const handleCreateSuggestion = async (suggestion) => {
    const { error: createError } = await createSuggestion(
      suggestion,
      currentUser.id
    );

    if (createError) {
      console.error("Error creating suggestion:", createError);
      throw createError;
    }

    setShowNewForm(false);
    await loadSuggestions();
  };

  const handleDeleteSuggestion = async (suggestionId) => {
    if (!window.confirm("Are you sure you want to delete this suggestion?")) {
      return;
    }

    const { error: deleteError } = await deleteSuggestion(suggestionId);

    if (deleteError) {
      console.error("Error deleting suggestion:", deleteError);
      setError("delete");
      return;
    }

    await loadSuggestions();
  };

  const handleEditSuggestion = async (suggestionId, updates) => {
    const { error: updateError } = await updateSuggestion(
      suggestionId,
      updates
    );

    if (updateError) {
      console.error("Error updating suggestion:", updateError);
      setError("update");
      return;
    }

    await loadSuggestions();
  };

  const handleStatusChange = async (suggestionId, newStatus) => {
    const { error: updateError } = await updateSuggestionStatus(
      suggestionId,
      newStatus
    );

    if (updateError) {
      console.error("Error updating status:", updateError);
      setError("update");
      return;
    }

    await loadSuggestions();
  };

  // Drag and drop handlers (admin only)
  const handleDragStart = (e, suggestion) => {
    if (!userIsAdmin) return;
    setDraggedItem(suggestion);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    if (!userIsAdmin) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetStatus) => {
    if (!userIsAdmin) return;
    e.preventDefault();

    if (draggedItem && draggedItem.status !== targetStatus) {
      await handleStatusChange(draggedItem.id, targetStatus);
    }

    setDraggedItem(null);
  };

  const getSuggestionsByStatus = (status) => {
    return suggestions.filter((s) => s.status === status);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading suggestions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Lightbulb className="w-8 h-8 text-purple-600" />
              Suggestions
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Share your ideas to improve the site
              {userIsAdmin && " • You can drag cards to change status"}
            </p>
          </div>

          <Button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Suggestion
          </Button>
        </div>

        {error && error === "setup" && (
          <Alert type="warning" title="Database Not Set Up" className="mt-4">
            The suggestions feature needs to be configured in Supabase. Please
            run the SQL setup script.
          </Alert>
        )}

        {error && error !== "setup" && (
          <Alert type="error" title="Error" className="mt-4">
            {error === "delete" &&
              "Failed to delete suggestion. Please try again."}
            {error === "update" &&
              "Failed to update suggestion. Please try again."}
            {error === "load" &&
              "Failed to load suggestions. Please try again."}
          </Alert>
        )}
      </div>

      {/* New Suggestion Form */}
      {showNewForm && error !== "setup" && (
        <div className="mb-8">
          <NewSuggestionForm
            onSubmit={handleCreateSuggestion}
            onCancel={() => setShowNewForm(false)}
          />
        </div>
      )}

      {/* Kanban Board - only show if no setup error */}
      {error !== "setup" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status.id}
              status={status}
              suggestions={getSuggestionsByStatus(status.id)}
              isAdmin={userIsAdmin}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onDelete={handleDeleteSuggestion}
              onEdit={handleEditSuggestion}
            />
          ))}
        </div>
      )}

      {/* Empty State - only show if no errors */}
      {error !== "setup" && suggestions.length === 0 && !showNewForm && (
        <div className="text-center py-12">
          <Lightbulb className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No suggestions yet
          </h3>
          <p className="text-gray-500 dark:text-gray-500 mb-6">
            Be the first to share your ideas!
          </p>
          <Button
            onClick={() => setShowNewForm(true)}
            className="inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create First Suggestion
          </Button>
        </div>
      )}
    </div>
  );
};

Suggestions.propTypes = {
  currentUser: PropTypes.object.isRequired,
};

export default Suggestions;
