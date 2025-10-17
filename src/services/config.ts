// src/services/config.ts
// Toggle between mock data (for development) and real Supabase (for production)
// Set VITE_USE_MOCK=true in .env.local for dev, false for production
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK === "true";

// Helper to check if we're in development mode
export const IS_DEV = import.meta.env.DEV;
