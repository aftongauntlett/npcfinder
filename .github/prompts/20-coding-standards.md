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
