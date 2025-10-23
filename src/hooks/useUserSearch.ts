/**
 * User Search Hooks
 * TanStack Query hooks for searching users and managing connections
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import * as userSearchService from "../services/userSearchService";

/**
 * Hook to search for users
 */
export function useUserSearch(query: string, page: number, pageSize = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-search", query, page, pageSize, user?.id],
    queryFn: () =>
      userSearchService.searchUsers({
        query,
        currentUserId: user!.id,
        page,
        pageSize,
      }),
    enabled: !!user,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to create a connection
 */
export function useCreateConnection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId: string) =>
      userSearchService.createConnection(user!.id, targetUserId),
    onMutate: async (targetUserId) => {
      // Optimistic update - immediately show as connected
      await queryClient.cancelQueries({ queryKey: ["user-search"] });

      // Update all search result caches
      queryClient.setQueriesData<{
        users: userSearchService.UserSearchResult[];
        totalCount: number;
        hasMore: boolean;
      }>({ queryKey: ["user-search"] }, (old) => {
        if (!old) return old;

        return {
          ...old,
          users: old.users.map((u) =>
            u.user_id === targetUserId ? { ...u, is_connected: true } : u
          ),
        };
      });
    },
    onSuccess: () => {
      // Invalidate to refetch with updated data
      void queryClient.invalidateQueries({ queryKey: ["user-search"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: () => {
      // Revert optimistic update on error
      void queryClient.invalidateQueries({ queryKey: ["user-search"] });
    },
  });
}

/**
 * Hook to remove a connection
 */
export function useRemoveConnection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId: string) =>
      userSearchService.removeConnection(user!.id, targetUserId),
    onMutate: async (targetUserId) => {
      // Optimistic update - immediately show as not connected
      await queryClient.cancelQueries({ queryKey: ["user-search"] });

      queryClient.setQueriesData<{
        users: userSearchService.UserSearchResult[];
        totalCount: number;
        hasMore: boolean;
      }>({ queryKey: ["user-search"] }, (old) => {
        if (!old) return old;

        return {
          ...old,
          users: old.users.map((u) =>
            u.user_id === targetUserId ? { ...u, is_connected: false } : u
          ),
        };
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-search"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-search"] });
    },
  });
}
