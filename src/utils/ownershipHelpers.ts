/**
 * Ownership Validation Helpers
 * SECURITY: Frontend ownership checks to prevent unnecessary database queries
 * These checks complement RLS policies with early validation
 */

/**
 * Validate that an item ID exists in a list of owned items
 * @param itemId The ID to check
 * @param ownedItems Array of items the user owns
 * @returns true if item is owned, false otherwise
 */
export function validateOwnership<T extends { id: string }>(
  itemId: string,
  ownedItems: T[] | undefined
): boolean {
  if (!ownedItems) return false;
  return ownedItems.some((item) => item.id === itemId);
}

/**
 * Validate multiple IDs against owned items
 * @param itemIds Array of IDs to check
 * @param ownedItems Array of items the user owns
 * @returns true if all IDs are owned, false otherwise
 */
export function validateMultipleOwnership<T extends { id: string }>(
  itemIds: string[],
  ownedItems: T[] | undefined
): boolean {
  if (!ownedItems) return false;
  return itemIds.every((id) => validateOwnership(id, ownedItems));
}

/**
 * Create an ownership error with consistent messaging
 * @param resourceType Type of resource (e.g., "Board", "Task")
 * @returns Error object
 */
export function createOwnershipError(resourceType: string): Error {
  return new Error(`${resourceType} not found or access denied`);
}
