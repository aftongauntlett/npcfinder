/**
 * Game Recommendations Data Hook
 * Aggregates and transforms game recommendation data from multiple sources
 * into a ready-to-use format for the Games Suggestions page
 */

import { useMemo } from "react";
import {
  useFriendsWithGameRecs,
  useGameStats,
  useGameRecommendations,
} from "./useGameQueries";
import { useAuth } from "../contexts/AuthContext";
import type { BaseRecommendation } from "@/components/shared";

// Extend BaseRecommendation with game-specific fields
interface GameRecommendation extends BaseRecommendation {
  name: string;
  slug: string | null;
  platforms: string | null;
  genres: string | null;
  released: string | null;
  background_image: string | null;
  rating: number | null;
  metacritic: number | null;
  playtime: number | null;
  status: "pending" | "played" | "hit" | "miss";
  played_at: string | null;
  created_at: string;
  sender_comment: string | null;
}

/**
 * Custom hook that aggregates and transforms game recommendation data
 * from multiple sources into a ready-to-use format for the Games Suggestions page.
 *
 * Responsibilities:
 * - Fetches hits, misses, queue, and sent recommendations
 * - Transforms raw data into fully-shaped GameRecommendation objects
 * - Creates a userId → displayName lookup map
 * - Builds friendRecommendations map grouped by sender
 * - Filters out self from friends list
 * - Returns ready-to-render data and loading states
 */
