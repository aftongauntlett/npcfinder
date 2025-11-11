// Recommendations Service - abstraction layer for potential environment swapping
// Extension point: Replace .real import with mock implementation for testing if needed
// Currently re-exports production Supabase implementation

export * from "./recommendationsService.real";
