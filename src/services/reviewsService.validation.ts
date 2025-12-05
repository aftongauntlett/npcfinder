/**
 * Validation Schemas for Reviews Service
 * Uses Zod for runtime type checking at service boundaries
 */

import { z } from "zod";

// Valid media types in our system (must match migration constraint)
const MediaTypeEnum = z.enum([
  "movie",
  "tv",
  "song",
  "album",
  "playlist",
  "game",
  "book",
]);

// Create Review Schema
export const CreateReviewSchema = z.object({
  user_id: z.string().uuid("Invalid user ID format"),
  external_id: z.string().min(1, "External ID is required"),
  media_type: MediaTypeEnum,
  title: z.string().min(1, "Title is required").max(500, "Title too long"),
  rating: z.number().min(1).max(5).nullable().optional(),
  review_text: z
    .string()
    .max(2000, "Review text must be 2000 characters or less")
    .nullable()
    .optional(),
  is_public: z.boolean().default(true),
  watched_at: z.string().datetime().nullable().optional(),
});

// Update Review Schema (all fields optional except what's being updated)
export const UpdateReviewSchema = z.object({
  rating: z.number().min(1).max(5).nullable().optional(),
  review_text: z
    .string()
    .max(2000, "Review text must be 2000 characters or less")
    .nullable()
    .optional(),
  is_public: z.boolean().optional(),
  watched_at: z.string().datetime().nullable().optional(),
});

// Query parameters validation
export const ReviewQuerySchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  externalId: z.string().min(1, "External ID is required"),
  mediaType: MediaTypeEnum,
});

// Validate review ID (UUID format)
export const ReviewIdSchema = z.string().uuid("Invalid review ID format");

// Export inferred types for use in the service
export type ValidatedCreateReview = z.infer<typeof CreateReviewSchema>;
export type ValidatedUpdateReview = z.infer<typeof UpdateReviewSchema>;
export type ValidatedReviewQuery = z.infer<typeof ReviewQuerySchema>;
