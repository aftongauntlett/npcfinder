/**
 * @deprecated This component will be migrated to use the unified MediaDetailModal.
 * For new features, consider using MediaDetailModal from @/components/shared instead.
 * This component shares 90% of its structure with MovieDetailModal and BookDetailModal.
 * Future work: Migrate to MediaDetailModal to eliminate ~200 lines of duplicated code.
 */

import React, { useState } from "react";
import { Calendar, Award, DollarSign } from "lucide-react";
import MediaDetailModal from "../../shared/MediaDetailModal";
import type { GameLibraryItem } from "../../../hooks/useGameLibraryQueries";
import { useUpdateGameRating } from "../../../hooks/useGameLibraryQueries";
import type { MetadataItem } from "../../shared/MetadataRow";

interface GameDetailModalProps {
  game: GameLibraryItem;
  onClose: () => void;
  onTogglePlayed: () => void;
  onRemove: () => void;
  onRecommend: () => void;
}

const GameDetailModal: React.FC<GameDetailModalProps> = ({
  game,
  onClose,
  onTogglePlayed,
  onRemove,
  onRecommend,
}) => {
  const [rating, setRating] = useState(game.personal_rating || 0);

  const updateRating = useUpdateGameRating();

  const handleRatingChange = (newRating: number | null) => {
    setRating(newRating || 0);
    if (newRating !== null) {
      void updateRating.mutateAsync({ gameId: game.id, rating: newRating });
    }
  };

  const releaseYear = game.released
    ? new Date(game.released).getFullYear()
    : null;

  // Parse genres from comma-separated string
  const genreList = game.genres
    ? game.genres.split(",").map((g: string) => g.trim())
    : [];

  // Parse platforms from comma-separated string
  const platformList = game.platforms
    ? game.platforms.split(",").map((p: string) => p.trim())
    : [];

  // Build metadata array
  const metadata: MetadataItem[] = [
    ...(releaseYear
      ? [{ icon: <Calendar className="w-4 h-4" />, label: String(releaseYear) }]
      : []),
    ...(game.playtime
      ? [
          {
            icon: <Award className="w-4 h-4" />,
            label: `${game.playtime}h avg playtime`,
          },
        ]
      : []),
    ...(game.metacritic
      ? [
          {
            icon: <DollarSign className="w-4 h-4" />,
            label: `Metacritic: ${game.metacritic}`,
          },
        ]
      : []),
  ];

  // Build additional content section (platforms + RAWG rating)
  const additionalContent = (
    <>
      {platformList.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Platforms
          </h3>
          <div className="flex flex-wrap gap-2">
            {platformList.map((platform: string) => (
              <span
                key={platform}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      )}

      {game.rating && (
        <div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            RAWG Rating:{" "}
          </span>
          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
            {game.rating.toFixed(1)}/5
          </span>
        </div>
      )}
    </>
  );

  return (
    <MediaDetailModal
      isOpen={true}
      onClose={onClose}
      mediaType="game"
      title={game.name}
      posterUrl={game.background_image || undefined}
      metadata={metadata}
      genres={genreList}
      description={undefined}
      status={{
        label: game.played ? "played" : "playing",
        isCompleted: game.played,
      }}
      rating={rating}
      onRatingChange={handleRatingChange}
      onToggleStatus={onTogglePlayed}
      onRecommend={onRecommend}
      onRemove={onRemove}
      additionalContent={additionalContent}
      reviewSection={undefined}
    />
  );
};

export default GameDetailModal;
