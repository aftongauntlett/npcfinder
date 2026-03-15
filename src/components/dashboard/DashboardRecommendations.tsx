import React, { useMemo, useState } from "react";
import {
  BookOpen,
  Clapperboard,
  Gamepad2,
  Music,
  Tv as TvIcon,
} from "lucide-react";
import {
  MediaRecommendationCard,
  InlineRecommendationsLayout,
  Button,
  type BaseRecommendation,
} from "@/components/shared";
import { logger } from "@/lib/logger";
import {
  useUpdateMovieRecommendationStatus,
  useDeleteMovieRecommendation,
  useUpdateSenderNote as useUpdateMovieSenderNote,
  useUpdateRecipientNote as useUpdateMovieRecipientNote,
} from "@/hooks/useMovieQueries";
import { useMovieRecommendationsData } from "@/hooks/useMovieRecommendationsData";
import {
  useUpdateBookRecommendationStatus,
  useDeleteBookRecommendation,
  useUpdateSenderNote as useUpdateBookSenderNote,
  useUpdateRecipientNote as useUpdateBookRecipientNote,
} from "@/hooks/useBookQueries";
import { useBookRecommendationsData } from "@/hooks/useBookRecommendationsData";
import {
  useUpdateGameRecommendationStatus,
  useDeleteGameRecommendation,
  useUpdateSenderNote as useUpdateGameSenderNote,
  useUpdateRecipientNote as useUpdateGameRecipientNote,
} from "@/hooks/useGameQueries";
import { useGameRecommendationsData } from "@/hooks/useGameRecommendationsData";
import {
  useDeleteRecommendation as useDeleteMusicRecommendation,
  useFriendsWithMusicRecs,
  useMusicRecommendations,
  useMusicStats,
  useUpdateRecommendationStatus as useUpdateMusicRecommendationStatus,
  useUpdateRecipientNote as useUpdateMusicRecipientNote,
  useUpdateSenderNote as useUpdateMusicSenderNote,
} from "@/hooks/useMusicQueries";

type RecommendationMediaTab = "movies" | "books" | "games" | "music";

interface RecommendationWithMedia extends BaseRecommendation {
  media_type?: string;
  release_date?: string | null;
  overview?: string | null;
  poster_url?: string | null;
  cover_url?: string | null;
  background_image?: string | null;
  status: string;
  title: string;
  subtitle?: string | null;
  author?: string | null;
  artist?: string | null;
  album?: string | null;
  genres?: string | null;
  platforms?: string | null;
}

interface MusicRawRecommendation {
  id: string;
  from_user_id: string;
  to_user_id: string;
  external_id: string;
  title: string;
  media_type?: "song" | "album";
  artist?: string | null;
  album?: string | null;
  year?: number;
  poster_url?: string | null;
  status: string;
  sender_name?: string;
  recipient_name?: string;
  sender_note?: string | null;
  recipient_note?: string | null;
  sent_message?: string | null;
  watched_at?: string | null;
  created_at: string;
}

