# Component Library Guide

## Overview

This guide documents the NPC Finder component library, design system, and best practices for building consistent, accessible, and maintainable UI components.

## Core Principles

1. **Consistency**: All components follow the same design patterns and styling conventions
2. **Accessibility**: WCAG 2.1 AA compliance is required for all components
3. **Theme Support**: All components use theme colors (never hard-code purple)
4. **Composition**: Build complex components from simple, reusable base components
5. **No Scale/Grow Hover Effects**: Use subtle transitions (border color change, lift) only

## Design Tokens

Use design tokens from `src/styles/designTokens.ts` for consistent spacing, typography, and sizing:

```typescript
import {
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOW,
} from "@/styles/designTokens";

// Usage
<div style={{ padding: SPACING.md, borderRadius: BORDER_RADIUS.lg }} />;
```

### Available Tokens

- **SPACING**: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`
- **FONT_SIZE**: `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `3xl`
- **FONT_WEIGHT**: `normal`, `medium`, `semibold`, `bold`
- **BORDER_RADIUS**: `sm`, `md`, `lg`, `xl`, `full`
- **SHADOW**: `none`, `sm`, `md`, `lg`, `xl`
- **TRANSITION**: `fast` (150ms), `base` (200ms), `slow` (300ms)
- **Z_INDEX**: `dropdown` (1000), `modal` (1300), `tooltip` (1500), `toast` (1600)
- **BREAKPOINTS**: `sm`, `md`, `lg`, `xl`, `2xl`

## Theme Colors

### Using Theme Colors

