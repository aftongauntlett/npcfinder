/**
 * TanStack Query hooks for Music Library
 * CRUD operations for music_library table
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type {
  MusicLibraryItem,
  AddToLibraryParams,
  UpdateLibraryParams,
} from "../services/musicService.types";

/**
 * Get user's music library
 */
export function useMusicLibrary() {
  return useQuery({
    queryKey: ["musicLibrary"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("music_library")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MusicLibraryItem[];
    },
  });
}

/**
 * Get quick stats for music library
 */
export function useMusicLibraryStats() {
  return useQuery({
    queryKey: ["musicLibraryStats"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("music_library")
        .select("listened")
        .eq("user_id", user.id);

      if (error) throw error;

      const listening = data.filter((item) => !item.listened).length;
      const listened = data.filter((item) => item.listened).length;

      return { listening, listened, total: data.length };
    },
  });
}

/**
 * Add to music library
 */
export function useAddToLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddToLibraryParams) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("music_library")
        .insert({
          user_id: user.id,
          external_id: params.external_id,
          title: params.title,
          artist: params.artist,
          album: params.album,
          media_type: params.media_type,
          release_date: params.release_date,
          album_cover_url: params.album_cover_url,
          preview_url: params.preview_url || null,
          listened: params.listened || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["musicLibrary"] });
      void queryClient.invalidateQueries({ queryKey: ["musicLibraryStats"] });
    },
  });
}

/**
 * Toggle listened status
 */
export function useToggleListened() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First get current status
      const { data: current, error: fetchError } = await supabase
        .from("music_library")
        .select("listened")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Toggle it
      const { data, error } = await supabase
        .from("music_library")
        .update({ listened: !current.listened })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["musicLibrary"] });
      void queryClient.invalidateQueries({ queryKey: ["musicLibraryStats"] });
    },
  });
}

/**
 * Update music library item (rating, notes)
 */
export function useUpdateLibraryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateLibraryParams) => {
      const { data, error } = await supabase
        .from("music_library")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["musicLibrary"] });
      void queryClient.invalidateQueries({ queryKey: ["musicLibraryStats"] });
    },
  });
}

/**
 * Delete from music library
 */
export function useDeleteFromLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("music_library")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["musicLibrary"] });
      void queryClient.invalidateQueries({ queryKey: ["musicLibraryStats"] });
    },
  });
}