function DashboardRecommendationsComponent() {
  const [activeTab, setActiveTab] = useState<RecommendationMediaTab>("movies");

  const movieData = useMovieRecommendationsData();
  const bookData = useBookRecommendationsData();
  const gameData = useGameRecommendationsData();

  const { data: musicFriends = [], isLoading: musicFriendsLoading } =
    useFriendsWithMusicRecs();
  const { data: musicStats = { hits: 0, misses: 0, queue: 0, sent: 0 } } =
    useMusicStats();
  const { data: musicHitsData = [] } = useMusicRecommendations("hits");
  const { data: musicMissesData = [] } = useMusicRecommendations("misses");
  const { data: musicSentData = [] } = useMusicRecommendations("sent");
  const { data: musicPendingData = [] } = useMusicRecommendations("queue");

  const updateMovieStatusMutation = useUpdateMovieRecommendationStatus();
  const deleteMovieRecMutation = useDeleteMovieRecommendation();
  const updateMovieSenderNoteMutation = useUpdateMovieSenderNote();
  const updateMovieRecipientNoteMutation = useUpdateMovieRecipientNote();

  const updateBookStatusMutation = useUpdateBookRecommendationStatus();
  const deleteBookRecMutation = useDeleteBookRecommendation();
  const updateBookSenderNoteMutation = useUpdateBookSenderNote();
  const updateBookRecipientNoteMutation = useUpdateBookRecipientNote();

  const updateGameStatusMutation = useUpdateGameRecommendationStatus();
  const deleteGameRecMutation = useDeleteGameRecommendation();
  const updateGameSenderNoteMutation = useUpdateGameSenderNote();
  const updateGameRecipientNoteMutation = useUpdateGameRecipientNote();

  const updateMusicStatusMutation = useUpdateMusicRecommendationStatus();
  const deleteMusicRecMutation = useDeleteMusicRecommendation();
  const updateMusicSenderNoteMutation = useUpdateMusicSenderNote();
  const updateMusicRecipientNoteMutation = useUpdateMusicRecipientNote();

  const musicHits = useMemo(() => {
    return (musicHitsData as MusicRawRecommendation[]).map((rec) => ({
      ...rec,
      sent_message: rec.sent_message ?? null,
      sent_at: rec.created_at,
      consumed_at: rec.watched_at ?? null,
      sender_comment: rec.sender_note ?? null,
      comment: rec.recipient_note ?? null,
      subtitle: [rec.artist, rec.album].filter(Boolean).join(" • ") || null,
      status: "hit",
    }));
  }, [musicHitsData]);

  const musicMisses = useMemo(() => {
    return (musicMissesData as MusicRawRecommendation[]).map((rec) => ({
      ...rec,
      sent_message: rec.sent_message ?? null,
      sent_at: rec.created_at,
      consumed_at: rec.watched_at ?? null,
      sender_comment: rec.sender_note ?? null,
      comment: rec.recipient_note ?? null,
      subtitle: [rec.artist, rec.album].filter(Boolean).join(" • ") || null,
      status: "miss",
    }));
  }, [musicMissesData]);

  const musicSent = useMemo(() => {
    return (musicSentData as MusicRawRecommendation[]).map((rec) => ({
      ...rec,
      sent_message: rec.sent_message ?? null,
      sent_at: rec.created_at,
      consumed_at: rec.watched_at ?? null,
      sender_comment: rec.sender_note ?? null,
      comment: rec.recipient_note ?? null,
      subtitle: [rec.artist, rec.album].filter(Boolean).join(" • ") || null,
      status:
        rec.status === "consumed" || rec.status === "watched"
          ? "watched"
          : rec.status,
    }));
  }, [musicSentData]);

  const { musicFriendRecommendations, musicUserNameMap } = useMemo(() => {
    const recommendations = new Map<string, RecommendationWithMedia[]>();
    const userNameMap = new Map<string, string>();

    musicFriends.forEach((friend) => {
      userNameMap.set(friend.user_id, friend.display_name);
    });

    (musicSentData as MusicRawRecommendation[]).forEach((rec) => {
      if (rec.recipient_name && rec.to_user_id) {
        userNameMap.set(rec.to_user_id, rec.recipient_name);
      }
    });

    (musicPendingData as MusicRawRecommendation[]).forEach((rec) => {
      if (rec.sender_name && rec.from_user_id) {
        userNameMap.set(rec.from_user_id, rec.sender_name);
      }

      const transformed: RecommendationWithMedia = {
        ...rec,
        sent_message: rec.sent_message ?? null,
        sent_at: rec.created_at,
        consumed_at: rec.watched_at ?? null,
        sender_comment: rec.sender_note ?? null,
        comment: rec.recipient_note ?? null,
        subtitle: [rec.artist, rec.album].filter(Boolean).join(" • ") || null,
        status: "pending",
      };

      if (!recommendations.has(rec.from_user_id)) {
        recommendations.set(rec.from_user_id, []);
      }
      recommendations.get(rec.from_user_id)?.push(transformed);
    });

    return {
      musicFriendRecommendations: recommendations,
      musicUserNameMap: userNameMap,
    };
  }, [musicFriends, musicPendingData, musicSentData]);

  const renderRecommendationCard = (
    rec: RecommendationWithMedia,
    isReceived: boolean,
    index = 0,
    media: RecommendationMediaTab,
  ) => {
    const senderName = isReceived
      ? getUserNameMap(media).get(rec.from_user_id) || "Unknown User"
      : getUserNameMap(media).get(rec.to_user_id) || "Unknown User";

    return (
      <MediaRecommendationCard
        key={rec.id}
        rec={rec}
        index={index}
        isReceived={isReceived}
        senderName={senderName}
        onStatusUpdate={(recId, status, comment) =>
          updateRecommendationStatus(media, recId, status, comment)
        }
        onDelete={(recId) => deleteRecommendation(media, recId)}
        onUpdateSenderComment={(recId, note) =>
          updateSenderComment(media, recId, note)
        }
        renderMediaArt={(item) => {
          const imageUrl =
            item.poster_url || item.cover_url || item.background_image;
          const icon =
            media === "movies"
              ? item.media_type === "tv"
                ? TvIcon
                : Clapperboard
              : media === "books"
                ? BookOpen
                : media === "games"
                  ? Gamepad2
                  : Music;

          if (imageUrl) {
            return (
              <img
                src={imageUrl}
                alt={item.title}
                loading="lazy"
                className="w-12 h-16 rounded object-cover"
              />
            );
          }

          const FallbackIcon = icon;
          return (
            <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <FallbackIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
          );
        }}
        renderMediaInfo={(item) => (
          <>
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {item.title}
            </div>
            {item.subtitle ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {item.subtitle}
              </div>
            ) : null}
            {item.release_date || item.genres || item.platforms ? (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                {item.release_date || item.genres || item.platforms}
              </div>
            ) : null}
            {item.overview ? (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {item.overview}
              </div>
            ) : null}
          </>
        )}
      />
    );
  };

  const getUserNameMap = (media: RecommendationMediaTab) => {
    if (media === "movies") return movieData.userNameMap;
    if (media === "books") return bookData.userNameMap;
    if (media === "games") return gameData.userNameMap;
    return musicUserNameMap;
  };

  const updateRecommendationStatus = async (
    media: RecommendationMediaTab,
    recId: string,
    status: string,
    comment?: string,
  ) => {
    try {
      if (media === "movies") {
        const movieStatus = status === "consumed" ? "watched" : status;
        await updateMovieStatusMutation.mutateAsync({
          recId,
          status: movieStatus,
        });
        if (comment !== undefined) {
          await updateMovieRecipientNoteMutation.mutateAsync({
            recId,
            note: comment,
          });
        }
        return;
      }

      if (media === "books") {
        const bookStatus = status === "consumed" ? "read" : status;
        await updateBookStatusMutation.mutateAsync({
          recId,
          status: bookStatus,
        });
        if (comment !== undefined) {
          await updateBookRecipientNoteMutation.mutateAsync({
            recId,
            note: comment,
          });
        }
        return;
      }

      if (media === "games") {
        const gameStatus = status === "consumed" ? "played" : status;
        await updateGameStatusMutation.mutateAsync({
          recId,
          status: gameStatus,
        });
        if (comment !== undefined) {
          await updateGameRecipientNoteMutation.mutateAsync({
            recId,
            note: comment,
          });
        }
        return;
      }

      const musicStatus = status === "consumed" ? "consumed" : status;
      await updateMusicStatusMutation.mutateAsync({
        recId,
        status: musicStatus,
      });
      if (comment !== undefined) {
        await updateMusicRecipientNoteMutation.mutateAsync({
          recId,
          note: comment,
        });
      }
    } catch (error) {
      logger.error("Failed to update recommendation", { error, media, recId });
    }
  };

  const updateSenderComment = async (
    media: RecommendationMediaTab,
    recId: string,
    note: string,
  ) => {
    try {
      if (media === "movies") {
        await updateMovieSenderNoteMutation.mutateAsync({ recId, note });
        return;
      }
      if (media === "books") {
        await updateBookSenderNoteMutation.mutateAsync({ recId, note });
        return;
      }
      if (media === "games") {
        await updateGameSenderNoteMutation.mutateAsync({ recId, note });
        return;
      }
      await updateMusicSenderNoteMutation.mutateAsync({ recId, note });
    } catch (error) {
      logger.error("Failed to update sender comment", { error, media, recId });
    }
  };

  const deleteRecommendation = async (
    media: RecommendationMediaTab,
    recId: string,
  ) => {
    try {
      if (media === "movies") {
        await deleteMovieRecMutation.mutateAsync(recId);
        return;
      }
      if (media === "books") {
        await deleteBookRecMutation.mutateAsync(recId);
        return;
      }
      if (media === "games") {
        await deleteGameRecMutation.mutateAsync(recId);
        return;
      }
      await deleteMusicRecMutation.mutateAsync(recId);
    } catch (error) {
      logger.error("Failed to delete recommendation", { error, media, recId });
    }
  };

  const tabClass = (tab: RecommendationMediaTab) =>
    activeTab === tab
      ? "bg-primary text-white"
      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300";

  return (
    <div className="container mx-auto px-4 sm:px-6">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant="subtle"
          className={tabClass("movies")}
          onClick={() => setActiveTab("movies")}
        >
          Movies & TV
        </Button>
        <Button
          variant="subtle"
          className={tabClass("books")}
          onClick={() => setActiveTab("books")}
        >
          Books
        </Button>
        <Button
          variant="subtle"
          className={tabClass("games")}
          onClick={() => setActiveTab("games")}
        >
          Games
        </Button>
        <Button
          variant="subtle"
          className={tabClass("music")}
          onClick={() => setActiveTab("music")}
        >
          Music
        </Button>
      </div>

      {activeTab === "movies" && (
        <InlineRecommendationsLayout
          mediaType="Movies & TV"
          mediaIcon={Clapperboard}
          emptyMessage="No recommendations yet"
          emptySubMessage="When friends recommend movies or TV shows, they'll show up here"
          loading={movieData.loading}
          friendsWithRecs={movieData.friendsWithRecs}
          quickStats={movieData.quickStats}
          hits={movieData.hits as RecommendationWithMedia[]}
          misses={movieData.misses as RecommendationWithMedia[]}
          sent={movieData.sent as RecommendationWithMedia[]}
          friendRecommendations={
            movieData.friendRecommendations as Map<
              string,
              RecommendationWithMedia[]
            >
          }
          renderRecommendationCard={(rec, isReceived, index) =>
            renderRecommendationCard(
              rec as RecommendationWithMedia,
              isReceived,
              index,
              "movies",
            )
          }
        />
      )}

      {activeTab === "books" && (
        <InlineRecommendationsLayout
          mediaType="Books"
          mediaIcon={BookOpen}
          emptyMessage="No recommendations yet"
          emptySubMessage="When friends recommend books, they'll show up here"
          loading={bookData.loading}
          friendsWithRecs={bookData.friendsWithRecs}
          quickStats={bookData.quickStats}
          hits={bookData.hits as RecommendationWithMedia[]}
          misses={bookData.misses as RecommendationWithMedia[]}
          sent={bookData.sent as RecommendationWithMedia[]}
          friendRecommendations={
            bookData.friendRecommendations as Map<
              string,
              RecommendationWithMedia[]
            >
          }
          renderRecommendationCard={(rec, isReceived, index) =>
            renderRecommendationCard(
              rec as RecommendationWithMedia,
              isReceived,
              index,
              "books",
            )
          }
        />
      )}

      {activeTab === "games" && (
        <InlineRecommendationsLayout
          mediaType="Games"
          mediaIcon={Gamepad2}
          emptyMessage="No recommendations yet"
          emptySubMessage="When friends recommend games, they'll show up here"
          loading={gameData.loading}
          friendsWithRecs={gameData.friendsWithRecs}
          quickStats={gameData.quickStats}
          hits={gameData.hits as RecommendationWithMedia[]}
          misses={gameData.misses as RecommendationWithMedia[]}
          sent={gameData.sent as RecommendationWithMedia[]}
          friendRecommendations={
            gameData.friendRecommendations as Map<
              string,
              RecommendationWithMedia[]
            >
          }
          renderRecommendationCard={(rec, isReceived, index) =>
            renderRecommendationCard(
              rec as RecommendationWithMedia,
              isReceived,
              index,
              "games",
            )
          }
        />
      )}

      {activeTab === "music" && (
        <InlineRecommendationsLayout
          mediaType="Music"
          mediaIcon={Music}
          emptyMessage="No recommendations yet"
          emptySubMessage="When friends recommend songs or albums, they'll show up here"
          loading={musicFriendsLoading}
          friendsWithRecs={musicFriends}
          quickStats={musicStats}
          hits={musicHits}
          misses={musicMisses}
          sent={musicSent}
          friendRecommendations={
            musicFriendRecommendations as Map<
              string,
              (typeof musicHits)[number][]
            >
          }
          renderRecommendationCard={(rec, isReceived, index) =>
            renderRecommendationCard(
              rec as RecommendationWithMedia,
              isReceived,
              index,
              "music",
            )
          }
        />
      )}
    </div>
  );
}

export const DashboardRecommendations = React.memo(
  DashboardRecommendationsComponent,
);
