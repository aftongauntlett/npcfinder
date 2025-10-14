import React, { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { Plus, Lightbulb, RefreshCw } from "lucide-react";
import { isAdmin } from "../lib/admin";
import {
  getSuggestions,
  createSuggestion,
  updateSuggestion,
  updateSuggestionStatus,
  deleteSuggestion,
  subscribeSuggestions,
  type SuggestionWithUser,
  type Suggestion,
} from "../lib/suggestions";
import KanbanColumn from "./suggestions/KanbanColumn";
import NewSuggestionForm from "./suggestions/NewSuggestionForm";
import Button from "./shared/Button";
import Alert from "./shared/Alert";
import { SUGGESTION_STATUSES } from "../utils/suggestionConstants";
import { isSetupError } from "../utils/errorUtils";

const STATUSES = SUGGESTION_STATUSES;

type SuggestionStatus = Suggestion["status"];
type ErrorType = "setup" | "delete" | "update" | "load" | null;

interface SuggestionsProps {
  currentUser: User;
}

const Suggestions: React.FC<SuggestionsProps> = ({ currentUser }) => {
  const [suggestions, setSuggestions] = useState<SuggestionWithUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showNewForm, setShowNewForm] = useState<boolean>(false);
  const [error, setError] = useState<ErrorType>(null);
  const [draggedItem, setDraggedItem] = useState<SuggestionWithUser | null>(
    null
  );

  const userIsAdmin = currentUser && isAdmin(currentUser.id);

  useEffect(() => {
    void loadSuggestions();

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

  const handleCreateSuggestion = async (formData: {
    title: string;
    description: string;
  }) => {
    const { error: createError } = await createSuggestion(
      {
        title: formData.title,
        description: formData.description,
      },
      currentUser.id
    );

    if (createError) {
      console.error("Error creating suggestion:", createError);
      throw createError;
    }

    setShowNewForm(false);
    await loadSuggestions();
  };

  const handleDeleteSuggestion = async (suggestionId: string) => {
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

  const handleEditSuggestion = async (
    suggestionId: string,
    updates: Partial<Suggestion>
  ) => {
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

  const handleStatusChange = async (
    suggestionId: string,
    newStatus: SuggestionStatus
  ) => {
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
  const handleDragStart = (
    e: React.DragEvent,
    suggestion: SuggestionWithUser
  ) => {
    if (!userIsAdmin) return;
    setDraggedItem(suggestion);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!userIsAdmin) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    if (!userIsAdmin) return;
    e.preventDefault();

    if (
      draggedItem &&
      draggedItem.status !== targetStatus &&
      (targetStatus === "new" ||
        targetStatus === "considering" ||
        targetStatus === "in-progress" ||
        targetStatus === "done")
    ) {
      await handleStatusChange(draggedItem.id, targetStatus);
    }

    setDraggedItem(null);
  };

  const getSuggestionsByStatus = (statusId: string) => {
    return suggestions.filter((s) => s.status === statusId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw
            className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2"
            aria-hidden="true"
          />
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
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Lightbulb
                className="w-6 sm:w-8 h-6 sm:h-8 text-purple-600"
                aria-hidden="true"
              />
              Suggestions
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Share your ideas to improve the site
              {userIsAdmin && " • You can drag cards to change status"}
            </p>
          </div>

          <Button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>New Suggestion</span>
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
      </header>

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
              onDrop={(e, targetStatusId) => void handleDrop(e, targetStatusId)}
              onDragStart={handleDragStart}
              onDelete={(id) => void handleDeleteSuggestion(id)}
              onEdit={(id, updatedData) =>
                void handleEditSuggestion(id, updatedData)
              }
            />
          ))}
        </div>
      )}

      {/* Empty State - only show if no errors */}
      {error !== "setup" && suggestions.length === 0 && !showNewForm && (
        <div className="text-center py-12">
          <Lightbulb
            className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"
            aria-hidden="true"
          />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No suggestions yet
          </h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500 mb-6">
            Be the first to share your ideas!
          </p>
          <Button
            onClick={() => setShowNewForm(true)}
            className="inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Create First Suggestion</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default Suggestions;
