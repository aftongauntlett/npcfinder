import { useMemo } from "react";
import {
  useFriendsWithMovieRecs,
  useMovieStats,
  useMovieRecommendations,
} from "./useMovieQueries";
import { useAuth } from "../contexts/AuthContext";
import type { BaseRecommendation } from "@/components/shared";

// Extend BaseRecommendation with movie-specific fields
interface MovieRecommendation extends BaseRecommendation {
  media_type: "movie" | "tv";
  release_date: string | null;
  overview: string | null;
  poster_url: string | null;
  status: "pending" | "watched" | "hit" | "miss";
  watched_at: string | null;
  created_at: string;
  sender_comment: string | null;
}

/**
 * Custom hook that aggregates and transforms movie recommendation data
 * from multiple sources into a ready-to-use format for the Movies page.
 *
 * Responsibilities:
 * - Fetches hits, misses, queue, and sent recommendations
 * - Transforms raw data into fully-shaped MovieRecommendation objects
 * - Creates a userId → displayName lookup map
 * - Builds friendRecommendations map grouped by sender
 * - Filters out self from friends list
 * - Returns ready-to-render data and loading states
 */
export function useMovieRecommendationsData() {
  const { user } = useAuth();

  // Fetch friends and stats
  const { data: friendsWithRecs = [], isLoading: friendsLoading } =
    useFriendsWithMovieRecs();
  const { data: quickStats = { hits: 0, misses: 0, queue: 0, sent: 0 } } =
    useMovieStats();

  // Fetch all recommendation types
  const { data: hitsData = [] } = useMovieRecommendations("hits");
  const { data: missesData = [] } = useMovieRecommendations("misses");
  const { data: sentData = [] } = useMovieRecommendations("sent");
  const { data: pendingData = [] } = useMovieRecommendations("queue");

  // Create userId → displayName lookup map from all data sources
  const userNameMap = useMemo(() => {
    const map = new Map<string, string>();

    // Add senders from friends list
    friendsWithRecs.forEach((friend) => {
      map.set(friend.user_id, friend.display_name);
    });

    // Add names from hits data (sender_name)
    hitsData.forEach((rec) => {
      if (rec.sender_name && rec.from_user_id) {
        map.set(rec.from_user_id, rec.sender_name);
      }
    });

    // Add names from misses data (sender_name)
    missesData.forEach((rec) => {
      if (rec.sender_name && rec.from_user_id) {
        map.set(rec.from_user_id, rec.sender_name);
      }
    });

    // Add names from pending data (sender_name)
    pendingData.forEach((rec) => {
      if (rec.sender_name && rec.from_user_id) {
        map.set(rec.from_user_id, rec.sender_name);
      }
    });

    // Add recipients from sent data (recipient_name)
    sentData.forEach((rec) => {
      if (rec.recipient_name && rec.to_user_id) {
        map.set(rec.to_user_id, rec.recipient_name);
      }
    });

    return map;
  }, [friendsWithRecs, hitsData, missesData, pendingData, sentData]);

  // Filter out self from friends list
  const filteredFriendsWithRecs = useMemo(() => {
    if (!user) return friendsWithRecs;
    return friendsWithRecs.filter((friend) => friend.user_id !== user.id);
  }, [friendsWithRecs, user]);

  // Transform hits data into fully-shaped MovieRecommendation objects
  const hits = useMemo(
    () =>
      hitsData.map((rec) => ({
        ...rec,
        sent_message: rec.sent_message ?? null,
        comment: rec.recipient_note ?? null,
        sender_comment: rec.sender_note ?? null,
        sent_at: rec.created_at,
        poster_url: rec.poster_url ?? null,
        watched_at: rec.watched_at ?? null,
        consumed_at: rec.watched_at ?? null,
        overview: rec.overview ?? null,
        release_date: rec.year ? `${rec.year}` : null,
        media_type: rec.media_type,
        status: "hit" as const,
      })),
    [hitsData]
  );

  // Transform misses data
  const misses = useMemo(
    () =>
      missesData.map((rec) => ({
        ...rec,
        sent_message: rec.sent_message ?? null,
        comment: rec.recipient_note ?? null,
        sender_comment: rec.sender_note ?? null,
        sent_at: rec.created_at,
        poster_url: rec.poster_url ?? null,
        watched_at: rec.watched_at ?? null,
        consumed_at: rec.watched_at ?? null,
        overview: rec.overview ?? null,
        release_date: rec.year ? `${rec.year}` : null,
        media_type: rec.media_type,
        status: "miss" as const,
      })),
    [missesData]
  );

  // Transform sent data
  const sent = useMemo(
    () =>
      sentData.map((rec) => ({
        ...rec,
        sent_message: rec.sent_message ?? null,
        comment: rec.recipient_note ?? null,
        sender_comment: rec.sender_note ?? null,
        sent_at: rec.created_at,
        poster_url: rec.poster_url ?? null,
        watched_at: rec.watched_at ?? null,
        consumed_at: rec.watched_at ?? null,
        overview: rec.overview ?? null,
        release_date: rec.year ? `${rec.year}` : null,
        media_type: rec.media_type,
        status:
          rec.status === "consumed" || rec.status === "watched"
            ? ("watched" as const)
            : rec.status,
      })),
    [sentData]
  );

  // Transform pending data and build friendRecommendations map
  const { queue, friendRecommendations } = useMemo(() => {
    const pendingRecs: MovieRecommendation[] = pendingData.map((rec) => ({
      ...rec,
      sent_message: rec.sent_message ?? null,
      comment: rec.recipient_note ?? null,
      sender_comment: rec.sender_note ?? null,
      sent_at: rec.created_at,
      poster_url: rec.poster_url ?? null,
      watched_at: rec.watched_at ?? null,
      consumed_at: rec.watched_at ?? null,
      overview: rec.overview ?? null,
      release_date: rec.year ? `${rec.year}` : null,
      media_type: rec.media_type,
      status: "pending" as const,
    }));

    // Build friend recommendations map grouped by sender
    const friendRecsMap = new Map<string, MovieRecommendation[]>();
    pendingRecs.forEach((rec) => {
      const senderId = rec.from_user_id;
      if (!friendRecsMap.has(senderId)) {
        friendRecsMap.set(senderId, []);
      }
      friendRecsMap.get(senderId)!.push(rec);
    });

    return {
      queue: pendingRecs,
      friendRecommendations: friendRecsMap,
    };
  }, [pendingData]);

  return {
    // Fully-transformed data ready for rendering
    hits,
    misses,
    sent,
    queue,
    friendRecommendations,
    friendsWithRecs: filteredFriendsWithRecs,
    quickStats,
    userNameMap,

    // Loading states
    loading: friendsLoading,
  };
}
