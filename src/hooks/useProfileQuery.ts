/**
 * TanStack Query hook for user profile data
 * Eliminates duplicate getUserProfile() calls with automatic caching
 */

import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "../lib/profiles";
import { useAuth } from "../contexts/AuthContext";

/**
 * Query hook for fetching current user's profile
 *
 * Features:
 * - Automatic caching (15 minutes stale time - profiles rarely change)
 * - Shared across components (Navigation, HomePage, Settings)
 * - Only fetches when user is authenticated
 * - Returns null data when loading to prevent flicker
 */
export function useProfileQuery() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await getUserProfile(user.id);
      return data;
    },
    enabled: !!user?.id, // Only run query if user exists
    staleTime: 15 * 60 * 1000, // Consider data fresh for 15 minutes (profiles rarely change)
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}
