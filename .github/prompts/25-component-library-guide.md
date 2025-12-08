# Component Library Guide

## Overview

This guide documents the NPC Finder component library, design system, and best practices for building consistent, accessible, and maintainable UI components.

## ⚠️ Mandatory Component Usage

**ALWAYS use reusable components from `src/components/shared/ui/` and `src/components/shared/common/` instead of creating custom implementations.** This ensures consistency, accessibility, and maintainability across the entire application.

### Required Components

You MUST use these components for the following UI elements:

#### Form Elements

- **Button** (`/src/components/shared/ui/Button.tsx`) - ALL buttons, including icon-only buttons

  - ❌ Never use `<button>` directly
  - ❌ Never use deprecated `IconButton` or `ActionButton`
  - ✅ Use `<Button variant="primary" />` for primary actions
  - ✅ Use `<Button size="icon" icon={<Icon />} aria-label="..." />` for icon buttons

- **Input** (`/src/components/shared/ui/Input.tsx`) - ALL text/email/number/etc inputs

  - ❌ Never use `<input>` directly
  - ✅ Use `<Input label="Email" type="email" error={errors.email} />`
  - Provides consistent styling, labels, errors, helper text, and accessibility

- **Textarea** (`/src/components/shared/ui/Textarea.tsx`) - ALL text areas

  - ❌ Never use `<textarea>` directly
  - ✅ Use `<Textarea label="Description" rows={4} />`
  - Provides consistent styling, labels, errors, helper text, and accessibility

- **Select** (`/src/components/shared/ui/Select.tsx`) - ALL native dropdown selects

  - ❌ Never use `<select>` directly
  - ❌ Never use deprecated `CustomDropdown`
  - ✅ Use `<Select label="Status" options={statusOptions} />`
  - Provides consistent styling, labels, errors, and accessibility

- **Dropdown** (`/src/components/shared/ui/Dropdown.tsx`) - Custom dropdown menus (non-native)
  - ❌ Never build custom dropdown implementations with manual click-outside handling
  - ✅ Use `<Dropdown trigger={<Button>Menu</Button>} options={menuOptions} />`
  - Handles keyboard navigation, backdrop clicks, and positioning automatically

#### Modal Dialogs

- **Modal** (`/src/components/shared/ui/Modal.tsx`) - Base for ALL modals

  - ❌ Never build custom modal dialogs with backdrop and card manually
  - ✅ Use `<Modal isOpen={isOpen} onClose={onClose} title="Title">Content</Modal>`
  - All modal components should use Modal as their base

- **ConfirmDialog** (`/src/components/shared/ui/ConfirmDialog.tsx`) - ALL confirmation dialogs

  - ❌ Never build custom confirmation dialogs
  - ✅ Use `<ConfirmDialog isOpen={show} onConfirm={handleConfirm} message="..." variant="danger" />`

- **ConfirmationModal** (`/src/components/shared/ui/ConfirmationModal.tsx`) - Alternative confirmation component
  - Similar to ConfirmDialog, use for consistency

#### Layout Components

- **Card** (`/src/components/shared/ui/Card.tsx`) - ALL content containers

  - ❌ Never build custom cards with manual styling
  - ✅ Use `<Card variant="interactive" hover="border">Content</Card>`
  - Provides consistent spacing, shadows, hover effects, and theme integration

- **Accordion** / **AccordionCard** (`/src/components/shared/common/`) - ALL expandable sections
  - ❌ Never build custom expand/collapse logic
  - ✅ Use `<Accordion title="Title">Content</Accordion>`
  - Handles animation, keyboard navigation, and accessibility

### Component Consistency Rules

1. **All modals MUST use Modal as base** - Never create standalone modals with custom backdrop/positioning
2. **All buttons MUST use Button component** - Never use `<button>` or deprecated button components
3. **All form inputs MUST use Input/Textarea/Select** - Never use native HTML form elements directly
4. **All dropdowns MUST use Dropdown/Select** - Never build custom dropdown menus
5. **All cards MUST use Card component** - Ensures consistent hover effects and spacing
6. **All accordions MUST use Accordion/AccordionCard** - Consistent expand/collapse behavior

