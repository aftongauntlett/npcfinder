import React from "react";
import { Shuffle, List } from "lucide-react";
import { Button } from "@/components/shared";

interface MediaActionButtonsProps {
  onRandomClick: () => void;
  onTopListsClick: () => void;
  disabled?: boolean;
}

const MediaActionButtons: React.FC<MediaActionButtonsProps> = ({
  onRandomClick,
  onTopListsClick,
  disabled = false,
}) => {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={onRandomClick}
        disabled={disabled}
        variant="secondary"
        className="flex items-center gap-2"
      >
        <Shuffle className="w-4 h-4" aria-hidden="true" />
        <span>Random</span>
      </Button>

      <Button
        onClick={onTopListsClick}
        disabled={disabled}
        variant="secondary"
        className="flex items-center gap-2"
      >
        <List className="w-4 h-4" aria-hidden="true" />
        <span>Top 10 Lists</span>
      </Button>
    </div>
  );
};

export default MediaActionButtons;
