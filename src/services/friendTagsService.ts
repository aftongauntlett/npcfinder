import { supabase } from "@/lib/supabase";

export interface FriendTag {
  id: string;
  owner_user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface FriendTagMember {
  tag_id: string;
  owner_user_id: string;
  target_user_id: string;
  created_at: string;
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("User not authenticated");

  return user.id;
}

export async function getFriendTags(): Promise<FriendTag[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("friend_tags")
    .select("id, owner_user_id, name, color, created_at")
    .eq("owner_user_id", userId)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data as FriendTag[]) || [];
}

export async function getFriendTagMembers(): Promise<FriendTagMember[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("friend_tag_members")
    .select("tag_id, owner_user_id, target_user_id, created_at")
    .eq("owner_user_id", userId);

  if (error) throw error;

  return (data as FriendTagMember[]) || [];
}

export async function createFriendTag(params: {
  name: string;
  color?: string | null;
}): Promise<FriendTag> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("friend_tags")
    .insert({
      owner_user_id: userId,
      name: params.name,
      color: params.color || null,
    })
    .select("id, owner_user_id, name, color, created_at")
    .single();

  if (error) throw error;

  return data as FriendTag;
}

export async function deleteFriendTag(tagId: string): Promise<void> {
  const { error } = await supabase.from("friend_tags").delete().eq("id", tagId);

  if (error) throw error;
}

export async function assignUserToTag(params: {
  tagId: string;
  targetUserId: string;
}): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase.from("friend_tag_members").upsert(
    {
      tag_id: params.tagId,
      owner_user_id: userId,
      target_user_id: params.targetUserId,
    },
    { onConflict: "tag_id,target_user_id" },
  );

  if (error) throw error;
}

export async function removeUserFromTag(params: {
  tagId: string;
  targetUserId: string;
}): Promise<void> {
  const { error } = await supabase
    .from("friend_tag_members")
    .delete()
    .eq("tag_id", params.tagId)
    .eq("target_user_id", params.targetUserId);

  if (error) throw error;
}
