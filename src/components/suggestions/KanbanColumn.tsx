import React from "react";
import SuggestionCard from "./SuggestionCard";
import type { SuggestionWithUser } from "../../lib/suggestions";

interface StatusConfig {
  id: string;
  label: string;
  color: string;
}

interface KanbanColumnProps {
  status: StatusConfig;
  suggestions: SuggestionWithUser[];
  isAdmin?: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, statusId: string) => void;
  onDragStart: (e: React.DragEvent, suggestion: SuggestionWithUser) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: { title: string; description: string }) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  suggestions,
  isAdmin = false,
  onDragOver,
  onDrop,
  onDragStart,
  onDelete,
  onEdit,
}) => {
  return (
    <div
      className={`rounded-lg border-2 ${status.color} p-4`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status.id)}
    >
      {/* Column Header */}
      <header className="mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center justify-between">
          <span>{status.label}</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {suggestions.length}
          </span>
        </h2>
      </header>

      {/* Cards */}
      <div className="space-y-3 min-h-[200px]">
        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
            No suggestions yet
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              draggable={isAdmin}
              onDragStart={(e) => onDragStart(e, suggestion)}
              className={isAdmin ? "cursor-move" : ""}
            >
              <SuggestionCard
                suggestion={suggestion}
                isAdmin={isAdmin}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
