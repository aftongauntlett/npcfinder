import React, { useState } from "react";
import MediaDetailModal from "../../shared/media/MediaDetailModal";
import { MediaDetailsContent } from "@/components/shared";
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

  // Build metadata array - keep header minimal
  const metadata: MetadataItem[] = [];

  const handleStatusChange = (newStatus: MediaStatus) => {
    // Map status to played boolean
    // 'completed' means played, anything else means not played
    if (newStatus === "completed" && !game.played) {
      onTogglePlayed();
    } else if (newStatus !== "completed" && game.played) {
      onTogglePlayed();
    }
  };

  // Build additional content using MediaDetailsContent
  const additionalContent = (
    <MediaDetailsContent
      title={game.name}
      details={null}
      loadingDetails={false}
      mediaType="game"
      externalId={game.external_id}
      isCompleted={game.played}
      developer={undefined} // Not available in current schema
      platforms={platformList.join(", ")}
      genre={genreList[0] || undefined} // First genre from list
      year={releaseYear || undefined}
      metacritic={game.metacritic || undefined}
      playtime={game.playtime || undefined}
      rawgRating={game.rating || undefined}
    />
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
