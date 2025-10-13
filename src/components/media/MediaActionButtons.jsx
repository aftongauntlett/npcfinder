import React from "react";
import PropTypes from "prop-types";
import { Shuffle, List } from "lucide-react";
import Button from "../shared/Button";

/**
 * Action buttons for media pages (Random Suggestion, Top 10 Lists, etc.)
 */
const MediaActionButtons = ({
  onRandomClick,
  onTopListsClick,
  disabled = false,
}) => {
  return (
    <div className="flex gap-3">
      <Button
        onClick={onRandomClick}
        disabled={disabled}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Shuffle className="w-4 h-4" />
        <span>Random</span>
      </Button>

      <Button
        onClick={onTopListsClick}
        disabled={disabled}
        variant="outline"
        className="flex items-center gap-2"
      >
        <List className="w-4 h-4" />
        <span>Top 10 Lists</span>
      </Button>
    </div>
  );
};

MediaActionButtons.propTypes = {
  onRandomClick: PropTypes.func.isRequired,
  onTopListsClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default MediaActionButtons;
