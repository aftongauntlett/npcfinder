import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { queryKeys } from "../../lib/queryKeys";
import { logger } from "@/lib/logger";
import { useAuth } from "../../contexts/AuthContext";

export type MediaType = "music" | "movies" | "books" | "games";

interface MediaItemData {
  external_id: string;
  title: string;
  subtitle?: string;
  authors?: string;
  artist?: string;
  album?: string;
  poster_url: string | null;
  release_date?: string | null;
  description?: string | null;
  media_type?: string;
  page_count?: number;
  isbn?: string;
  categories?: string;
  genre?: string | null;
  track_duration?: number | null;
  track_count?: number | null;
  preview_url?: string | null;
  slug?: string;
  platforms?: string;
  genres?: string;
  rating?: number;
  metacritic?: number;
  playtime?: number;
  description_raw?: string;
}

interface SendRecommendationsParams {
  selectedItem: MediaItemData;
  recipientIds: string[];
  recommendationType: string;
  message: string;
}

export function useSendMediaRecommendations(
  mediaType: MediaType,
  tableName: string
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const buildRecommendation = useCallback(
    (
      item: MediaItemData,
      recipientId: string,
      recType: string,
      msg: string | null
    ) => {
      const userId = user?.id;
      if (!userId) throw new Error("User not authenticated");

      // Books table has different column names
      if (mediaType === "books") {
        return {
          from_user_id: userId,
          to_user_id: recipientId,
          external_id: item.external_id,
          title: item.title,
          authors: item.authors || null,
          thumbnail_url: item.poster_url || null,
          published_date: item.release_date || null,
          description: item.description || null,
          isbn: item.isbn || null,
          page_count: item.page_count || null,
          status: "pending",
          recommendation_type: recType || "read",
          sent_message: msg,
        };
      }

      // Games table has different column names
      if (mediaType === "games") {
        return {
          from_user_id: userId,
          to_user_id: recipientId,
          external_id: item.external_id,
          slug: item.slug || "",
          name: item.title,
          released: item.release_date || null,
          background_image: item.poster_url || null,
          platforms: item.platforms || null,
          genres: item.genres || null,
          rating: item.rating || null,
          metacritic: item.metacritic || null,
          playtime: item.playtime || null,
          status: "pending",
          recommendation_type: recType || "play",
          sent_message: msg,
        };
      }

      const baseRecommendation = {
        from_user_id: userId,
        to_user_id: recipientId,
        external_id: item.external_id,
        title: item.title,
        poster_url: item.poster_url,
        media_type: item.media_type || "unknown",
        status: "pending",
        recommendation_type: recType,
        sent_message: msg,
      };

      // Add media-type-specific fields
      if (mediaType === "music") {
        return {
          ...baseRecommendation,
          artist: item.subtitle || null,
          album: null,
          release_date: item.release_date || null,
          preview_url: null,
        };
      } else if (mediaType === "movies") {
        return {
          ...baseRecommendation,
          release_date: item.release_date || null,
          overview: item.description || null,
        };
      }

      return baseRecommendation;
    },
    [mediaType, user]
  );

  const mutation = useMutation({
    mutationFn: async ({
      selectedItem,
      recipientIds,
      recommendationType,
      message,
    }: SendRecommendationsParams) => {
      if (!user) throw new Error("User not authenticated");

      const recommendations = recipientIds.map((friendId) =>
        buildRecommendation(
          selectedItem,
          friendId,
          recommendationType,
          message || null
        )
      );

      const { error } = await supabase.from(tableName).insert(recommendations);

      if (error) {
        if (error.message.includes("duplicate key")) {
          throw new Error(
            "You've already sent this recommendation to one or more of these friends."
          );
        } else {
          throw new Error(`Failed to send recommendation: ${error.message}`);
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate recommendation queries to refresh lists
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recommendations.all,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.stats(),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
    onError: (error) => {
      logger.error("Failed to send recommendations", { error });
    },
  });

  return {
    sendRecommendations: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
