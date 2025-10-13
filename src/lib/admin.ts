/**
 * Check if the current user is an admin
 * Admin user ID is stored in environment variable
 */
export const isAdmin = (userId: string | undefined): boolean => {
  const adminUserId = import.meta.env.VITE_ADMIN_USER_ID;

  if (!adminUserId || adminUserId === "your_user_id_here") {
    console.warn("Admin user ID not configured in .env.local");
    return false;
  }

  return userId === adminUserId;
};
