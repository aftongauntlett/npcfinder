import { supabase } from "../lib/supabase";

export interface MediaReview {
  id: string;
  user_id: string;
  external_id: string;
  media_type: string;
  title: string;
  rating: number | null;
  liked: boolean | null;
  review_text: string | null;
  is_public: boolean;
  watched_at: string | null;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  edited_at: string | null;
  // Joined from user_profiles
  display_name?: string;
}

export interface CreateMediaReviewData {
  external_id: string;
  media_type: string;
  title: string;
  rating?: number | null;
  liked?: boolean | null;
  review_text?: string | null;
  is_public?: boolean;
  watched_at?: string | null;
}

export interface UpdateMediaReviewData {
  rating?: number | null;
  liked?: boolean | null;
  review_text?: string | null;
  is_public?: boolean;
  watched_at?: string | null;
}

/**
 * Get current user's review for a specific media item
 */
export async function getMyMediaReview(
  externalId: string,
  mediaType: string
): Promise<{ data: MediaReview | null; error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("media_reviews")
      .select("*")
      .eq("user_id", user.id)
      .eq("external_id", externalId)
      .eq("media_type", mediaType)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get friends' public reviews for a specific media item
 */
export async function getFriendsMediaReviews(
  externalId: string,
  mediaType: string
): Promise<{ data: MediaReview[]; error: Error | null }> {
  try {
    // Get current user to filter out their own review
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("media_reviews")
      .select("*")
      .eq("external_id", externalId)
      .eq("media_type", mediaType)
      .eq("is_public", true)
      .neq("user_id", user?.id || "")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Fetch display names separately
    if (data && data.length > 0) {
      const userIds = data.map((review) => review.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      if (profileError) throw profileError;

      // Map display names to reviews
      const profileMap = new Map(
        profiles?.map((p) => [p.user_id, p.display_name]) || []
      );

      const reviews = data.map((review) => ({
        ...review,
        display_name: profileMap.get(review.user_id) || "Unknown User",
      })) as MediaReview[];

      return { data: reviews, error: null };
    }

    return { data: [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Create or update user's review (upsert)
 */
export async function upsertMediaReview(
  reviewData: CreateMediaReviewData
): Promise<{ data: MediaReview | null; error: Error | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("media_reviews")
      .upsert(
        {
          user_id: user.id,
          ...reviewData,
        },
        {
          onConflict: "user_id,external_id,media_type",
        }
      )
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update existing review
 */
export async function updateMediaReview(
  reviewId: string,
  updates: UpdateMediaReviewData
): Promise<{ data: MediaReview | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("media_reviews")
      .update(updates)
      .eq("id", reviewId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete user's review
 */
export async function deleteMediaReview(
  reviewId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from("media_reviews")
      .delete()
      .eq("id", reviewId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}