## 🚫 Deprecated Components

**DO NOT USE** these components in new code. They are kept for backwards compatibility only and will be removed in a future version.

### IconButton (DEPRECATED)

❌ **DEPRECATED** - Use `<Button size="icon" />` instead

```tsx
// ❌ WRONG - Deprecated
<IconButton icon={Trash} onClick={handleDelete} title="Delete" />

// ✅ CORRECT - Use Button
<Button
  size="icon"
  variant="danger"
  icon={<Trash className="w-4 h-4" />}
  onClick={handleDelete}
  aria-label="Delete"
/>
```

**Migration:**

- `variant="default"` → `<Button variant="subtle" size="icon" />`
- `variant="danger"` → `<Button variant="danger" size="icon" />`
- `variant="primary"` → `<Button variant="primary" size="icon" />`
- **ALWAYS add `aria-label` for accessibility**

### ActionButton (DEPRECATED)

❌ **DEPRECATED** - Use `<Button variant="action" size="icon" />` instead

```tsx
// ❌ WRONG - Deprecated
<ActionButton icon={MessageCircle} onClick={handleComment} variant="comment" />

// ✅ CORRECT - Use Button
<Button
  size="icon"
  variant="action"
  icon={<MessageCircle className="w-4 h-4" />}
  onClick={handleComment}
  aria-label="Add comment"
/>
```

### CustomDropdown (DELETED)

❌ **DELETED** - This component has been removed. Use `Select` or `Dropdown` instead.

```tsx
// ❌ WRONG - CustomDropdown no longer exists
<CustomDropdown
  label="Status"
  value={status}
  onChange={setStatus}
  options={["Active", "Inactive"]}
/>

// ✅ CORRECT - Use Select for simple dropdowns
<Select
  label="Status"
  value={status}
  onChange={(e) => setStatus(e.target.value)}
  options={[
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" }
  ]}
/>

// ✅ CORRECT - Use Dropdown for custom menus
<Dropdown
  trigger={<Button>Select Status</Button>}
  options={[
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" }
  ]}
  value={status}
  onChange={(value) => setStatus(value)}
/>
```

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

## Real-World Examples

### Correct Modal Usage (TaskDetailModal)

```tsx
import Modal from "../shared/ui/Modal";
import Button from "../shared/ui/Button";
import Input from "../shared/ui/Input";
import Textarea from "../shared/ui/Textarea";
import Select from "../shared/ui/Select";

const TaskDetailModal = ({ isOpen, onClose, task }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Task" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <Input
          id="task-title"
          label="Task Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
        />

        <Textarea
          id="task-description"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={1000}
        />

        <Select
          id="status"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: "todo", label: "To Do" },
            { value: "in_progress", label: "In Progress" },
            { value: "done", label: "Done" },
          ]}
        />

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
```

### Correct Dropdown Usage (SortDropdown)

```tsx
import { Dropdown } from "@/components/shared";
import { Button } from "@/components/shared";

const SortDropdown = ({ options, activeSort, onSortChange }) => {
  const activeOption = options.find((opt) => opt.id === activeSort);

  return (
    <Dropdown
      trigger={
        <Button variant="secondary" size="sm">
          {activeOption?.label || "Sort"}
        </Button>
      }
      options={options.map((opt) => ({ id: opt.id, label: opt.label }))}
      value={activeSort}
      onChange={(value) => onSortChange(value)}
      size="sm"
    />
  );
};
```

### Correct Confirmation Dialog Usage (UserSettings)

```tsx
import { ConfirmDialog } from "@/components/shared";

const UserSettings = () => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  return (
    <>
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirm}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
        confirmText="Leave Without Saving"
        cancelText="Stay on Page"
        variant="danger"
      />

      {/* Rest of component */}
    </>
  );
};
```

