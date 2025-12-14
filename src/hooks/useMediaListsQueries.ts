/**
 * TanStack Query hooks for Media Lists
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { useAuth } from "../contexts/AuthContext";
import * as mediaListsService from "../services/mediaListsService";
import type { MediaItem } from "@/components/shared";
import type {
  MediaDomain,
  MediaListMemberRole,
} from "../services/mediaListsService.types";

export const mediaListsQueryKeys = {
  all: ["media-lists"] as const,
  lists: (domain: MediaDomain) => [...mediaListsQueryKeys.all, "lists", domain] as const,
  detail: (listId: string) => [...mediaListsQueryKeys.all, "detail", listId] as const,
  items: (listId: string) => [...mediaListsQueryKeys.all, "items", listId] as const,
  members: (listId: string) => [...mediaListsQueryKeys.all, "members", listId] as const,
  myRole: (listId: string, userId?: string) =>
    [...mediaListsQueryKeys.all, "my-role", listId, userId] as const,
};

export function useMediaLists(domain: MediaDomain) {
  return useQuery({
    queryKey: mediaListsQueryKeys.lists(domain),
    queryFn: async () => {
      const { data, error } = await mediaListsService.getMediaLists(domain);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useMediaList(listId: string | null) {
  return useQuery({
    queryKey: mediaListsQueryKeys.detail(listId || ""),
    enabled: !!listId,
    queryFn: async () => {
      if (!listId) return null;
      const { data, error } = await mediaListsService.getMediaList(listId);
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateMediaList(domain: MediaDomain) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      description?: string | null;
      icon?: string | null;
      icon_color?: string | null;
      is_public: boolean;
    }) => {
      const { data, error } = await mediaListsService.createMediaList({
        media_domain: domain,
        title: params.title,
        description: params.description,
        icon: params.icon ?? null,
        icon_color: params.icon_color ?? null,
        is_public: params.is_public,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: mediaListsQueryKeys.lists(domain),
      });
    },
  });
}

export function useUpdateMediaList(domain: MediaDomain) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      listId: string;
      updates: {
        title?: string;
        description?: string | null;
        icon?: string | null;
        icon_color?: string | null;
        is_public?: boolean;
      };
    }) => {
      const { data, error } = await mediaListsService.updateMediaList(
        params.listId,
        params.updates
      );
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: mediaListsQueryKeys.lists(domain),
        }),
        queryClient.invalidateQueries({
          queryKey: mediaListsQueryKeys.detail(variables.listId),
        }),
      ]);

      // Also refresh app-level shared stats if needed
      await queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });
}

export function useDeleteMediaList(domain: MediaDomain) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      const { data, error } = await mediaListsService.deleteMediaList(listId);
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: mediaListsQueryKeys.lists(domain),
      });
    },
  });
}

export function useMediaListItems(listId: string | null) {
  return useQuery({
    queryKey: mediaListsQueryKeys.items(listId || ""),
    enabled: !!listId,
    queryFn: async () => {
      if (!listId) return [];
      const { data, error } = await mediaListsService.getMediaListItems(listId);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddMediaListItem(domain: MediaDomain) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      listId: string;
      item: MediaItem;
    }) => {
      const { data, error } = await mediaListsService.addMediaListItem({
        listId: params.listId,
        mediaDomain: domain,
        item: params.item,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: mediaListsQueryKeys.items(variables.listId),
        }),
        queryClient.invalidateQueries({
          queryKey: mediaListsQueryKeys.lists(domain),
        }),
      ]);
    },
  });
}

export function useRemoveMediaListItem(domain: MediaDomain) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { listId: string; itemId: string }) => {
      const { data, error } = await mediaListsService.removeMediaListItem({
        itemId: params.itemId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: mediaListsQueryKeys.items(variables.listId),
        }),
        queryClient.invalidateQueries({
          queryKey: mediaListsQueryKeys.lists(domain),
        }),
      ]);
    },
  });
}

export function useMediaListMembers(listId: string | null) {
  return useQuery({
    queryKey: mediaListsQueryKeys.members(listId || ""),
    enabled: !!listId,
    queryFn: async () => {
      if (!listId) return [];
      const { data, error } = await mediaListsService.getMediaListMembers(listId);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useMyMediaListRole(listId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: mediaListsQueryKeys.myRole(listId || "", user?.id),
    enabled: !!listId && !!user?.id,
    queryFn: async () => {
      if (!listId) return null;
      const { data, error } = await mediaListsService.getMyMediaListRole(listId);
      if (error) throw error;
      return data;
    },
  });
}

export function useShareMediaList(domain: MediaDomain) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      listId: string;
      userIds: string[];
      role: MediaListMemberRole;
    }) => {
      const { data, error } = await mediaListsService.shareMediaList(params);
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: mediaListsQueryKeys.members(variables.listId),
      });
      await queryClient.invalidateQueries({
        queryKey: mediaListsQueryKeys.lists(domain),
      });
    },
  });
}

export function useUnshareMediaList(domain: MediaDomain) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { listId: string; userId: string }) => {
      const { data, error } = await mediaListsService.unshareMediaList(params);
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: mediaListsQueryKeys.members(variables.listId),
      });
      await queryClient.invalidateQueries({
        queryKey: mediaListsQueryKeys.lists(domain),
      });
    },
  });
}

export function useUpdateMediaListMemberRole(domain: MediaDomain) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { memberId: string; role: MediaListMemberRole; listId: string }) => {
      const { data, error } = await mediaListsService.updateMediaListMemberRole({
        memberId: params.memberId,
        role: params.role,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: mediaListsQueryKeys.members(variables.listId),
      });
      await queryClient.invalidateQueries({
        queryKey: mediaListsQueryKeys.lists(domain),
      });
    },
  });
}
