/**
 * Shared components and types barrel file
 * Centralizes exports for cleaner imports throughout the codebase
 */

// Re-export shared types
export type { BaseRecommendation, FriendSummary, SortOption } from "./types";

// Re-export new reusable UI components
export { default as StarRating } from "./StarRating";
export { default as Accordion } from "./Accordion";
export { default as StatusBadge } from "./StatusBadge";
export { default as PrivacyToggle } from "./PrivacyToggle";
export { default as ActionButtonGroup } from "./ActionButtonGroup";
export type { ActionConfig } from "./ActionButtonGroup";
export { default as MetadataRow } from "./MetadataRow";
export type { MetadataItem } from "./MetadataRow";
export { default as GenreChips } from "./GenreChips";
export { default as MediaPoster } from "./MediaPoster";
export { default as MediaDetailModal } from "./MediaDetailModal";
export { default as UnifiedMediaCard } from "./UnifiedMediaCard";
export { MediaCastList } from "./MediaCastList";
export { MediaCrewInfo } from "./MediaCrewInfo";
