import React from "react";
import PropTypes from "prop-types";
import SuggestionCard from "./SuggestionCard";

const KanbanColumn = ({
  status,
  suggestions,
  isAdmin,
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
      <div className="mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center justify-between">
          <span>{status.label}</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {suggestions.length}
          </span>
        </h2>
      </div>

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

KanbanColumn.propTypes = {
  status: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
  }).isRequired,
  suggestions: PropTypes.array.isRequired,
  isAdmin: PropTypes.bool,
  onDragOver: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
  onDragStart: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

export default KanbanColumn;
