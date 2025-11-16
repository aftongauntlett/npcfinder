import React, { useState } from "react";
import { Calendar, Award, DollarSign } from "lucide-react";
import MediaDetailModal from "../../shared/media/MediaDetailModal";
import type { GameLibraryItem } from "../../../hooks/useGameLibraryQueries";
import { useUpdateGameRating } from "../../../hooks/useGameLibraryQueries";
import type { MetadataItem } from "../../shared/common/MetadataRow";

type MediaStatus = "planned" | "in-progress" | "completed" | "dropped";

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
      ? [
          {
            icon: Calendar,
            value: String(releaseYear),
            label: String(releaseYear),
          },
        ]
      : []),
    ...(game.playtime
      ? [
          {
            icon: Award,
            value: `${game.playtime}h avg playtime`,
            label: `${game.playtime}h avg playtime`,
          },
        ]
      : []),
    ...(game.metacritic
      ? [
          {
            icon: DollarSign,
            value: `Metacritic: ${game.metacritic}`,
            label: `Metacritic: ${game.metacritic}`,
          },
        ]
      : []),
  ];

  const handleStatusChange = (newStatus: MediaStatus) => {
    // Map status to played boolean
    // 'completed' means played, anything else means not played
    if (newStatus === "completed" && !game.played) {
      onTogglePlayed();
    } else if (newStatus !== "completed" && game.played) {
      onTogglePlayed();
    }
  };

  // Build additional content section (platforms + RAWG rating)
  const additionalContent = (
    <>
      {platformList.length > 0 && (
        <div className="pb-5">
          <h3 className="text-sm font-medium text-primary mb-2.5 mt-0">
            Platforms
          </h3>
          <div className="flex flex-wrap gap-2">
            {platformList.map((platform: string) => (
              <span
                key={platform}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-default"
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
      status={game.played ? "completed" : "planned"}
      onStatusChange={handleStatusChange}
      onRecommend={onRecommend}
      onRemove={onRemove}
      showReviewSection={false}
      additionalContent={additionalContent}
      reviewSection={undefined}
      myReview={null}
      friendsReviews={[]}
      rating={rating}
      reviewText=""
      isPublic={true}
      isSaving={false}
      showSavedMessage={false}
      hasUnsavedChanges={false}
      onRatingChange={handleRatingChange}
      onReviewTextChange={() => {}}
      onPublicChange={() => {}}
      onSaveReview={() => {}}
      onDeleteReview={undefined}
    />
  );
};

export default GameDetailModal;
