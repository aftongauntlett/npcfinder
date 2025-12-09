/**
 * Book Recommendations Data Hook
 * Aggregates and transforms book recommendation data from multiple sources
 * into a ready-to-use format for the Books Suggestions page
 */

import { useMemo } from "react";
import {
  useFriendsWithBookRecs,
  useBookStats,
  useBookRecommendations,
} from "./useBookQueries";
import { useAuth } from "../contexts/AuthContext";
import type { BaseRecommendation } from "@/components/shared";

// Extend BaseRecommendation with book-specific fields
interface BookRecommendation extends BaseRecommendation {
  name: string;
  author: string | null;
  published_year: string | null;
  cover_url: string | null;
  description: string | null;
  isbn: string | null;
  page_count: number | null;
  categories: string | null;
  status: "pending" | "read" | "hit" | "miss";
  read_at: string | null;
  created_at: string;
  sender_comment: string | null;
}

/**
 * Custom hook that aggregates and transforms book recommendation data
 * from multiple sources into a ready-to-use format for the Books Suggestions page.
 *
 * Responsibilities:
 * - Fetches hits, misses, queue, and sent recommendations
 * - Transforms raw data into fully-shaped BookRecommendation objects
 * - Creates a userId → displayName lookup map
 * - Builds friendRecommendations map grouped by sender
 * - Filters out self from friends list
 * - Returns ready-to-render data and loading states
 */
export function useBookRecommendationsData() {
  const { user } = useAuth();

  // Fetch friends and stats
  const { data: friendsWithRecs = [], isLoading: friendsLoading } =
    useFriendsWithBookRecs();
  const { data: quickStats = { hits: 0, misses: 0, queue: 0, sent: 0 } } =
    useBookStats();

  // Fetch all recommendation types
  const { data: hitsData = [] } = useBookRecommendations("hits");
  const { data: missesData = [] } = useBookRecommendations("misses");
  const { data: sentData = [] } = useBookRecommendations("sent");
  const { data: pendingData = [] } = useBookRecommendations("queue");

  // Cast to any to access book-specific fields (database query returns all columns)
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
    cover_url?: string | null;
    author?: string | null;
    published_year?: string | null;
    description?: string | null;
    isbn?: string | null;
    page_count?: number | null;
    categories?: string | null;
    read_at?: string | null;
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

  // Transform hits data into fully-shaped BookRecommendation objects
  const hits = useMemo(
    () =>
      hitsRaw.map((rec) => ({
        ...rec,
        name: rec.title,
        sent_message: rec.sent_message ?? null,
        comment: rec.recipient_note ?? null,
        sender_comment: rec.sender_note ?? null,
        sent_at: rec.created_at,
        cover_url: rec.cover_url ?? null,
        read_at: rec.read_at ?? null,
        consumed_at: rec.read_at ?? null,
        author: rec.author ?? null,
        published_year: rec.published_year ?? null,
        description: rec.description ?? null,
        isbn: rec.isbn ?? null,
        page_count: rec.page_count ?? null,
        categories: rec.categories ?? null,
        status: "hit" as const,
      })),
    [hitsRaw]
  );

  // Transform misses data
  const misses = useMemo(
    () =>
      missesRaw.map((rec) => ({
        ...rec,
        name: rec.title,
        sent_message: rec.sent_message ?? null,
        comment: rec.recipient_note ?? null,
        sender_comment: rec.sender_note ?? null,
        sent_at: rec.created_at,
        cover_url: rec.cover_url ?? null,
        read_at: rec.read_at ?? null,
        consumed_at: rec.read_at ?? null,
        author: rec.author ?? null,
        published_year: rec.published_year ?? null,
        description: rec.description ?? null,
        isbn: rec.isbn ?? null,
        page_count: rec.page_count ?? null,
        categories: rec.categories ?? null,
        status: "miss" as const,
      })),
    [missesRaw]
  );

  // Transform sent data
  const sent = useMemo(
    () =>
      sentRaw.map((rec) => ({
        ...rec,
        name: rec.title,
        sent_message: rec.sent_message ?? null,
        comment: rec.recipient_note ?? null,
        sender_comment: rec.sender_note ?? null,
        sent_at: rec.created_at,
        cover_url: rec.cover_url ?? null,
        read_at: rec.read_at ?? null,
        consumed_at: rec.read_at ?? null,
        author: rec.author ?? null,
        published_year: rec.published_year ?? null,
        description: rec.description ?? null,
        isbn: rec.isbn ?? null,
        page_count: rec.page_count ?? null,
        categories: rec.categories ?? null,
        status:
          rec.status === "consumed" || rec.status === "watched"
            ? ("read" as const)
            : (rec.status as BookRecommendation["status"]),
      })),
    [sentRaw]
  );

  // Transform pending data and build friendRecommendations map
  const { queue, friendRecommendations } = useMemo(() => {
    const pendingRecs: BookRecommendation[] = pendingRaw.map((rec) => ({
      ...rec,
      name: rec.title,
      sent_message: rec.sent_message ?? null,
      comment: rec.recipient_note ?? null,
      sender_comment: rec.sender_note ?? null,
      sent_at: rec.created_at,
      cover_url: rec.cover_url ?? null,
      read_at: rec.read_at ?? null,
      consumed_at: rec.read_at ?? null,
      author: rec.author ?? null,
      published_year: rec.published_year ?? null,
      description: rec.description ?? null,
      isbn: rec.isbn ?? null,
      page_count: rec.page_count ?? null,
      categories: rec.categories ?? null,
      status: "pending" as const,
    }));

    // Build friend recommendations map grouped by sender
    const friendRecsMap = new Map<string, BookRecommendation[]>();
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
