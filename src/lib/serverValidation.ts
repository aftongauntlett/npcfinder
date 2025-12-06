/**
 * Server-Side Validation Helpers (L1)
 *
 * Defense-in-depth validation utilities that complement RLS policies.
 * These provide early validation and better error messages while RLS
 * remains the ultimate security enforcement layer.
 *
 * SECURITY NOTE:
 * - These checks happen before database queries
 * - They reduce unnecessary database load from unauthorized requests
 * - They provide user-friendly error messages
 * - RLS policies are STILL the primary security mechanism
 */

import { supabase } from "./supabase";
import { logger } from "./logger";

/**
 * Verify user owns a resource before allowing operation
 * Complements RLS policies with early validation
 *
 * @param table - The table name (e.g., 'tasks', 'task_boards')
 * @param resourceId - The ID of the resource to check
 * @param userId - The user ID to verify ownership against
 * @returns true if user owns the resource, false otherwise
 */
export async function verifyOwnership(
  table: string,
  resourceId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select("user_id")
      .eq("id", resourceId)
      .single();

    if (error) {
      // PGRST116 = not found, which is expected for non-existent resources
      if (error.code === "PGRST116") {
        logger.debug("Resource not found during ownership check", {
          table,
          resourceId,
        });
        return false;
      }

      logger.error("Ownership verification failed", {
        error,
        table,
        resourceId,
      });
      return false;
    }

    const isOwner = data?.user_id === userId;

    if (!isOwner) {
      logger.warn(
        "Ownership verification failed - user does not own resource",
        {
          table,
          resourceId,
          userId,
          actualOwnerId: data?.user_id,
        }
      );
    }

    return isOwner;
  } catch (error) {
    logger.error("Ownership verification error", { error, table, resourceId });
    return false;
  }
}

/**
 * Verify users are connected before allowing sharing
 *
 * @param userId - The current user ID
 * @param friendId - The friend user ID to verify connection with
 * @returns true if users are connected, false otherwise
 */
export async function verifyConnection(
  userId: string,
  friendId: string
): Promise<boolean> {
  try {
    // Check if connection exists in either direction
    const { data, error } = await supabase
      .from("connections")
      .select("id")
      .or(
        `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
      )
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      logger.error("Connection verification failed", {
        error,
        userId,
        friendId,
      });
      return false;
    }

    const areConnected = !!data;

    if (!areConnected) {
      logger.warn("Connection verification failed - users are not connected", {
        userId,
        friendId,
      });
    }

    return areConnected;
  } catch (error) {
    logger.error("Connection verification error", { error, userId, friendId });
    return false;
  }
}

/**
 * Verify user is an admin before allowing admin operations
 * Complements the is_admin() database function with client-side check
 *
 * @param userId - The user ID to check admin status for
 * @returns true if user is an admin, false otherwise
 */
export async function verifyAdminStatus(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("user_id", userId)
      .single();

    if (error) {
      logger.error("Admin status verification failed", { error, userId });
      return false;
    }

    return data?.is_admin ?? false;
  } catch (error) {
    logger.error("Admin status verification error", { error, userId });
    return false;
  }
}

/**
 * Verify board access (owns board OR board is shared with user)
 *
 * @param boardId - The board ID to check access for
 * @param userId - The user ID to verify access for
 * @returns true if user has access, false otherwise
 */
export async function verifyBoardAccess(
  boardId: string,
  userId: string
): Promise<boolean> {
  try {
    // First check if user owns the board
    const { data: board, error: boardError } = await supabase
      .from("task_boards")
      .select("user_id, shared_with")
      .eq("id", boardId)
      .single();

    if (boardError) {
      if (boardError.code === "PGRST116") {
        logger.debug("Board not found during access check", { boardId });
        return false;
      }
      logger.error("Board access verification failed", {
        error: boardError,
        boardId,
      });
      return false;
    }

    // User owns the board
    if (board.user_id === userId) {
      return true;
    }

    // Check if board is shared with user
    if (board.shared_with && Array.isArray(board.shared_with)) {
      return board.shared_with.includes(userId);
    }

    logger.warn(
      "Board access denied - user does not own or have shared access",
      {
        boardId,
        userId,
      }
    );

    return false;
  } catch (error) {
    logger.error("Board access verification error", { error, boardId, userId });
    return false;
  }
}

/**
 * Create a standardized unauthorized error
 * Use this to provide consistent error messages across the app
 */
export class UnauthorizedError extends Error {
  constructor(
    message: string = "You do not have permission to perform this action"
  ) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Create a standardized not found error
 */
export class NotFoundError extends Error {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}