### Job Tracker Form (CreateTaskModal)

```tsx
const CreateTaskModal = ({ isOpen, onClose, boardType }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Job Application">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="company-name"
            label="Company Name"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />

          <Input
            id="position"
            label="Position"
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            required
          />

          <Input
            id="salary-range"
            label="Salary Range"
            type="text"
            value={salaryRange}
            onChange={(e) => setSalaryRange(e.target.value)}
          />

          <Input
            id="location"
            label="Location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <Select
            id="employment-type"
            label="Employment Type"
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            options={[
              { value: "Full-time", label: "Full-time" },
              { value: "Part-time", label: "Part-time" },
              { value: "Contract", label: "Contract" },
              { value: "Internship", label: "Internship" },
              { value: "Remote", label: "Remote" },
            ]}
          />

          <Select
            id="status"
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "Applied", label: "Applied" },
              { value: "Phone Screen", label: "Phone Screen" },
              { value: "Interview - Round 1", label: "Interview - Round 1" },
              { value: "Offer Received", label: "Offer Received" },
            ]}
          />
        </div>

        <Textarea
          id="job-notes"
          label="Notes"
          value={jobNotes}
          onChange={(e) => setJobNotes(e.target.value)}
          rows={4}
        />

        <Button type="submit" variant="primary" fullWidth>
          Add Job Application
        </Button>
      </form>
    </Modal>
  );
};
```

## Common Mistakes to Avoid

### ❌ Building Custom Dropdowns

```tsx
// ❌ WRONG - Custom dropdown implementation
const [isOpen, setIsOpen] = useState(false);

return (
  <div className="relative">
    <button onClick={() => setIsOpen(!isOpen)}>Options</button>
    {isOpen && (
      <div className="absolute mt-2 bg-white shadow-lg">
        {/* Custom menu logic */}
      </div>
    )}
  </div>
);
```

```tsx
// ✅ CORRECT - Use Dropdown component
<Dropdown
  trigger={<Button>Options</Button>}
  options={options}
  onChange={handleChange}
/>
```

### ❌ Inline Form Elements

```tsx
// ❌ WRONG - Inline input with custom styling
<div>
  <label className="block text-sm font-medium mb-2">Email</label>
  <input
    type="email"
    className="w-full border rounded-lg px-3 py-2 focus:ring-2"
  />
</div>
```

```tsx
// ✅ CORRECT - Use Input component
<Input
  label="Email"
  type="email"
  error={errors.email}
  helperText="We'll never share your email"
/>
```

### ❌ Custom Confirmation Dialogs

```tsx
// ❌ WRONG - Custom dialog markup
{
  showConfirm && (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="bg-white rounded-lg p-6">
        <h3>Are you sure?</h3>
        <button onClick={handleCancel}>Cancel</button>
        <button onClick={handleConfirm}>Confirm</button>
      </div>
    </div>
  );
}
```

```tsx
// ✅ CORRECT - Use ConfirmDialog
<ConfirmDialog
  isOpen={showConfirm}
  onClose={handleCancel}
  onConfirm={handleConfirm}
  title="Are you sure?"
  message="This action cannot be undone."
/>
```

## Accordion Design System

### Accordion Component Types

1. **AccordionCard** (`/src/components/shared/common/AccordionCard.tsx`) - Rich glassmorphic cards for Boards and Tasks
2. **AccordionListCard** (`/src/components/shared/common/AccordionListCard.tsx`) - Lightweight cards for Jobs, Recipes, Media items
3. **Accordion** (`/src/components/shared/common/Accordion.tsx`) - Simple collapsible sections (base component)

### Consistent Accordion Content Styling

**All accordion expanded content MUST follow these exact standards for visual cohesion:**

#### Section Titles (h4)

```tsx
<h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
  Section Title
</h4>
```

