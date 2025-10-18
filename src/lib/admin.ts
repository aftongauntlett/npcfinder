import { supabase } from "./supabase";

/**
 * Admin utilities
 * Primary admin checks should use AdminContext (useAdmin hook)
 * These functions are for direct database operations
 */

/**
 * Toggle admin status for a user (admin only)
 * Updates the is_admin field in user_profiles table
 */
export const toggleUserAdminStatus = async (
  userId: string,
  makeAdmin: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("user_profiles")
      .update({ is_admin: makeAdmin })
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error toggling admin status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
