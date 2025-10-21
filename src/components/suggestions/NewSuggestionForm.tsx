import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import Button from "../shared/Button";
import Input from "../shared/Input";
import Textarea from "../shared/Textarea";

interface SuggestionFormData {
  title: string;
  description: string;
}

interface NewSuggestionFormProps {
  onSubmit: (data: SuggestionFormData) => Promise<void>;
  onCancel?: () => void;
}

const NewSuggestionForm: React.FC<NewSuggestionFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({ title: title.trim(), description: description.trim() });
      setTitle("");
      setDescription("");
    } catch (err) {
      setError("Failed to submit suggestion. Please try again.");
      console.error("Error submitting suggestion:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-purple-600" aria-hidden="true" />
          New Suggestion
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(e);
        }}
        className="space-y-4"
      >
        {error && (
          <div
            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </div>
        )}

        <Input
          id="title"
          label="Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Add dark mode toggle to navigation"
          disabled={isSubmitting}
          maxLength={200}
          required
        />

        <Textarea
          id="description"
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide more details about your suggestion..."
          rows={4}
          disabled={isSubmitting}
          maxLength={1000}
          resize="none"
        />

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="flex-1"
          >
            {isSubmitting ? "Submitting..." : "Submit Suggestion"}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="subtle"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default NewSuggestionForm;
