/**
 * Existing Media Recommendations Hook
 * Checks which friends have already received a specific media recommendation
 * Centralizes the Supabase query logic for checking existing recommendations
 */

import { useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { logger } from "../../lib/logger";

interface UseExistingMediaRecommendationsParams {
  tableName: string;
  fromUserId: string | null;
}

/**
 * Hook to check which friends already have a recommendation for a specific media item
 *
 * @param tableName - The recommendations table name (e.g., "movie_recommendations", "book_recommendations")
 * @param fromUserId - The ID of the user sending the recommendation
 * @returns Function to check existing recommendations and a Set of recipient user IDs
 */
export function useExistingMediaRecommendations({
  tableName,
  fromUserId,
}: UseExistingMediaRecommendationsParams) {
  /**
   * Check which friends already have a recommendation for the given media item
   * Returns a Set of user IDs who have already received this recommendation
   */
  const checkExisting = useCallback(
    async (externalId: string): Promise<Set<string>> => {
      if (!fromUserId) {
        return new Set();
      }

      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("to_user_id")
          .eq("from_user_id", fromUserId)
          .eq("external_id", externalId);

        if (error) {
          logger.error("Failed to check existing recommendations", {
            error,
            tableName,
            externalId,
          });
          return new Set();
        }

        return new Set(data.map((rec) => rec.to_user_id));
      } catch (error) {
        logger.error("Failed to check existing recommendations", {
          error,
          tableName,
        });
        return new Set();
      }
    },
    [fromUserId, tableName]
  );

  return { checkExisting };
}