#### Body Text

```tsx
<p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
  Body text content
</p>
```

#### Unordered Lists (Bullets)

```tsx
<ul className="space-y-1.5">
  <li className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2 leading-relaxed">
    <span className="text-primary mt-1 flex-shrink-0">•</span>
    <span>List item content</span>
  </li>
</ul>
```

#### Ordered Lists (Numbered)

```tsx
<ol className="space-y-2">
  <li className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-3 leading-relaxed">
    <span className="font-semibold text-primary flex-shrink-0">1.</span>
    <span>List item content</span>
  </li>
</ol>
```

#### Highlighted Content (Notes, Backgrounds)

```tsx
<div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-800/30 rounded-md p-3">
  {notes}
</div>
```

**Note:** Use `dark:bg-gray-800/30` NOT `dark:bg-gray-900/50` for consistency

#### Section Container Spacing

```tsx
<div className="space-y-4">{/* Sections with space-y-4 between each */}</div>
```

#### Divider Styling

Both AccordionCard and AccordionListCard use consistent dividers:

```tsx
className = "px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-3";
```

### Accordion Action Buttons Pattern

**Standard pattern:** `[Edit] [Delete] | [Chevron]`

```tsx
<div className="flex items-center gap-2 flex-shrink-0">
  {/* Action buttons - hover on desktop, always visible on mobile */}
  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
    <Button
      variant="subtle"
      size="icon"
      icon={<Pencil className="w-4 h-4" />}
      aria-label="Edit"
    />
    <Button
      variant="danger"
      size="icon"
      icon={<Trash2 className="w-4 h-4" />}
      aria-label="Delete"
    />
  </div>

  {/* Chevron - always visible, rotates on expand */}
  <ChevronDown
    className={`w-5 h-5 text-gray-400 transition-transform ${
      isExpanded ? "rotate-180" : ""
    }`}
  />
</div>
```

**Custom actions (media items):** Use `customActions` prop on AccordionListCard

```tsx
<AccordionListCard
  customActions={[
    {
      label: "Recommend",
      icon: <Heart className="w-4 h-4" />,
      onClick: handleRecommend,
      variant: "primary",
    },
  ]}
/>
```

### Typography & Color Standards

#### Text Sizes

- **Card headers**: `text-base` or `text-lg` (recipe names)
- **Section headings (h4)**: `font-semibold`
- **Body text**: `text-sm` with `leading-relaxed`
- **Chips/Badges**: `text-xs`
- **Metadata**: `text-xs` or `text-sm`

#### Text Colors

- **Primary text**: `text-gray-900 dark:text-gray-100`
- **Secondary text**: `text-gray-700 dark:text-gray-300`
- **Muted text**: `text-gray-500 dark:text-gray-400`
- **Accent/Interactive**: `text-primary`
- **Errors**: `text-red-500 dark:text-red-400`

#### Background Colors

- **Note/Highlight backgrounds**: `bg-gray-50 dark:bg-gray-800/30`
- **Card hover**: `hover:bg-gray-900/[0.04] dark:hover:bg-gray-900`
- **Dividers**: `border-gray-200 dark:border-gray-700`

### Spacing Standards

- **Section gaps**: `space-y-4` between major sections
- **List item gaps**: `space-y-1.5` (bullets), `space-y-2` (numbered)
- **Inline chips**: `gap-2`
- **Action buttons**: `gap-1` between buttons, `gap-2` to chevron
- **Card padding**: `p-4` (body), `p-3` (highlighted content)
- **Divider padding**: `pt-3` after border-t

## Questions?

If you're unsure about component usage or design patterns, refer to:

- Existing components in `src/components/shared/ui/`
- Design tokens in `src/styles/designTokens.ts`
- Theme utilities in `src/utils/themeUtils.ts`
- Performance guide in `docs/PERFORMANCE.md`
- This guide

When in doubt, **maintain consistency** with existing well-designed components like Button and Modal.

