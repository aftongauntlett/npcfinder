TypeScript:

- Avoid `any`. Use proper generics, interfaces, utility types (Pick/Omit), and discriminated unions.
- Prefer `zod`/schema types (if present) for runtime boundaries.
- No `// @ts-ignore` unless accompanied by TODO with reason.

React:

- Keep components focused. Split when size or responsibilities grow.
- Extract hooks for reusable stateful logic (`useXYZ`).
- Extract pure helpers for formatting, filtering, and mapping.
- Accessibility: semantic tags, labels, keyboard flows, focus management for modals/menus.
- Responsive by default; avoid hard-coded sizes; use container queries or utilities.

Refactoring:

- If code repeats (≥3), suggest creating a component/hook/helper.
- If props grow noisy (>8) or unclear, propose a typed prop object or composition.
- Keep side effects in `useEffect` minimal and properly scoped; prefer derived state to duplicated state.

## Shared Component Library

The following reusable components are available in `src/components/shared/` for consistent UI across the app:

### Core Components

- **StarRating**: Interactive or readonly star rating (1-5 stars)

  - Props: `rating`, `onRatingChange`, `size`, `readonly`, `showClearButton`, `showLabel`
  - Use for: User ratings in forms, readonly display in cards/lists, review sections
  - Handles hover states, keyboard navigation, clear functionality

- **Accordion**: Collapsible sections with smooth animations

  - Props: `title`, `subtitle`, `children`, `defaultExpanded`, `isExpanded`, `onToggle`, `variant`
  - Use for: Review forms, expandable content sections, FAQ-style layouts
  - Supports both controlled and uncontrolled modes

- **StatusBadge**: Consistent status badges (watched, reading, played, completed, etc.)

  - Props: `status`, `mediaType`, `size`, `variant`, `showIcon`
  - Use for: Media status indicators across all media types
  - Auto-maps colors: completed=green, in-progress=blue, planned=purple, dropped=red

- **PrivacyToggle**: Privacy toggle with switch or button variants

  - Props: `isPublic`, `onChange`, `variant`, `size`, `showDescription`, `contextLabel`
  - Use for: Review forms, privacy settings, content visibility controls
  - Variants: `switch` (compact) or `button` (detailed with explanatory text)

- **ActionButtonGroup**: Consistent action button sets (remove, complete, recommend)

  - Props: `actions: ActionConfig[]`, `orientation`, `size`, `spacing`
  - Use for: Repeated action patterns, media list items, recommendation cards
  - Handles motion animations, tooltips, variants (default, danger, success, warning)

- **MetadataRow**: Display metadata items with icons (year, runtime, page count, etc.)

  - Props: `items: MetadataItem[]`, `size`
  - Use for: Detail modals, media info sections
  - Auto-filters items with no value, handles responsive wrapping

- **GenreChips**: Genre/category badges with color coding

  - Props: `genres`, `maxVisible`, `size`, `variant`
  - Use for: Genre tags across all media types
  - Supports overflow with "+X more" chip, uses `getGenreColor` utility for consistency

- **MediaPoster**: Media artwork with fallback UI
  - Props: `src`, `alt`, `aspectRatio`, `size`, `fallbackIcon`, `showOverlay`, `overlayContent`
  - Use for: Movie posters, book covers, game art, album covers
  - Handles image errors, lazy loading, optional hover overlay

### Composite Components

- **MediaDetailModal**: Unified modal for all media types (movies, books, games, music)

  - Props: `mediaType`, `title`, `posterUrl`, `metadata`, `genres`, `description`, `status`, `rating`, action callbacks, `additionalContent`, `reviewSection`
  - Use for: Detail views across all media types (consolidates MovieDetailModal, GameDetailModal, BookDetailModal)
  - Eliminates ~600 lines of duplicated code across three separate modals

- **UnifiedMediaCard**: Unified card for all media types
  - Props: `id`, `title`, `subtitle`, `posterUrl`, `year`, `personalRating`, `status`, `mediaType`, `onClick`
  - Use for: Grid/carousel displays across all media types
  - Consolidates MediaCard and BookCard into single flexible component
  - Includes hover effects, status badges, overlay with info

### Usage Guidelines

- **Always use these shared components** instead of creating custom implementations
- When creating new pages/sections, **check if existing shared components can be used**
- If you need to modify behavior, **consider adding props** to the shared component rather than creating a new one
- See component files for detailed prop documentation and JSDoc examples
- Import from barrel file: `import { StarRating, Accordion, StatusBadge } from '@/components/shared';`

### Deprecated Components

The following components are deprecated and should not be used for new features:

- `MediaCard` → Use `UnifiedMediaCard` instead
- `BookCard` → Use `UnifiedMediaCard` instead
- `MovieDetailModal`, `GameDetailModal`, `BookDetailModal` → Will migrate to `MediaDetailModal`
