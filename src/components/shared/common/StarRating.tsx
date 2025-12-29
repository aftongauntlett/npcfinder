import React, { useState } from "react";
import { Star } from "lucide-react";
import Button from "../ui/Button";

interface StarRatingProps {
  rating: number | null;
  onRatingChange: (rating: number | null) => void;
  size?: "xs" | "sm" | "md" | "lg";
  readonly?: boolean;
  showClearButton?: boolean;
  showLabel?: boolean;
  useThemeColor?: boolean;
  showPlaceholder?: boolean;
  className?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: "Awful",
  2: "Meh",
  3: "Not Bad",
  4: "Pretty Good",
  5: "Awesome",
};

export default function StarRating({
  rating,
  onRatingChange,
  size = "md",
  readonly = false,
  showClearButton = true,
  showLabel = false,
  useThemeColor = false,
  showPlaceholder = false,
  className = "",
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    xs: "w-4 h-4",
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-9 h-9",
  };

  const displayRating = hoverRating ?? rating;

  const handleStarClick = (value: number) => {
    if (readonly) return;
    // Click same rating to clear it
    if (rating === value) {
      onRatingChange(null);
    } else {
      onRatingChange(value);
    }
  };

  const handleClear = () => {
    if (!readonly) {
      onRatingChange(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, value: number) => {
    if (readonly) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleStarClick(value);
    } else if (e.key === "ArrowRight" && value < 5) {
      e.preventDefault();
      onRatingChange(value + 1);
    } else if (e.key === "ArrowLeft" && value > 1) {
      e.preventDefault();
      onRatingChange(value - 1);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <div
          className="flex gap-1"
          role="radiogroup"
          aria-label="Rating"
          onMouseLeave={() => !readonly && setHoverRating(null)}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} star${value !== 1 ? "s" : ""}`}
              disabled={readonly}
              className={`${starSizes[size]} transition-all ${
                readonly ? "cursor-default" : "cursor-pointer"
              }`}
              onClick={() => handleStarClick(value)}
              onMouseEnter={() => !readonly && setHoverRating(value)}
              onKeyDown={(e) => handleKeyDown(e, value)}
              tabIndex={readonly ? -1 : 0}
            >
              <Star
                className={`w-full h-full transition-colors ${
                  displayRating && value <= displayRating
                    ? useThemeColor
                      ? "fill-primary text-primary"
                      : "fill-yellow-400 text-yellow-400"
                    : "fill-none text-gray-300 dark:text-gray-600"
                }`}
              />
            </button>
          ))}
        </div>

        {!readonly && showClearButton && rating !== null && (
          <Button
            variant="subtle"
            size="sm"
            onClick={handleClear}
            className="text-xs"
            aria-label="Clear rating"
          >
            Clear
          </Button>
        )}
      </div>

      {showLabel && (
        <p className="form-label">
          {displayRating
            ? RATING_LABELS[displayRating]
            : showPlaceholder
            ? "No Review Yet"
            : ""}
        </p>
      )}
    </div>
  );
}
