import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { searchUserDirectory } from "@/services/userDirectoryService";

export function useUserDirectory(
  query: string,
  page: number,
  pageSize = 20,
  excludeUserId?: string,
) {
  return useQuery({
    queryKey: queryKeys.friends.directory(query, page, pageSize, excludeUserId),
    queryFn: () =>
      searchUserDirectory({ query, page, pageSize, excludeUserId }),
    staleTime: 30 * 1000,
  });
}
