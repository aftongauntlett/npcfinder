import React, { useState } from "react";
import { Calendar, Disc, Music2 } from "lucide-react";
import MediaDetailModal from "../../shared/media/MediaDetailModal";
import { MediaDetailsContent } from "@/components/shared";
import type { MusicLibraryItem } from "../../../services/musicService.types";
import {
  useUpdateMusicRating,
  useUpdateMusicNotes,
} from "../../../hooks/useMusicLibraryQueries";
import type { MetadataItem } from "../../shared/common/MetadataRow";

type MediaStatus = "planned" | "in-progress" | "completed" | "dropped";

interface MusicDetailModalProps {
  music: MusicLibraryItem;
  onClose: () => void;
  onToggleListened: () => void;
  onRemove: () => void;
}

const MusicDetailModal: React.FC<MusicDetailModalProps> = ({
  music,
  onClose,
  onToggleListened,
  onRemove,
}) => {
  const [rating, setRating] = useState<number | null>(
    music.personal_rating || null
  );
  const [notes, setNotes] = useState(music.personal_notes || "");
  const [isPublic, setIsPublic] = useState(false);

  const updateRating = useUpdateMusicRating();
  const updateNotes = useUpdateMusicNotes();

  const handleRatingChange = (newRating: number | null) => {
    setRating(newRating);
    void updateRating.mutateAsync({ musicId: music.id, rating: newRating });
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
  };

  const handleSaveReview = () => {
    if (notes !== music.personal_notes) {
      void updateNotes.mutateAsync({ musicId: music.id, notes: notes || null });
    }
  };

  const handleStatusChange = (newStatus: MediaStatus) => {
    if (newStatus === "completed" && !music.listened) {
      onToggleListened();
    } else if (newStatus !== "completed" && music.listened) {
      onToggleListened();
    }
  };

  const displayYear = music.release_date
    ? new Date(music.release_date).getFullYear()
    : null;

  const metadata: MetadataItem[] = [
    ...(displayYear
      ? [
          {
            icon: Calendar,
            value: String(displayYear),
            label: String(displayYear),
          },
        ]
      : []),
    ...(music.media_type
      ? [
          {
            icon: music.media_type === "album" ? Disc : Music2,
            value:
              music.media_type.charAt(0).toUpperCase() +
              music.media_type.slice(1),
            label:
              music.media_type.charAt(0).toUpperCase() +
              music.media_type.slice(1),
          },
        ]
      : []),
  ];

  // Build additional content using MediaDetailsContent
  const additionalContent = (
    <MediaDetailsContent
      title={music.title}
      details={null}
      loadingDetails={false}
      mediaType={music.media_type as "song" | "album" | "playlist"}
      externalId={music.external_id}
      isCompleted={music.listened}
      artist={music.artist || undefined}
      album={music.media_type === "song" ? music.album || undefined : undefined}
      genre={music.genre || undefined}
      year={displayYear || undefined}
      trackDuration={music.track_duration || undefined}
      trackCount={
        music.media_type === "album"
          ? music.track_count || undefined
          : undefined
      }
      previewUrl={music.preview_url || undefined}
    />
  );

  const currentStatus: MediaStatus = music.listened ? "completed" : "planned";

  return (
    <MediaDetailModal
      isOpen={true}
      onClose={onClose}
      mediaType="music"
      title={music.title}
      posterUrl={music.album_cover_url || undefined}
      metadata={metadata}
      genres={music.genre ? [music.genre] : []}
      description={undefined}
      status={currentStatus}
      onStatusChange={handleStatusChange}
      onRemove={onRemove}
      showReviewSection={true}
      additionalContent={additionalContent}
      myReview={null}
      friendsReviews={[]}
      rating={rating}
      reviewText={notes}
      isPublic={isPublic}
      isSaving={false}
      showSavedMessage={false}
      hasUnsavedChanges={false}
      onRatingChange={handleRatingChange}
      onReviewTextChange={handleNotesChange}
      onPublicChange={setIsPublic}
      onSaveReview={handleSaveReview}
      onDeleteReview={undefined}
    />
  );
};

export default MusicDetailModal;