export function useGameRecommendationsData() {
  const { user } = useAuth();

  // Fetch friends and stats
  const { data: friendsWithRecs = [], isLoading: friendsLoading } =
    useFriendsWithGameRecs();
  const { data: quickStats = { hits: 0, misses: 0, queue: 0, sent: 0 } } =
    useGameStats();

  // Fetch all recommendation types
  const { data: hitsData = [] } = useGameRecommendations("hits");
  const { data: missesData = [] } = useGameRecommendations("misses");
  const { data: sentData = [] } = useGameRecommendations("sent");
  const { data: pendingData = [] } = useGameRecommendations("queue");

  // Cast to access game-specific fields (database query returns all columns)
  const hitsRaw = hitsData as unknown as Array<{
    id: string;
    from_user_id: string;
    to_user_id: string;
    external_id: string;
    title: string;
    created_at: string;
    status: string;
    sender_name?: string;
    sender_note?: string | null;
    recipient_name?: string;
    recipient_note?: string | null;
    sent_message?: string | null;
    name?: string;
    slug?: string | null;
    platforms?: string | null;
    genres?: string | null;
    released?: string | null;
    background_image?: string | null;
    rating?: number | null;
    metacritic?: number | null;
    playtime?: number | null;
    played_at?: string | null;
  }>;
  const missesRaw = missesData as unknown as typeof hitsRaw;
  const sentRaw = sentData as unknown as typeof hitsRaw;
  const pendingRaw = pendingData as unknown as typeof hitsRaw;

  // Create userId → displayName lookup map from all data sources
  const userNameMap = useMemo(() => {
    const map = new Map<string, string>();

    // Add senders from friends list
    friendsWithRecs.forEach((friend) => {
      map.set(friend.user_id, friend.display_name);
    });

    // Add names from hits data (sender_name)
    hitsRaw.forEach((rec) => {
      if (rec.sender_name && rec.from_user_id) {
        map.set(rec.from_user_id, rec.sender_name);
      }
    });

    // Add names from misses data (sender_name)
    missesRaw.forEach((rec) => {
      if (rec.sender_name && rec.from_user_id) {
        map.set(rec.from_user_id, rec.sender_name);
      }
    });

    // Add names from pending data (sender_name)
    pendingRaw.forEach((rec) => {
      if (rec.sender_name && rec.from_user_id) {
        map.set(rec.from_user_id, rec.sender_name);
      }
    });

    // Add recipients from sent data (recipient_name)
    sentRaw.forEach((rec) => {
      if (rec.recipient_name && rec.to_user_id) {
        map.set(rec.to_user_id, rec.recipient_name);
      }
    });

    return map;
  }, [friendsWithRecs, hitsRaw, missesRaw, pendingRaw, sentRaw]);

  // Filter out self from friends list
  const filteredFriendsWithRecs = useMemo(() => {
    if (!user) return friendsWithRecs;
    return friendsWithRecs.filter((friend) => friend.user_id !== user.id);
  }, [friendsWithRecs, user]);

  // Transform hits data into fully-shaped GameRecommendation objects
  const hits = useMemo(
    () =>
      hitsRaw.map((rec) => ({
        ...rec,
        name: rec.name || rec.title,
        sent_message: rec.sent_message ?? null,
        comment: rec.recipient_note ?? null,
        sender_comment: rec.sender_note ?? null,
        sent_at: rec.created_at,
        background_image: rec.background_image ?? null,
        played_at: rec.played_at ?? null,
        consumed_at: rec.played_at ?? null,
        slug: rec.slug ?? null,
        platforms: rec.platforms ?? null,
        genres: rec.genres ?? null,
        released: rec.released ?? null,
        rating: rec.rating ?? null,
        metacritic: rec.metacritic ?? null,
        playtime: rec.playtime ?? null,
        status: "hit" as const,
      })),
    [hitsRaw]
  );

  // Transform misses data
  const misses = useMemo(
    () =>
      missesRaw.map((rec) => ({
        ...rec,
        name: rec.name || rec.title,
        sent_message: rec.sent_message ?? null,
        comment: rec.recipient_note ?? null,
        sender_comment: rec.sender_note ?? null,
        sent_at: rec.created_at,
        background_image: rec.background_image ?? null,
        played_at: rec.played_at ?? null,
        consumed_at: rec.played_at ?? null,
        slug: rec.slug ?? null,
        platforms: rec.platforms ?? null,
        genres: rec.genres ?? null,
        released: rec.released ?? null,
        rating: rec.rating ?? null,
        metacritic: rec.metacritic ?? null,
        playtime: rec.playtime ?? null,
        status: "miss" as const,
      })),
    [missesRaw]
  );

  // Transform sent data
  const sent = useMemo(
    () =>
      sentRaw.map((rec) => ({
        ...rec,
        name: rec.name || rec.title,
        sent_message: rec.sent_message ?? null,
        comment: rec.recipient_note ?? null,
        sender_comment: rec.sender_note ?? null,
        sent_at: rec.created_at,
        background_image: rec.background_image ?? null,
        played_at: rec.played_at ?? null,
        consumed_at: rec.played_at ?? null,
        slug: rec.slug ?? null,
        platforms: rec.platforms ?? null,
        genres: rec.genres ?? null,
        released: rec.released ?? null,
        rating: rec.rating ?? null,
        metacritic: rec.metacritic ?? null,
        playtime: rec.playtime ?? null,
        status:
          rec.status === "consumed" || rec.status === "played"
            ? ("played" as const)
            : (rec.status as GameRecommendation["status"]),
      })),
    [sentRaw]
  );

  // Transform pending data and build friendRecommendations map
  const { queue, friendRecommendations } = useMemo(() => {
    const pendingRecs: GameRecommendation[] = pendingRaw.map((rec) => ({
      ...rec,
      name: rec.name || rec.title,
      sent_message: rec.sent_message ?? null,
      comment: rec.recipient_note ?? null,
      sender_comment: rec.sender_note ?? null,
      sent_at: rec.created_at,
      background_image: rec.background_image ?? null,
      played_at: rec.played_at ?? null,
      consumed_at: rec.played_at ?? null,
      slug: rec.slug ?? null,
      platforms: rec.platforms ?? null,
      genres: rec.genres ?? null,
      released: rec.released ?? null,
      rating: rec.rating ?? null,
      metacritic: rec.metacritic ?? null,
      playtime: rec.playtime ?? null,
      status: "pending" as const,
    }));

    // Build friend recommendations map grouped by sender
    const friendRecsMap = new Map<string, GameRecommendation[]>();
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
  }, [pendingRaw]);

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
