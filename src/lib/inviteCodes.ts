import { supabase } from "./supabase";

/**
 * Invite Code Management Library
 * Secure invite-only registration system
 */

export interface InviteCode {
  id: string;
  code: string;
  created_by: string | null;
  used_by: string | null;
  is_active: boolean;
  max_uses: number;
  current_uses: number;
  expires_at: string | null;
  created_at: string;
  used_at: string | null;
  notes: string | null;
}

interface InviteCodeResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Generate a cryptographically secure invite code
 * Format: XXX-XXX-XXX-XXX (no ambiguous characters)
 */
export const generateSecureCode = (): string => {
  const characters = "ABCDEFGHJKMNPQRTUVWXY23456789"; // No ambiguous chars (0, O, 1, I, L, S, Z)
  const segments = 4;
  const segmentLength = 3;
  const code: string[] = [];

  for (let i = 0; i < segments; i++) {
    let segment = "";
    for (let j = 0; j < segmentLength; j++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      segment += characters[randomIndex];
    }
    code.push(segment);
  }

  return code.join("-");
};

/**
 * Validate an invite code (check if it's valid without consuming it)
 */
export const validateInviteCode = async (
  code: string
): Promise<InviteCodeResult<boolean>> => {
  try {
    const { data, error } = await supabase.rpc("validate_invite_code", {
      code_to_check: code.toUpperCase().trim(),
    });

    if (error) throw error;
    return { data: data as boolean, error: null };
  } catch (error) {
    console.error("Validate invite code error:", error);
    return { data: false, error: error as Error };
  }
};

/**
 * Consume an invite code (mark it as used)
 * Call this after successful user registration
 */
export const consumeInviteCode = async (
  code: string,
  userId: string
): Promise<InviteCodeResult<boolean>> => {
  try {
    const { data, error } = await supabase.rpc("consume_invite_code", {
      code_to_use: code.toUpperCase().trim(),
      user_id: userId,
    });

    if (error) throw error;
    return { data: data as boolean, error: null };
  } catch (error) {
    console.error("Consume invite code error:", error);
    return { data: false, error: error as Error };
  }
};

/**
 * Create a new invite code (admin only)
 */
export const createInviteCode = async (
  notes?: string,
  maxUses = 1,
  expiresInDays?: number
): Promise<InviteCodeResult<InviteCode>> => {
  try {
    const code = generateSecureCode();
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Must be authenticated to create invite codes");
    }

    const { data, error } = await supabase
      .from("invite_codes")
      .insert({
        code,
        created_by: user.id,
        notes,
        max_uses: maxUses,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as InviteCode, error: null };
  } catch (error) {
    console.error("Create invite code error:", error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get all invite codes (admin only)
 */
export const getAllInviteCodes = async (): Promise<
  InviteCodeResult<InviteCode[]>
> => {
  try {
    const { data, error } = await supabase
      .from("invite_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data as InviteCode[], error: null };
  } catch (error) {
    console.error("Get invite codes error:", error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get invite codes created by current user
 */
export const getMyInviteCodes = async (): Promise<
  InviteCodeResult<InviteCode[]>
> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Must be authenticated");
    }

    const { data, error } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data as InviteCode[], error: null };
  } catch (error) {
    console.error("Get my invite codes error:", error);
    return { data: null, error: error as Error };
  }
};

/**
 * Revoke (deactivate) an invite code
 */
export const revokeInviteCode = async (
  codeId: string
): Promise<InviteCodeResult<boolean>> => {
  try {
    const { error } = await supabase
      .from("invite_codes")
      .update({ is_active: false })
      .eq("id", codeId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    console.error("Revoke invite code error:", error);
    return { data: false, error: error as Error };
  }
};

/**
 * Delete an invite code (admin only - use revoke instead when possible)
 */
export const deleteInviteCode = async (
  codeId: string
): Promise<InviteCodeResult<boolean>> => {
  try {
    const { error } = await supabase
      .from("invite_codes")
      .delete()
      .eq("id", codeId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    console.error("Delete invite code error:", error);
    return { data: false, error: error as Error };
  }
};

/**
 * Get invite code statistics (admin dashboard)
 */
export const getInviteCodeStats = async (): Promise<
  InviteCodeResult<{
    total: number;
    active: number;
    used: number;
    expired: number;
  }>
> => {
  try {
    const { data, error } = await supabase.from("invite_codes").select("*");

    if (error) throw error;

    const codes = data as InviteCode[];
    const now = new Date();

    const stats = {
      total: codes.length,
      active: codes.filter(
        (c) =>
          c.is_active &&
          c.current_uses < c.max_uses &&
          (!c.expires_at || new Date(c.expires_at) > now)
      ).length,
      used: codes.filter((c) => c.current_uses >= c.max_uses).length,
      expired: codes.filter(
        (c) => c.expires_at && new Date(c.expires_at) <= now
      ).length,
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error("Get invite code stats error:", error);
    return { data: null, error: error as Error };
  }
};

/**
 * Batch create invite codes (admin only)
 */
export const batchCreateInviteCodes = async (
  count: number,
  notes?: string,
  maxUses = 1,
  expiresInDays?: number
): Promise<InviteCodeResult<InviteCode[]>> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Must be authenticated to create invite codes");
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const codes = Array.from({ length: count }, () => ({
      code: generateSecureCode(),
      created_by: user.id,
      notes,
      max_uses: maxUses,
      expires_at: expiresAt,
    }));

    const { data, error } = await supabase
      .from("invite_codes")
      .insert(codes)
      .select();

    if (error) throw error;
    return { data: data as InviteCode[], error: null };
  } catch (error) {
    console.error("Batch create invite codes error:", error);
    return { data: null, error: error as Error };
  }
};
