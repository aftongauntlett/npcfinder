/**
 * TanStack Query hooks for Reading List management
 * Similar to useWatchlistQueries but for books
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { ReadingListItem } from "../services/booksService.types";
import type { MediaItem } from "../components/shared/SendMediaModal";

interface BatchAddResult {
  successful: ReadingListItem[];
  duplicates: string[];
  errors: { title: string; error: string }[];
}

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
        .order("created_at", { ascending: false });

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

      const { data, error } = await supabase
        .from("reading_list")
        .insert([{ ...book, user_id: user.id }])
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

/**
 * Batch add books to reading list
 */
export function useBatchAddToReadingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (books: MediaItem[]): Promise<BatchAddResult> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const successful: ReadingListItem[] = [];
      const duplicates: string[] = [];
      const errors: { title: string; error: string }[] = [];

      for (const book of books) {
        try {
          // Check if already exists
          const { data: existing } = await supabase
            .from("reading_list")
            .select("id")
            .eq("user_id", user.id)
            .eq("external_id", book.external_id)
            .maybeSingle();

          if (existing) {
            duplicates.push(book.title);
            continue;
          }

          // Insert new book
          const { data, error } = await supabase
            .from("reading_list")
            .insert([
              {
                user_id: user.id,
                external_id: book.external_id,
                title: book.title,
                authors: book.authors || null,
                thumbnail_url: book.poster_url,
                published_date: book.release_date,
                description: book.description || null,
                isbn: book.isbn || null,
                page_count: book.page_count || null,
                categories: book.categories || null,
                read: false,
              },
            ])
            .select()
            .single();

          if (error) {
            errors.push({ title: book.title, error: error.message });
          } else if (data) {
            successful.push(data);
          }
        } catch (err) {
          errors.push({
            title: book.title,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      return { successful, duplicates, errors };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reading-list"] });
    },
  });
}
