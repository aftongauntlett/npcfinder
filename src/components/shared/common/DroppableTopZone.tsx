import React from "react";

interface DroppableTopZoneProps {
  visible: boolean;
  isActive: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  label?: string;
}

const DroppableTopZone: React.FC<DroppableTopZoneProps> = ({
  visible,
  isActive,
  onDragOver,
  onDragLeave,
  onDrop,
  label = "Drop here to move to top",
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`h-8 flex items-center justify-center transition-all duration-200 -mb-2 ${
        isActive
          ? "bg-primary/10 border-2 border-dashed border-primary rounded-lg"
          : "border-2 border-transparent"
      }`}
    >
      {isActive && (
        <span className="text-sm text-primary font-medium">{label}</span>
      )}
    </div>
  );
};

export default DroppableTopZone;
