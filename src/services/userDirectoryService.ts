import { supabase } from "@/lib/supabase";

export interface UserDirectoryItem {
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  profile_picture_url: string | null;
  birthday: string | null;
  location: string | null;
  personal_links: string[];
  invited_by_user_id: string | null;
  invited_by_display_name: string | null;
}

export interface SearchUserDirectoryParams {
  query: string;
  page: number;
  pageSize: number;
  excludeUserId?: string;
}

export async function searchUserDirectory({
  query,
  page,
  pageSize,
  excludeUserId,
}: SearchUserDirectoryParams): Promise<{
  users: UserDirectoryItem[];
  totalCount: number;
  hasMore: boolean;
}> {
  const offset = Math.max(0, (page - 1) * pageSize);

  let request = supabase
    .from("user_profiles")
    .select(
      "user_id, username, display_name, bio, profile_picture_url, birthday, location, personal_links, invited_by_user_id",
      { count: "exact" },
    )
    .order("display_name", { ascending: true, nullsFirst: false })
    .range(offset, offset + pageSize - 1);

  if (excludeUserId) {
    request = request.neq("user_id", excludeUserId);
  }

  const normalizedQuery = query.trim();
  if (normalizedQuery) {
    request = request.or(
      `display_name.ilike.%${normalizedQuery}%,username.ilike.%${normalizedQuery}%,bio.ilike.%${normalizedQuery}%,location.ilike.%${normalizedQuery}%`,
    );
  }

  const { data, error, count } = await request;

  if (error) {
    throw error;
  }

  const rows =
    (data as Array<{
      user_id: string;
      username: string;
      display_name: string | null;
      bio: string | null;
      profile_picture_url: string | null;
      birthday: string | null;
      location: string | null;
      personal_links: unknown;
      invited_by_user_id: string | null;
    }>) || [];

  const inviterIds = Array.from(
    new Set(
      rows
        .map((row) => row.invited_by_user_id)
        .filter((value): value is string => !!value),
    ),
  );

  const inviterNameMap = new Map<string, string | null>();
  if (inviterIds.length > 0) {
    const { data: inviterProfiles, error: inviterError } = await supabase
      .from("user_profiles")
      .select("user_id, display_name")
      .in("user_id", inviterIds);

    if (inviterError) {
      throw inviterError;
    }

    for (const inviter of inviterProfiles || []) {
      inviterNameMap.set(inviter.user_id, inviter.display_name);
    }
  }

  const users: UserDirectoryItem[] = rows.map((row) => ({
    user_id: row.user_id,
    username: row.username,
    display_name: row.display_name,
    bio: row.bio,
    profile_picture_url: row.profile_picture_url,
    birthday: row.birthday,
    location: row.location,
    personal_links: Array.isArray(row.personal_links)
      ? row.personal_links.filter(
          (entry): entry is string => typeof entry === "string",
        )
      : [],
    invited_by_user_id: row.invited_by_user_id,
    invited_by_display_name: row.invited_by_user_id
      ? (inviterNameMap.get(row.invited_by_user_id) ?? null)
      : null,
  }));

  return {
    users,
    totalCount: count || 0,
    hasMore: (count || 0) > offset + pageSize,
  };
}