**ALWAYS use theme colors instead of hard-coding purple (#9333ea, purple-500, etc.)**

#### Tailwind Classes (Preferred)

```tsx
// ✅ CORRECT - Uses theme color
<div className="bg-primary text-white" />
<div className="border-primary/20 hover:border-primary" />
<input className="focus:ring-primary" />

// ❌ WRONG - Hard-coded purple
<div className="bg-purple-500" />
<div className="text-purple-600" />
```

#### CSS Custom Properties

```tsx
// For inline styles or complex cases
<div style={{ color: 'var(--color-primary)' }} />
<div style={{ backgroundColor: 'rgb(var(--color-primary) / 0.1)' }} />
```

#### Theme Utilities

```typescript
import {
  useThemeColorStyles,
  getThemeColorWithOpacity,
} from "@/utils/themeUtils";

// In component
const themeStyles = useThemeColorStyles();
const bgColor = getThemeColorWithOpacity(themeColor, 0.1);
```

### Theme Color Variants

- `primary`: Main theme color
- `primary-dark`: Darker variant
- `primary-light`: Lighter variant
- `primary-pale`: Very light variant (for backgrounds)

With opacity modifiers:

- `bg-primary/10`: 10% opacity background
- `border-primary/20`: 20% opacity border
- `text-primary/80`: 80% opacity text

## Base UI Components

Located in `src/components/shared/ui/`

### Card

Enhanced base card component with variants and hover effects.

```tsx
import Card from "@/components/shared/ui/Card";

<Card
  variant="interactive" // default | elevated | interactive | glass
  hover="border" // none | lift | border | glow
  shadow="md" // none | sm | md | lg
  spacing="md" // none | sm | md | lg
  border={true}
  clickable={true}
  onClick={handleClick}
>
  Card content
</Card>;
```

**Variants:**

- `default`: Standard card
- `elevated`: Permanent elevated shadow
- `interactive`: For clickable cards
- `glass`: Glassmorphism effect

**Hover Effects:**

- `none`: No hover effect
- `lift`: Subtle upward translation (-2px)
- `border`: Border color changes to theme color
- `glow`: Shadow + border color change

**Rules:**

- Never use `hover:scale-105` or grow effects
- Use `hover="border"` for most interactive cards
- Use `hover="lift"` sparingly for emphasis
- Always add `clickable` prop if `onClick` is provided

### Button

Comprehensive button component with variants and states.

```tsx
import Button from "@/components/shared/ui/Button";

<Button
  variant="primary" // primary | secondary | subtle | danger | action
  size="md" // sm | md | lg | icon
  icon={<Plus />}
  iconPosition="left"
  loading={isLoading}
  fullWidth={false}
>
  Button Text
</Button>;
```

**Variants:**

- `primary`: Solid fill with theme color
- `secondary`: Outlined style
- `subtle`: Minimal ghost style
- `danger`: For destructive actions (delete, remove)
- `action`: Prominent for high-frequency actions (Add, Create)

**Icon-only buttons MUST have aria-label**

### Chip

Badge/tag component for labels and filters.

```tsx
import Chip from "@/components/shared/ui/Chip";

<Chip
  variant="primary" // default | primary | success | warning | danger | info
  size="md" // sm | md | lg
  rounded="default" // default | full
  removable={true}
  onRemove={handleRemove}
  icon={<Tag />}
>
  Label
</Chip>;
```

**Use Cases:**

- Status indicators
- Filter tags
- Category labels
- Genre/tag chips

### Select

Styled select dropdown matching Input/Textarea design.

```tsx
import Select from "@/components/shared/ui/Select";

<Select
  label="Status"
  error={errors.status}
  helperText="Choose a status"
  options={[
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive", disabled: true },
  ]}
  placeholder="Select status..."
  size="md"
/>;
```

### Dropdown

Custom dropdown menu component (not native select).

```tsx
import Dropdown from "@/components/shared/ui/Dropdown";

<Dropdown
  trigger={<Button>Options</Button>}
  options={[
    { id: "1", label: "Edit", icon: <Pencil /> },
    { id: "2", label: "Delete", icon: <Trash />, disabled: false },
  ]}
  value={selectedId}
  onChange={handleChange}
  multiSelect={false}
  align="right"
/>;
```

**Features:**

- Keyboard navigation (Arrow keys, Enter, Escape)
- Auto-flip if near viewport edge
- Theme color for active/selected states
- Checkmark icon for selected items

### Input & Textarea

Form input components with consistent styling.

```tsx
import Input from '@/components/shared/ui/Input';
import Textarea from '@/components/shared/ui/Textarea';

<Input
  label="Email"
  type="email"
  error={errors.email}
  helperText="We'll never share your email"
  leftIcon={<Mail />}
  required
/>

<Textarea
  label="Notes"
  rows={4}
  placeholder="Add your notes..."
/>
```

### Modal

Already exists and is well-designed. Continue using as-is.

## Specialized Card Components

Located in `src/components/shared/cards/`

### MediaCard

For media items (movies, TV, books, games, music).

```tsx
import { MediaCard } from "@/components/shared/cards";

<MediaCard
  id={item.id}
  title={item.title}
  subtitle={item.director}
  posterUrl={item.poster}
  year={item.year}
  personalRating={item.rating}
  status={item.status}
  mediaType="movie"
  onClick={handleClick}
/>;
```

### JobCard

For job application tracking.

```tsx
import { JobCard } from "@/components/shared/cards";

<JobCard
  id={job.id}
  companyName={job.company}
  position={job.position}
  status={job.status}
  dateApplied={job.date}
  location={job.location}
  locationType="Remote"
  salaryRange="$100k-$150k"
  employmentType="Full-time"
  statusHistory={job.history}
  notes={job.notes}
  statusOptions={statusOptions}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onStatusChange={handleStatusChange}
  themeColor={themeColor}
/>;
```

**Fixed Issues:**

- No scale/grow hover effects
- Better information hierarchy (company name prominent, date visible)
- Location with badge showing Remote/Hybrid/In-Office
- Inline note expansion (no accordion)
- Reduced card height with tighter spacing

### RecipeCard

For recipe display.

```tsx
import { RecipeCard } from "@/components/shared/cards";

<RecipeCard
  id={recipe.id}
  name={recipe.name}
  category={recipe.category}
  prepTime="15 min"
  cookTime="30 min"
  servings="4"
  ingredients={recipe.ingredients}
  instructions={recipe.instructions}
  notes={recipe.notes}
  compact={false} // true for minimal display
  onEdit={handleEdit}
/>;
```

### BoardCard

For task board display (already exists in shared/cards).

```tsx
import { BoardCard } from "@/components/shared/cards";

<BoardCard
  board={board}
  onClick={handleClick}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onCreateTask={handleCreateTask}
  isStarter={false}
/>;
```

## Hover Effect Standards

### ❌ NEVER Use

```tsx
// WRONG - Scale effects
<div className="hover:scale-105" />
<motion.div whileHover={{ scale: 1.05 }} />

// WRONG - Grow effects
<div className="hover:grow" />
```

### ✅ ALWAYS Use

```tsx
// CORRECT - Border color change
<Card hover="border" />
<div className="hover:border-primary" />

// CORRECT - Subtle lift (maximum -2px)
<Card hover="lift" />
<div className="hover:-translate-y-0.5" />

// CORRECT - Opacity changes
<button className="opacity-100 hover:opacity-80" />
```

## Spacing Standards

Use consistent padding and margins from design tokens:

```tsx
// Card padding variants
<Card spacing="sm" />  // p-3 (12px)
<Card spacing="md" />  // p-6 (24px) - DEFAULT
<Card spacing="lg" />  // p-8 (32px)

// Custom spacing
<div style={{ padding: SPACING.md, gap: SPACING.sm }} />
```

## Accessibility Requirements

### Keyboard Navigation

All interactive elements must support keyboard navigation:

```tsx
<Card
  clickable
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }}
  tabIndex={0}
  role="button"
  aria-label="Descriptive label"
/>
```

### ARIA Labels

Icon-only buttons MUST have aria-label:

```tsx
// ✅ CORRECT
<Button size="icon" aria-label="Delete item">
  <Trash />
</Button>

// ❌ WRONG - Missing aria-label
<Button size="icon">
  <Trash />
</Button>
```

### Focus States

All interactive elements have theme-aware focus rings:

```tsx
// Already included in Card/Button components
className = "focus:ring-2 focus:ring-primary focus:ring-offset-2";
```

## Deprecated Components

DO NOT USE these components for new code:

- `IconButton` (use `Button` with `size="icon"`)
- `ActionButton` (use `Button` with `variant="action"`)
- Old `Card` without variants (use new enhanced `Card`)

## Creating New Components

### Checklist

When creating a new component:

1. ✅ Uses design tokens for spacing, sizing, typography
2. ✅ Supports both light and dark modes
3. ✅ Uses theme colors (no hard-coded purple)
4. ✅ No scale/grow hover effects
5. ✅ Proper ARIA labels and keyboard navigation
6. ✅ Focus states with theme color ring
7. ✅ Consistent with existing components
8. ✅ Documented with examples
9. ✅ Responsive (mobile-friendly)
10. ✅ TypeScript types defined

### Component Template

```tsx
import React from "react";
import { SPACING, BORDER_RADIUS } from "@/styles/designTokens";

interface MyComponentProps {
  children: React.ReactNode;
  variant?: "default" | "primary";
  onClick?: () => void;
  className?: string;
}

/**
 * MyComponent - Brief description
 *
 * @example
 * <MyComponent variant="primary" onClick={handleClick}>
 *   Content
 * </MyComponent>
 */
const MyComponent: React.FC<MyComponentProps> = ({
  children,
  variant = "default",
  onClick,
  className = "",
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        transition-colors duration-200
        ${variant === "primary" ? "bg-primary text-white" : "bg-gray-100"}
        ${onClick ? "cursor-pointer hover:opacity-80" : ""}
        ${className}
      `
        .trim()
        .replace(/\s+/g, " ")}
    >
      {children}
    </div>
  );
};

