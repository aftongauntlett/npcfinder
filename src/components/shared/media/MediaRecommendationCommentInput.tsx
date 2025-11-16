import Button from "../ui/Button";

interface MediaRecommendationCommentInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void | Promise<void>;
  onCancel: () => void;
  placeholder: string;
  autoFocus?: boolean;
}

/**
 * MediaRecommendationCommentInput - Comment input section for recommendation cards
 *
 * Handles the comment input UI for both recipient and sender comments.
 * Includes keyboard shortcuts (Enter to save, Escape to cancel) and focus styling.
 */
function MediaRecommendationCommentInput({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder,
  autoFocus = true,
}: MediaRecommendationCommentInputProps) {
  return (
    <div className="mt-3 pl-20">
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") void onSave();
            if (e.key === "Escape") onCancel();
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--color-primary)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "";
          }}
          autoFocus={autoFocus}
        />
        <div className="flex justify-end gap-2">
          <Button onClick={onCancel} variant="subtle" size="sm">
            Cancel
          </Button>
          <Button onClick={() => void onSave()} variant="primary" size="sm">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MediaRecommendationCommentInput;
