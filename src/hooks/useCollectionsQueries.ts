import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryKeys";
import { useAuth } from "../contexts/AuthContext";
import * as collectionsService from "../services/collectionsService.ts";
import type { MediaItem } from "@/components/shared";
import type {
  CollectionMemberRole,
  MediaDomain,
} from "../services/collectionsServiceTypes";

export function useAllAccessibleCollections() {
  return useQuery({
    queryKey: queryKeys.collections.allAccessible(),
    queryFn: async () => {
      const { data, error } =
        await collectionsService.getAllAccessibleCollections();
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCollections(domain: MediaDomain) {
  return useQuery({
    queryKey: queryKeys.collections.lists(domain),
    queryFn: async () => {
      const { data, error } = await collectionsService.getCollections(domain);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCollection(collectionId: string | null) {
  return useQuery({
    queryKey: queryKeys.collections.detail(collectionId || ""),
    enabled: !!collectionId,
    queryFn: async () => {
      if (!collectionId) return null;
      const { data, error } =
        await collectionsService.getCollection(collectionId);
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCollection(domain: MediaDomain) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      description?: string | null;
      icon?: string | null;
      icon_color?: string | null;
      is_public: boolean;
    }) => {
      const { data, error } = await collectionsService.createCollection({
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
        queryKey: queryKeys.collections.lists(domain),
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.collections.allAccessible(),
      });
    },
  });
}

export function useUpdateCollection(domain: MediaDomain) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      collectionId: string;
      updates: {
        title?: string;
        description?: string | null;
        icon?: string | null;
        icon_color?: string | null;
        is_public?: boolean;
      };
    }) => {
      const { data, error } = await collectionsService.updateCollection(
        params.collectionId,
        params.updates,
      );
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.collections.lists(domain),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.collections.detail(variables.collectionId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.collections.allAccessible(),
        }),
      ]);

      await queryClient.invalidateQueries({ queryKey: queryKeys.friends.all });
    },
  });
}

export function useDeleteCollection(domain: MediaDomain) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionId: string) => {
      const { data, error } =
        await collectionsService.deleteCollection(collectionId);
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.collections.lists(domain),
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.collections.allAccessible(),
      });
    },
  });
}

export function useCollectionItems(collectionId: string | null) {
  return useQuery({
    queryKey: queryKeys.collections.items(collectionId || ""),
    enabled: !!collectionId,
    queryFn: async () => {
      if (!collectionId) return [];
      const { data, error } =
        await collectionsService.getCollectionItems(collectionId);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddCollectionItem(domain: MediaDomain) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { collectionId: string; item: MediaItem }) => {
      const { data, error } = await collectionsService.addCollectionItem({
        collectionId: params.collectionId,
        mediaDomain: domain,
        item: params.item,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.collections.items(variables.collectionId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.collections.lists(domain),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.collections.allAccessible(),
        }),
      ]);
    },
  });
}

export function useRemoveCollectionItem(domain: MediaDomain) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { collectionId: string; itemId: string }) => {
      const { data, error } = await collectionsService.removeCollectionItem({
        collectionId: params.collectionId,
        itemId: params.itemId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.collections.items(variables.collectionId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.collections.lists(domain),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.collections.allAccessible(),
        }),
      ]);
    },
  });
}

export function useCollectionMembers(collectionId: string | null) {
  return useQuery({
    queryKey: queryKeys.collections.members(collectionId || ""),
    enabled: !!collectionId,
    queryFn: async () => {
      if (!collectionId) return [];
      const { data, error } =
        await collectionsService.getCollectionMembers(collectionId);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useMyCollectionRole(collectionId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.collections.myRole(collectionId || "", user?.id),
    enabled: !!collectionId && !!user?.id,
    queryFn: async () => {
      if (!collectionId) return null;
      const { data, error } =
        await collectionsService.getMyCollectionRole(collectionId);
      if (error) throw error;
      return data;
    },
  });
}

export function useShareCollection(domain: MediaDomain) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      collectionId: string;
      userIds: string[];
      role: CollectionMemberRole;
    }) => {
      const { data, error } = await collectionsService.shareCollection({
        collectionId: params.collectionId,
        userIds: params.userIds,
        role: params.role,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.collections.members(variables.collectionId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.collections.lists(domain),
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.collections.allAccessible(),
      });
    },
  });
}

export function useUnshareCollection(domain: MediaDomain) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { collectionId: string; userId: string }) => {
      const { data, error } = await collectionsService.unshareCollection({
        collectionId: params.collectionId,
        userId: params.userId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.collections.members(variables.collectionId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.collections.lists(domain),
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.collections.allAccessible(),
      });
    },
  });
}

export function useUpdateCollectionMemberRole(domain: MediaDomain) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      memberId: string;
      role: CollectionMemberRole;
      collectionId: string;
    }) => {
      const { data, error } =
        await collectionsService.updateCollectionMemberRole({
          memberId: params.memberId,
          role: params.role,
        });
      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.collections.members(variables.collectionId),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.collections.lists(domain),
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.collections.allAccessible(),
      });
    },
  });
}