export default MyComponent;
```

## Migration Guide

### Updating Old Components

1. **Replace hard-coded purple:**

   ```tsx
   // Before
   <div className="text-purple-600 bg-purple-100" />

   // After
   <div className="text-primary bg-primary/10" />
   ```

2. **Remove scale hover:**

   ```tsx
   // Before
   <Card className="hover:scale-105" />

   // After
   <Card hover="border" />
   ```

3. **Use new Chip component:**

   ```tsx
   // Before
   <span className="px-2 py-1 bg-purple-100 text-purple-700">Label</span>

   // After
   <Chip variant="primary">Label</Chip>
   ```

4. **Use theme-aware focus rings:**

   ```tsx
   // Before
   <button className="focus:ring-purple-500" />

   // After
   <button className="focus:ring-primary" />
   ```

## Testing

Ensure components work correctly:

1. Light and dark mode
2. Different theme colors (not just purple)
3. Keyboard navigation
4. Screen readers (use aria-labels)
5. Mobile/touch devices
6. Hover states (subtle, no scale)

## Questions?

If you're unsure about component usage or design patterns, refer to:

- Existing components in `src/components/shared/ui/`
- Design tokens in `src/styles/designTokens.ts`
- Theme utilities in `src/utils/themeUtils.ts`
- This guide

When in doubt, **maintain consistency** with existing well-designed components like Button and Modal.
