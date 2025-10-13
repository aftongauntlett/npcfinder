import { supabase } from "./supabase";

/**
 * Fetch all suggestions with user information
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getSuggestions() {
  const { data, error } = await supabase
    .from("suggestions_with_users")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Fetch suggestions by status
 * @param {string} status - The status to filter by ('new', 'considering', 'in-progress', 'done')
 * @returns {Promise<{data: Array, error: Error}>}
 */
export async function getSuggestionsByStatus(status) {
  const { data, error } = await supabase
    .from("suggestions_with_users")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Create a new suggestion
 * @param {Object} suggestion - The suggestion object
 * @param {string} suggestion.title - Title of the suggestion
 * @param {string} suggestion.description - Detailed description
 * @param {string} userId - The ID of the user creating the suggestion
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function createSuggestion(suggestion, userId) {
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
 * @param {string} suggestionId - The ID of the suggestion
 * @param {string} newStatus - The new status ('new', 'considering', 'in-progress', 'done')
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function updateSuggestionStatus(suggestionId, newStatus) {
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
 * @param {string} suggestionId - The ID of the suggestion
 * @param {Object} updates - The fields to update
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function updateSuggestion(suggestionId, updates) {
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
 * @param {string} suggestionId - The ID of the suggestion to delete
 * @returns {Promise<{data: Object, error: Error}>}
 */
export async function deleteSuggestion(suggestionId) {
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
 * @param {Function} callback - Function to call when changes occur
 * @returns {Object} - Subscription object with unsubscribe method
 */
export function subscribeSuggestions(callback) {
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