---

## Performance Best Practices

### When to Use Memoization

**Rule:** Only memoize when dependencies change infrequently. Over-memoization can hurt performance.

#### Filter and Sort Functions

**CRITICAL:** Wrap `filterFn` and `sortFn` in `useCallback` when passing to pagination hooks (`usePagination`, `useMediaFiltering`, `useGroupedPagination`).

```typescript
// ✅ Good: Stable references
const filterFn = useCallback(
  (item: WatchlistItem) => {
    if (filter === "to-watch" && item.watched) return false;
    if (mediaTypeFilter !== "all" && item.media_type !== mediaTypeFilter) return false;
    return true;
  },
  [filter, mediaTypeFilter] // Only recreate when filters change
);

const sortFn = useCallback(
  (a: WatchlistItem, b: WatchlistItem) => {
    switch (sortBy) {
      case "title": return a.title.localeCompare(b.title);
      case "date-added": return new Date(b.added_at) - new Date(a.added_at);
      default: return 0;
    }
  },
  [sortBy] // Only recreate when sort changes
);

const { items } = useMediaFiltering({
  items: watchlist,
  filterFn, // Stable reference prevents unnecessary recalculations
  sortFn,   // Stable reference prevents unnecessary recalculations
});
```

**Why:** Pagination hooks use `useMemo` internally. If `filterFn`/`sortFn` change on every render, `useMemo` dependencies change, triggering expensive recalculations.

#### React.memo for Components

**Use `React.memo` only for:**
- Components rendering expensive content (charts, large tables)
- Components receiving same props frequently
- Components re-rendering due to parent, not own state

```typescript
// ✅ Good: Large list item component
const TaskCard = React.memo(({ task, onUpdate }: TaskCardProps) => {
  // Expensive rendering logic
  return <div>...</div>;
}, (prevProps, nextProps) => {
  // Optional custom comparison
  return prevProps.task.id === nextProps.task.id &&
         prevProps.task.updated_at === nextProps.task.updated_at;
});
```

**Don't memo:**
- Simple functional components (<10 JSX elements)
- Components rendering differently most of the time
- Components with unstable props (inline functions)

### Pagination vs Virtualization

**Primary Strategy:** Use pagination for all lists.

**When to Consider Virtualization:**
- Profiling shows >100ms render times with 100+ items
- Scroll performance <60fps
- User reports lag on large datasets

**Don't Use Virtualization:**
- Pagination keeps lists <50 items
- Render times <50ms
- No user complaints

**Pagination Hooks:**

| Hook | Use Case |
|------|----------|
| `usePagination` | Simple lists with basic filtering |
| `useMediaFiltering` | Movies, books, games, music with genre filtering |
| `useGroupedPagination` | Grouped data (tasks by board, events by date) |

**Example:**

```typescript
// Enable URL state for shareable/bookmarkable pagination
const pagination = usePagination({
  items: recipes,
  filterFn,
  sortFn,
  initialItemsPerPage: 10,
  persistenceKey: "tasks-recipe-list",
  useUrlState: true, // Enables ?page=2&perPage=25 in URL
});
```

### Memoization Examples

#### ✅ Good: Memoized Expensive Computation

```typescript
const availableGenres = useMemo(() => {
  const genreSet = new Set<string>();
  watchList.forEach((item) => {
    item.genres?.forEach((genre) => {
      genreSet.add(genre.trim().toLowerCase());
    });
  });
  return genreSet;
}, [watchList]); // Only recompute when watchList changes
```

#### ❌ Bad: Unnecessary Memoization

```typescript
// Don't memoize simple computations
const totalCount = useMemo(() => items.length, [items]); // Wasteful
const totalCount = items.length; // Better
```

#### ✅ Good: Memoized Callback

```typescript
// Prevents recreation on every render
const handlePageChange = useCallback(
  (page: number) => {
    pagination.goToPage(page);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  },
  [pagination] // Only recreate when pagination changes
);
```

