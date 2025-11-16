import React, { useState } from "react";
import { Calendar, Disc, Music2 } from "lucide-react";
import MediaDetailModal from "../../shared/media/MediaDetailModal";
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
  onRecommend: () => void;
}

const MusicDetailModal: React.FC<MusicDetailModalProps> = ({
  music,
  onClose,
  onToggleListened,
  onRemove,
  onRecommend,
}) => {
  const [rating, setRating] = useState(music.personal_rating || 0);
  const [notes, setNotes] = useState(music.personal_notes || "");

  const updateRating = useUpdateMusicRating();
  const updateNotes = useUpdateMusicNotes();

  const handleRatingChange = (newRating: number | null) => {
    setRating(newRating || 0);
    if (newRating !== null) {
      void updateRating.mutateAsync({ musicId: music.id, rating: newRating });
    }
  };

  const handleNotesBlur = () => {
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

  const additionalContent = (
    <>
      {music.artist && (
        <div>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            by {music.artist}
          </p>
        </div>
      )}

      {music.album && music.media_type === "song" && (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            from {music.album}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Add your thoughts about this music..."
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-gray-900 dark:text-white placeholder-gray-400"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Your Rating
        </label>
        <div className="flex items-center gap-2">
          <div className="scale-125">
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(star)}
                    className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  >
                    <svg
                      className={`w-8 h-8 ${
                        star <= rating
                          ? "text-yellow-500 fill-current"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {rating > 0 && (
            <button
              onClick={() => handleRatingChange(0)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 ml-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </>
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
      onRecommend={onRecommend}
      showReviewSection={false}
      rating={null}
      reviewText=""
      isPublic={false}
      isSaving={false}
      showSavedMessage={false}
      hasUnsavedChanges={false}
      onRatingChange={() => {}}
      onReviewTextChange={() => {}}
      onPublicChange={() => {}}
      onSaveReview={() => {}}
      onDeleteReview={() => {}}
      additionalContent={additionalContent}
    />
  );
};

export default MusicDetailModal;
