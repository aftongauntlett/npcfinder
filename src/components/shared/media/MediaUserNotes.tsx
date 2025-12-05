import React from "react";
import { Textarea } from "@/components/shared";

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
      <Textarea
        label={label}
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        onBlur={onNotesBlur}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
};

export default MediaUserNotes;
