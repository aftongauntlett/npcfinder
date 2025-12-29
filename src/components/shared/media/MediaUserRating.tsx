import React from "react";
import StarRating from "../common/StarRating";

interface MediaUserRatingProps {
  rating: number | null;
  onRatingChange: (rating: number | null) => void;
  label?: string;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  showClearButton?: boolean;
  className?: string;
}

const MediaUserRating: React.FC<MediaUserRatingProps> = ({
  rating,
  onRatingChange,
  label = "Your Rating",
  size = "sm",
  showLabel = true,
  className = "",
}) => {
  return (
    <div className={`pb-5 ${className}`}>
      <label className="block form-label mb-2">{label}</label>
      <StarRating
        rating={rating ?? 0}
        onRatingChange={onRatingChange}
        size={size}
        useThemeColor={true}
        showLabel={showLabel}
        showPlaceholder={true}
      />
    </div>
  );
};

export default MediaUserRating;
