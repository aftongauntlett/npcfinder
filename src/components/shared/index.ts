/**
 * Shared components and types barrel file
 * Centralizes exports for cleaner imports throughout the codebase
 */

// Re-export shared types
export type { BaseRecommendation, FriendSummary, SortOption } from "./types";

// UI Components - Primitive UI building blocks
export { default as Button } from "./ui/Button";
export { default as Input } from "./ui/Input";
export { default as Textarea } from "./ui/Textarea";
export { default as Select } from "./ui/Select";
export { default as Dropdown } from "./ui/Dropdown";
export { default as Card } from "./ui/Card";
export { default as Modal } from "./ui/Modal";
export { default as ConfirmDialog } from "./ui/ConfirmDialog";
export { default as ConfirmationModal } from "./ui/ConfirmationModal";
export { default as Alert } from "./ui/Alert";
export { default as Tooltip } from "./ui/Tooltip";
export { AudioPlayer } from "./ui/AudioPlayer";
export { default as ErrorBoundary } from "./ui/ErrorBoundary";
export { default as GlobalErrorNotifications } from "./ui/GlobalErrorNotifications";

// Media Components - Media-specific functionality
export { default as MediaDetailModal } from "./media/MediaDetailModal";
export { default as MediaPoster } from "./media/MediaPoster";
export { default as MediaHeader } from "./media/MediaHeader";
export { default as MediaReview } from "./media/MediaReview";
export { default as MediaReviewModal } from "./media/MediaReviewModal";
export { default as MediaDetailsContent } from "./media/MediaDetailsContent";
export { MediaCastList } from "./media/MediaCastList";
export { MediaCrewInfo } from "./media/MediaCrewInfo";
export { default as MediaMetrics } from "./media/MediaMetrics";
export { default as MetadataGrid } from "./media/MetadataGrid";
export type { MetadataGridItem } from "./media/MetadataGrid";
export { default as MediaRecommendationCard } from "./media/MediaRecommendationCard";
export { default as UnifiedMediaCard } from "./media/UnifiedMediaCard";
export { default as MediaStatusSelector } from "./media/MediaStatusSelector";
export { default as MediaPageToolbar } from "./media/MediaPageToolbar";
export { default as GroupedSentMediaCard } from "./media/GroupedSentMediaCard";
export { default as SendMediaModal } from "./media/SendMediaModal";
export type { MediaItem } from "./media/SendMediaModal";
export { default as MediaRecommendationsLayout } from "./media/MediaRecommendationsLayout";
export { default as InlineRecommendationsLayout } from "./media/InlineRecommendationsLayout";
export { default as MediaContributorList } from "./media/MediaContributorList";
export { default as MediaOverviewSection } from "./media/MediaOverviewSection";
export { default as MediaUserNotes } from "./media/MediaUserNotes";
export { default as MediaUserRating } from "./media/MediaUserRating";

// Common Components - General purpose components
export { Pagination } from "./common/Pagination";
export { default as EmptyStateAddCard } from "./common/EmptyStateAddCard";

// Search Components - Search modal components
export { default as SearchMovieModal } from "./search/SearchMovieModal";
export { default as SearchBookModal } from "./search/SearchBookModal";
export { default as SearchGameModal } from "./search/SearchGameModal";
export { default as SearchMusicModal } from "./search/SearchMusicModal";
export { default as UserSearch } from "./search/UserSearch";
export { default as FriendSearchModal } from "./search/FriendSearchModal";

// Layout Components - Layout and navigation
export { default as Sidebar } from "./layout/Sidebar";
export { default as Header } from "./layout/Header";
export { default as Footer } from "./layout/Footer";
export { default as Breadcrumb } from "./layout/Breadcrumb";
export { default as NavList } from "./layout/NavList";
export { default as UserMenuDropdown } from "./layout/UserMenuDropdown";

// Common Components - Reusable utility components
export { default as StarRating } from "./common/StarRating";
export { default as StatusBadge } from "./common/StatusBadge";
export { default as GenreChips } from "./common/GenreChips";
export { default as Accordion } from "./common/Accordion";
export { default as AccordionListCard } from "./common/AccordionListCard";
export { default as EmptyState } from "./common/EmptyState";
export { default as FilterSortMenu } from "./common/FilterSortMenu";
export type { FilterSortSection } from "./common/FilterSortMenu";
export { default as PrivacyToggle } from "./common/PrivacyToggle";
export { default as ActionButtonGroup } from "./common/ActionButtonGroup";
export type { ActionConfig } from "./common/ActionButtonGroup";
export { default as MetadataRow } from "./common/MetadataRow";
export type { MetadataItem } from "./common/MetadataRow";
export { default as StatCard } from "./common/StatCard";
export { default as StarryBackground } from "./common/StarryBackground";
export { default as QuickSwitch } from "./common/QuickSwitch";
export { default as FeedbackModal } from "./common/FeedbackModal";
