import { supabase } from "./supabase";
import type { PostgrestError, RealtimeChannel } from "@supabase/supabase-js";

/**
 * Suggestion from the database
 */
export interface Suggestion {
  id: string;
  title: string;
  description: string;
  status: "new" | "considering" | "in-progress" | "done";
  created_by: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Suggestion with user information (from view)
 */
export interface SuggestionWithUser extends Suggestion {
  user_email?: string;
  display_name?: string;
}

interface SuggestionResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

/**
 * Fetch all suggestions with user information
 */
export async function getSuggestions(): Promise<
  SuggestionResult<SuggestionWithUser[]>
> {
  const { data, error } = await supabase
    .from("suggestions_with_users")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Fetch suggestions by status
 */
export async function getSuggestionsByStatus(
  status: Suggestion["status"]
): Promise<SuggestionResult<SuggestionWithUser[]>> {
  const { data, error } = await supabase
    .from("suggestions_with_users")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Create a new suggestion
 */
export async function createSuggestion(
  suggestion: Pick<Suggestion, "title" | "description">,
  userId: string
): Promise<SuggestionResult<Suggestion>> {
  const { data, error } = await supabase
    .from("suggestions")
    .insert([
      {
        title: suggestion.title,
        description: suggestion.description,
        status: "new",
        created_by: userId,
      },
    ])
    .select()
    .single();

  return { data, error };
}

/**
 * Update a suggestion's status (admin only)
 */
export async function updateSuggestionStatus(
  suggestionId: string,
  newStatus: Suggestion["status"]
): Promise<SuggestionResult<Suggestion>> {
  const { data, error } = await supabase
    .from("suggestions")
    .update({ status: newStatus })
    .eq("id", suggestionId)
    .select()
    .single();

  return { data, error };
}

/**
 * Update a suggestion's content (admin only)
 */
export async function updateSuggestion(
  suggestionId: string,
  updates: Partial<Pick<Suggestion, "title" | "description" | "status">>
): Promise<SuggestionResult<Suggestion>> {
  const { data, error } = await supabase
    .from("suggestions")
    .update(updates)
    .eq("id", suggestionId)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a suggestion (admin only)
 */
export async function deleteSuggestion(
  suggestionId: string
): Promise<SuggestionResult<Suggestion>> {
  const { data, error } = await supabase
    .from("suggestions")
    .delete()
    .eq("id", suggestionId)
    .select()
    .single();

  return { data, error };
}

/**
 * Subscribe to real-time changes in suggestions
 */
export function subscribeSuggestions(
  callback: (payload: any) => void
): RealtimeChannel {
  const subscription = supabase
    .channel("suggestions_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "suggestions",
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
}
