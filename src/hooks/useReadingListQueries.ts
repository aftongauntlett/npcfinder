/**
 * TanStack Query hooks for Reading List management
 * Similar to useWatchlistQueries but for books
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { ReadingListItem } from "../services/booksService.types";

/**
 * Fetch user's reading list
 */
export function useReadingList() {
  return useQuery({
    queryKey: ["reading-list"],
    queryFn: async (): Promise<ReadingListItem[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("reading_list")
        .select("*")
        .eq("user_id", user.id)
        .order("added_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Add a book to reading list
 */
export function useAddToReadingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (book: {
      external_id: string;
      title: string;
      authors: string | null;
      thumbnail_url: string | null;
      published_date: string | null;
      description: string | null;
      isbn: string | null;
      page_count: number | null;
      categories: string | null;
      read: boolean;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Sanitize categories field: trim whitespace
      const sanitizedBook = {
        ...book,
        categories: book.categories?.trim() || null,
      };

      const { data, error } = await supabase
        .from("reading_list")
        .insert([{ ...sanitizedBook, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reading-list"] });
    },
  });
}

/**
 * Toggle read status
 */
export function useToggleReadingListRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      // Get current status
      const { data: current, error: fetchError } = await supabase
        .from("reading_list")
        .select("read")
        .eq("id", bookId)
        .single();

      if (fetchError) throw fetchError;

      // Toggle it
      const { error: updateError } = await supabase
        .from("reading_list")
        .update({ read: !current.read })
        .eq("id", bookId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reading-list"] });
    },
  });
}

/**
 * Delete from reading list
 */
export function useDeleteFromReadingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      const { error } = await supabase
        .from("reading_list")
        .delete()
        .eq("id", bookId);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reading-list"] });
    },
  });
}

/**
 * Update personal rating
 */
export function useUpdateBookRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      rating,
    }: {
      bookId: string;
      rating: number | null;
    }) => {
      const { error } = await supabase
        .from("reading_list")
        .update({ personal_rating: rating })
        .eq("id", bookId);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reading-list"] });
    },
  });
}

/**
 * Update personal notes
 */
export function useUpdateBookNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      notes,
    }: {
      bookId: string;
      notes: string | null;
    }) => {
      const { error } = await supabase
        .from("reading_list")
        .update({ personal_notes: notes })
        .eq("id", bookId);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reading-list"] });
    },
  });
}