### Performance Checklist

Before deploying a new list/table component:

- [ ] Used pagination hook (`usePagination`, `useMediaFiltering`, etc.)
- [ ] Wrapped `filterFn` and `sortFn` in `useCallback`
- [ ] Enabled `useUrlState: true` for shareable pages
- [ ] Tested with 100+ items (use test data generators)
- [ ] Profiled render times (<100ms target)
- [ ] Verified scroll performance (60fps)
- [ ] No unnecessary `React.memo` on simple components
- [ ] No inline function props passed to memoized children

**Reference:** See `docs/PERFORMANCE.md` for comprehensive performance guide.

---

## SEO and Meta Tags

### Page Meta Hook

Use `usePageMeta` hook to set page-specific titles, descriptions, and Open Graph tags for better SEO and shareability.

**Location:** `src/hooks/usePageMeta.ts`

**Import:**
```typescript
import { usePageMeta } from '@/hooks/usePageMeta';
```

**Usage:**
```typescript
const MyPage: React.FC = () => {
  usePageMeta({
    title: 'Page Title',
    description: 'Page description for search engines and social sharing',
    noIndex: true, // For authenticated pages (prevents search indexing)
    ogImage: '/custom-og-image.png', // Optional: custom Open Graph image
    canonical: 'https://npcfinder.com/page', // Optional: canonical URL
  });
  
  return <div>...</div>;
};
```

### Guidelines

**Page Titles:**
- Keep titles <60 characters (search engine display limit)
- Be descriptive and unique per page
- Don't include "NPC Finder" (automatically appended by hook)
- Example: "Movies & TV" → displays as "Movies & TV | NPC Finder"

**Descriptions:**
- Keep descriptions <160 characters (search engine display limit)
- Write for humans first, search engines second
- Avoid keyword stuffing
- Include primary value proposition
- Example: "Track what you're watching and discover new content from friends"

**Authenticated Pages:**
- Always set `noIndex: true` for authenticated pages (dashboard, settings, user content)
- Prevents search engines from indexing user-specific data
- Example: All `/app/*` routes should use `noIndex: true`

**Public Pages:**
- Omit `noIndex` or set to `false` for public pages (landing, docs, etc.)
- Add custom `ogImage` for better social media previews
- Example: Landing page uses custom hero image for social sharing

**Examples:**

```typescript
// ✅ CORRECT - Landing Page (Public)
usePageMeta({
  title: 'Your Personal Dashboard',
  description: 'Track, organize, and curate your entertainment, fitness, and life in one place.',
  ogImage: '/og-image.png', // Custom image for social sharing
});

// ✅ CORRECT - Dashboard (Authenticated)
usePageMeta({
  title: 'Dashboard',
  description: 'Your personal dashboard for everything that matters',
  noIndex: true, // Prevent search indexing
});

// ❌ WRONG - Title too long
usePageMeta({
  title: 'Movies, TV Shows, and Streaming Content Tracker - NPC Finder',
  // Too long, "NPC Finder" is redundant (automatically appended)
});

// ❌ WRONG - Description too long
usePageMeta({
  title: 'Movies',
  description: 'Track all your favorite movies and TV shows, discover new content from friends, get personalized recommendations based on your viewing history, and organize your watchlist with custom tags and ratings.',
  // Too long (>160 chars), gets truncated in search results
});

// ❌ WRONG - Missing noIndex on authenticated page
usePageMeta({
  title: 'User Settings',
  description: 'Manage your account settings',
  // Missing noIndex: true - user settings should not be indexed
});
```

**Impact:**
- Better search engine indexing (proper titles/descriptions)
- Improved social media previews (Open Graph tags)
- Descriptive browser tabs (per-page titles)
- Prevented indexing of user-specific content (`noIndex`)

**Reference:** See `docs/LIGHTHOUSE-AUDIT.md` for comprehensive SEO audit and optimization details.

