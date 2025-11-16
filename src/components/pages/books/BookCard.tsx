/**
 * @deprecated This component is deprecated in favor of UnifiedMediaCard.
 *
 * Migration Path:
 * Replace `<BookCard ... />` with `<UnifiedMediaCard mediaType='book' ... />`
 *
 * This wrapper only exists for backward compatibility and provides no additional functionality.
 * All new code should use UnifiedMediaCard directly.
 *
 * TODO: Remove in v2.0.0
 */

import React from "react";
import UnifiedMediaCard from "../../shared/UnifiedMediaCard";

interface BookCardProps {
  id: string | number;
  title: string;
  author?: string | null;
  thumbnailUrl?: string | null;
  year?: string | number;
  personalRating?: number | null;
  status?: "reading" | "read";
  onClick: (id: string | number) => void;
}

const BookCard: React.FC<BookCardProps> = ({
  id,
  title,
  author,
  thumbnailUrl,
  year,
  personalRating,
  status,
  onClick,
}) => {
  return (
    <UnifiedMediaCard
      id={id}
      title={title}
      subtitle={author || undefined}
      posterUrl={thumbnailUrl || undefined}
      year={year}
      personalRating={personalRating || undefined}
      status={status}
      mediaType="book"
      onClick={onClick}
    />
  );
};

export default BookCard;
