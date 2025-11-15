/**
 * @deprecated This component is deprecated in favor of UnifiedMediaCard.
 * Please use UnifiedMediaCard from @/components/shared instead.
 * This component will be removed in a future version.
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
