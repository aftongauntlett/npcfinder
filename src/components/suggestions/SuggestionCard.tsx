import React, { useState } from "react";
import { Trash2, Edit2, User, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { SuggestionWithUser } from "../../lib/suggestions";

interface SuggestionCardProps {
  suggestion: SuggestionWithUser;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (
    id: string,
    updates: { title: string; description: string }
  ) => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  isAdmin = false,
  onDelete = () => {},
  onEdit = () => {},
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(suggestion.title);
  const [editedDescription, setEditedDescription] = useState(
    suggestion.description || ""
  );

  const handleSaveEdit = () => {
    onEdit(suggestion.id, {
      title: editedTitle,
      description: editedDescription,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(suggestion.title);
    setEditedDescription(suggestion.description || "");
    setIsEditing(false);
  };

  const formatDate = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {isEditing ? (
        // Edit Mode
        <div className="space-y-3">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Title"
            aria-label="Edit suggestion title"
          />
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            placeholder="Description"
            rows={3}
            aria-label="Edit suggestion description"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // View Mode
        <>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight flex-1">
              {suggestion.title}
            </h3>
            {isAdmin && (
              <div className="flex gap-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  aria-label="Edit suggestion"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(suggestion.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  aria-label="Delete suggestion"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {suggestion.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 whitespace-pre-wrap">
              {suggestion.description}
            </p>
          )}

          <footer className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" aria-hidden="true" />
              <span>{suggestion.display_name || "Anonymous"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" aria-hidden="true" />
              <time dateTime={suggestion.created_at}>
                {formatDate(suggestion.created_at)}
              </time>
            </div>
          </footer>
        </>
      )}
    </article>
  );
};

export default SuggestionCard;
