import React, { useState } from "react";
import MediaDetailModal from "../../shared/media/MediaDetailModal";
import { MediaContributorList } from "@/components/shared";
import type { GameLibraryItem } from "../../../hooks/useGameLibraryQueries";
import { useUpdateGameRating } from "../../../hooks/useGameLibraryQueries";
import type { MetadataItem } from "../../shared/common/MetadataRow";

type MediaStatus = "planned" | "in-progress" | "completed" | "dropped";

interface GameDetailModalProps {
  game: GameLibraryItem;
  onClose: () => void;
  onTogglePlayed: () => void;
  onRemove: () => void;
}

const GameDetailModal: React.FC<GameDetailModalProps> = ({
  game,
  onClose,
  onTogglePlayed,
  onRemove,
}) => {
  const [rating, setRating] = useState<number | null>(
    game.personal_rating || null
  );
  const [reviewText, setReviewText] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const updateRating = useUpdateGameRating();

  const handleRatingChange = (newRating: number | null) => {
    setRating(newRating);
    void updateRating.mutateAsync({ gameId: game.id, rating: newRating });
  };

  const handleSaveReview = () => {
    // Games don't have review text, so this is just for the interface
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

  // Build metadata array - simple text without icons
  const metadata: MetadataItem[] = [];

  // Only add year if available
  if (releaseYear) {
    metadata.push({
      value: String(releaseYear),
      label: String(releaseYear),
    });
  }

  const handleStatusChange = (newStatus: MediaStatus) => {
    // Map status to played boolean
    // 'completed' means played, anything else means not played
    if (newStatus === "completed" && !game.played) {
      onTogglePlayed();
    } else if (newStatus !== "completed" && game.played) {
      onTogglePlayed();
    }
  };

  // Build additional content section (platforms, playtime, metacritic, RAWG rating)
  const additionalContent = (
    <>
      {platformList.length > 0 && (
        <MediaContributorList
          title="Platforms"
          contributors={platformList}
          variant="chips"
        />
      )}

      {(game.playtime || game.metacritic || game.rating) && (
        <div className="pb-5">
          <h4 className="text-sm font-medium text-primary mb-2.5 mt-0">
            Game Stats
          </h4>
          <div className="space-y-1">
            {game.playtime && (
              <p className="text-base text-gray-700 dark:text-gray-300 m-0">
                Avg Playtime:{" "}
                <span className="font-semibold">{game.playtime}h</span>
              </p>
            )}
            {game.metacritic && (
              <p className="text-base text-gray-700 dark:text-gray-300 m-0">
                Metacritic:{" "}
                <span className="font-semibold">{game.metacritic}/100</span>
              </p>
            )}
            {game.rating && (
              <p className="text-base text-gray-700 dark:text-gray-300 m-0">
                RAWG Rating:{" "}
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {game.rating.toFixed(1)}/5
                </span>
              </p>
            )}
          </div>
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
      description={game.description_raw || undefined}
      status={game.played ? "completed" : "planned"}
      onStatusChange={handleStatusChange}
      onRemove={onRemove}
      showReviewSection={true}
      additionalContent={additionalContent}
      myReview={null}
      friendsReviews={[]}
      rating={rating}
      reviewText={reviewText}
      isPublic={isPublic}
      isSaving={false}
      showSavedMessage={false}
      hasUnsavedChanges={false}
      onRatingChange={handleRatingChange}
      onReviewTextChange={setReviewText}
      onPublicChange={setIsPublic}
      onSaveReview={handleSaveReview}
      onDeleteReview={undefined}
    />
  );
};

export default GameDetailModal;
