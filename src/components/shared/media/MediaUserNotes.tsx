import React from "react";

interface MediaUserNotesProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  onNotesBlur?: () => void;
  placeholder?: string;
  label?: string;
  rows?: number;
  className?: string;
}

const MediaUserNotes: React.FC<MediaUserNotesProps> = ({
  notes,
  onNotesChange,
  onNotesBlur,
  placeholder = "Add your thoughts, notes, or favorite quotes...",
  label = "Your Notes",
  rows = 4,
  className = "",
}) => {
  return (
    <div className={`pb-5 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        onBlur={onNotesBlur}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
      />
    </div>
  );
};

export default MediaUserNotes;
