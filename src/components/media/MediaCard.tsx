/**
 * @deprecated This component is deprecated in favor of UnifiedMediaCard.
 *
 * Migration Path:
 * Replace `<MediaCard ... />` with `<UnifiedMediaCard mediaType='movie' ... />`
 *
 * This wrapper only exists for backward compatibility and provides no additional functionality.
 * All new code should use UnifiedMediaCard directly.
 *
 * TODO: Remove in v2.0.0
 */

import React from "react";
import UnifiedMediaCard from "../shared/UnifiedMediaCard";
import { type MediaStatus } from "./mediaStatus";

interface MediaCardProps {
  id: string | number;
  title: string;
  posterUrl?: string;
  year?: string | number;
  personalRating?: number;
  status?: MediaStatus;
  onClick: (id: string | number) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({
  id,
  title,
  posterUrl,
  year,
  personalRating,
  status,
  onClick,
}) => {
  return (
    <UnifiedMediaCard
      id={id}
      title={title}
      posterUrl={posterUrl}
      year={year}
      personalRating={personalRating}
      status={status}
      mediaType="movie"
      onClick={onClick}
    />
  );
};

export default MediaCard;
