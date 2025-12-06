import { supabase } from "./supabase";
import { logger } from "@/lib/logger";
import { inviteCodeRateLimiter } from "@/utils/rateLimiter";

// Invite Code Management - Secure invite-only registration system

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
  intended_email: string | null; // Email that is allowed to use this code
  used_by_email?: string | null; // Email of the user who used the code
  created_by_email?: string | null; // Email of the admin who created the code
}

interface InviteCodeResult<T> {
  data: T | null;
  error: Error | null;
}

// Generate cryptographically secure invite code (XXX-XXX-XXX-XXX format, no ambiguous chars)
// SECURITY: Uses crypto.getRandomValues() instead of Math.random() for cryptographic security
export const generateSecureCode = (): string => {
  const characters = "ABCDEFGHJKMNPQRTUVWXY23456789"; // No ambiguous chars (0, O, 1, I, L, S, Z)
  const segments = 4;
  const segmentLength = 3;
  const code: string[] = [];

  for (let i = 0; i < segments; i++) {
    let segment = "";
    for (let j = 0; j < segmentLength; j++) {
      // Use cryptographically secure random number generator
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const randomIndex = array[0] % characters.length;
      segment += characters[randomIndex];
    }
    code.push(segment);
  }

  return code.join("-");
};

// Validate invite code without consuming it
// SECURITY: Email parameter required - if code has intended_email, provided email must match
// SECURITY: Rate limited to prevent brute force enumeration (10 attempts per hour)
export const validateInviteCode = async (
  code: string,
  userEmail: string
): Promise<InviteCodeResult<boolean>> => {
  try {
    // SECURITY: Check rate limit first
    const rateLimitKey = `invite:${userEmail.toLowerCase()}`;
    if (!inviteCodeRateLimiter.checkLimit(rateLimitKey)) {
      const error = new Error(
        "Too many invite code validation attempts. Please try again later."
      );
      throw error;
    }

    const { data, error } = await supabase.rpc("validate_invite_code", {
      code_value: code.toUpperCase().trim(),
      user_email: userEmail.toLowerCase().trim(),
    });

    if (error) throw error;

    // SECURITY: Reset rate limit on successful validation
    if (data === true) {
      inviteCodeRateLimiter.reset(rateLimitKey);
    }

    return { data: data as boolean, error: null };
  } catch (error) {
    logger.error("Failed to validate invite code", { error });
    return { data: false, error: error as Error };
  }
};

// Consume invite code after successful user registration
export const consumeInviteCode = async (
  code: string,
  userId: string
): Promise<InviteCodeResult<boolean>> => {
  try {
    const { data, error } = await supabase.rpc("consume_invite_code", {
      code_value: code.toUpperCase().trim(),
      user_id: userId,
    });

    if (error) throw error;
    return { data: data as boolean, error: null };
  } catch (error) {
    logger.error("Failed to consume invite code", { error });
    return { data: false, error: error as Error };
  }
};

// Create new invite code (admin only) - always 30 days expiration, max 1 use, requires email
export const createInviteCode = async (
  intendedEmail: string
): Promise<InviteCodeResult<InviteCode>> => {
  try {
    const code = generateSecureCode();
    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(); // Always 30 days

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
        intended_email: intendedEmail.toLowerCase().trim(),
        max_uses: 1, // Always 1
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as InviteCode, error: null };
  } catch (error) {
    logger.error("Failed to create invite code", { error });
    return { data: null, error: error as Error };
  }
};

// Get all active invite codes (admin only)
export const getAllInviteCodes = async (): Promise<
  InviteCodeResult<InviteCode[]>
> => {
  try {
    // First get all invite codes (only active ones - excludes old revoked codes)
    const { data: codes, error: codesError } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (codesError) throw codesError;

    // Get unique user IDs for both created_by and used_by
    const allUserIds = new Set<string>();
    codes?.forEach((code) => {
      if (code.created_by) allUserIds.add(code.created_by);
      if (code.used_by) allUserIds.add(code.used_by);
    });

    // Fetch user emails from user_profiles
    let userEmails: Record<string, string> = {};
    if (allUserIds.size > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, email")
        .in("user_id", Array.from(allUserIds));

      if (profiles) {
        userEmails = profiles.reduce((acc, profile) => {
          if (profile.email) {
            acc[profile.user_id] = profile.email;
          }
          return acc;
        }, {} as Record<string, string>);
      }
    }

    // Merge email data into codes
    const codesWithEmails = codes?.map((code) => ({
      ...code,
      used_by_email: code.used_by ? userEmails[code.used_by] || null : null,
      created_by_email: code.created_by
        ? userEmails[code.created_by] || null
        : null,
    }));

    return { data: codesWithEmails as InviteCode[], error: null };
  } catch (error) {
    logger.error("Failed to get all invite codes", { error });
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
    logger.error("Failed to get user's invite codes", { error });
    return { data: null, error: error as Error };
  }
};

/**
 * Revoke (delete) an invite code
 * Permanently removes the code from the database
 */
export const revokeInviteCode = async (
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
    logger.error("Failed to revoke invite code", { error });
    return { data: false, error: error as Error };
  }
};

// Batch create invite codes (admin only)
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
    logger.error("Failed to batch create invite codes", { error });
    return { data: null, error: error as Error };
  }
};
