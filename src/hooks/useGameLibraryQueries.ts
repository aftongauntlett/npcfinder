/**
 * TanStack Query hooks for Game Library management
 * Similar to useReadingListQueries but for games
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { queryKeys } from "../lib/queryKeys";
import { useAuth } from "../contexts/AuthContext";
import type { MediaItem } from "@/components/shared";

export interface GameLibraryItem {
  id: string;
  user_id: string;
  external_id: string;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  platforms: string | null;
  genres: string | null;
  rating: number | null;
  metacritic: number | null;
  playtime: number | null;
  description_raw: string | null;
  played: boolean;
  personal_rating: number | null;
  personal_notes: string | null;
  created_at: string;
  updated_at: string;
  played_at: string | null;
  custom_order: number | null;
}

interface BatchAddResult {
  successful: GameLibraryItem[];
  duplicates: string[];
  errors: { title: string; error: string }[];
}

/**
 * Fetch user's game library
 */
export function useGameLibrary() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.gameLibrary.list(user?.id),
    queryFn: async (): Promise<GameLibraryItem[]> => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("game_library")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

/**
 * Add a game to library
 */
export function useAddToGameLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (game: {
      external_id: string;
      slug: string;
      name: string;
      released: string | null;
      background_image: string | null;
      platforms: string | null;
      genres: string | null;
      rating: number | null;
      metacritic: number | null;
      playtime: number | null;
      description_raw: string | null;
      played: boolean;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("game_library")
        .insert([{ ...game, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.gameLibrary.all,
      });
    },
  });
}

/**
 * Toggle played status
 */
export function useToggleGameLibraryPlayed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameId: string) => {
      // Get current status
      const { data: current, error: fetchError } = await supabase
        .from("game_library")
        .select("played")
        .eq("id", gameId)
        .single();

      if (fetchError) throw fetchError;

      // Toggle it
      const { error: updateError } = await supabase
        .from("game_library")
        .update({ played: !current.played })
        .eq("id", gameId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.gameLibrary.all,
      });
    },
  });
}

/**
 * Delete from game library
 */
export function useDeleteFromGameLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameId: string) => {
      const { error } = await supabase
        .from("game_library")
        .delete()
        .eq("id", gameId);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["game-library"] });
    },
  });
}

/**
 * Update personal rating
 */
export function useUpdateGameRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      gameId,
      rating,
    }: {
      gameId: string;
      rating: number | null;
    }) => {
      const { error } = await supabase
        .from("game_library")
        .update({ personal_rating: rating })
        .eq("id", gameId);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.gameLibrary.all,
      });
    },
  });
}

/**
 * Update personal notes
 */
export function useUpdateGameNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      gameId,
      notes,
    }: {
      gameId: string;
      notes: string | null;
    }) => {
      const { error } = await supabase
        .from("game_library")
        .update({ personal_notes: notes })
        .eq("id", gameId);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.gameLibrary.all,
      });
    },
  });
}

/**
 * Batch add games to library
 */
export function useBatchAddToGameLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (games: MediaItem[]): Promise<BatchAddResult> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const successful: GameLibraryItem[] = [];
      const duplicates: string[] = [];
      const errors: { title: string; error: string }[] = [];

      for (const game of games) {
        try {
          const { data, error } = await supabase
            .from("game_library")
            .insert([
              {
                user_id: user.id,
                external_id: game.external_id,
                slug: game.slug || "",
                name: game.title,
                released: game.release_date,
                background_image: game.poster_url,
                platforms: game.platforms || null,
                genres: game.genres || null,
                rating: game.rating || null,
                metacritic: game.metacritic || null,
                playtime: game.playtime || null,
                played: false,
              },
            ])
            .select()
            .single();

          if (error) {
            if (error.code === "23505") {
              // Duplicate key
              duplicates.push(game.title);
            } else {
              errors.push({ title: game.title, error: error.message });
            }
          } else if (data) {
            successful.push(data);
          }
        } catch (err) {
          errors.push({
            title: game.title,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      return { successful, duplicates, errors };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.gameLibrary.all,
      });
    },
  });
}

/**
 * Check if a game is in the user's library
 */
export function useIsGameInLibrary(externalId: string) {
  return useQuery({
    queryKey: queryKeys.gameLibrary.inLibrary(externalId),
    queryFn: async (): Promise<boolean> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from("game_library")
        .select("id")
        .eq("user_id", user.id)
        .eq("external_id", externalId)
        .maybeSingle();

      if (error) throw error;
      return data !== null;
    },
    enabled: !!externalId,
  });
}

/**
 * Reorder game library items mutation
 * Updates custom_order for drag-to-reorder functionality
 */
export function useReorderGameLibraryItems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemIds: string[]) => {
      const { reorderGameLibraryItems } = await import(
        "../services/recommendationsService"
      );
      return await reorderGameLibraryItems(itemIds);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.gameLibrary.list(user?.id),
      });
    },
  });
}
