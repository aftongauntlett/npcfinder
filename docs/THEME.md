# Theme System

This project uses a comprehensive CSS variable-based theme system that provides consistent styling across light and dark modes.

## Structure

```
src/styles/
└── theme.css          # Main theme configuration with CSS variables
```

## CSS Variables

### Colors

#### Primary (Sage Green)

- `--color-primary`: Main brand color
- `--color-primary-dark`: Darker variant for better contrast
- `--color-primary-light`: Lighter variant for backgrounds

#### Surfaces

- `--color-background`: Page background
- `--color-surface`: Card/component background
- `--color-surface-elevated`: Elevated elements (modals, dropdowns)

#### Borders

- `--color-border`: Default border color
- `--color-border-hover`: Hover state border color

#### Text

- `--color-text-primary`: Main text color
- `--color-text-secondary`: Secondary text (descriptions, captions)
- `--color-text-tertiary`: Tertiary text (placeholders, disabled)

### Typography

- `--font-sans`: System font stack for body text
- `--font-mono`: Monospace font stack for code

### Spacing

- `--space-xs` through `--space-2xl`: Consistent spacing scale

### Border Radius

- `--radius-sm` through `--radius-xl`: Consistent rounding scale

### Shadows

- `--shadow-sm`, `--shadow-md`, `--shadow-lg`: Elevation shadows

### Transitions

- `--transition-fast`: 150ms
- `--transition-base`: 200ms
- `--transition-slow`: 300ms

## Using in Tailwind

The theme variables are integrated with Tailwind CSS:

```jsx
// Primary colors
<div className="bg-primary text-primary-dark hover:bg-primary-light">

// Surfaces
<div className="bg-surface border-border">

// Text colors
<p className="text-text-primary">
<span className="text-text-secondary">

// Spacing (standard Tailwind spacing also works)
<div className="p-md space-y-lg">

// Shadows
<div className="shadow-md hover:shadow-lg">
```

## Dark Mode

Dark mode automatically applies when the `.dark` class is added to the root element. The ThemeContext handles this automatically based on user preference.

```jsx
// ThemeContext automatically handles dark mode
import { useTheme } from "../hooks/useTheme";

const { theme, resolvedTheme, changeTheme } = useTheme();
```

## Accessibility

- Focus states are styled with primary color outline
- Reduced motion preferences are respected
- All colors meet WCAG contrast requirements
- Selection styling uses primary color

## Adding New Theme Values

1. Add CSS variable to `theme.css`:

```css
:root {
  --color-accent: 255 100 100;
}

.dark {
  --color-accent: 200 80 80;
}
```

2. Add to Tailwind config:

```js
colors: {
  accent: "rgb(var(--color-accent) / <alpha-value>)";
}
```

3. Use in components:

```jsx
<div className="bg-accent text-white">
```

## Migration from Old System

Old hardcoded colors have been replaced:

- `blue-500` → `primary` (for accents)
- `gray-50` → `background`
- `gray-800` → `surface` (dark mode)
- Custom hex colors → CSS variables

This provides:

- ✅ Consistent theming across the app
- ✅ Easy theme switching
- ✅ Better dark mode support
- ✅ Simpler maintenance
- ✅ Future-proof customization
