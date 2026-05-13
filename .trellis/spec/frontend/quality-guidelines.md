# Frontend Quality Guidelines

## Forbidden Patterns

| Pattern | Why | Alternative |
|---------|-----|-------------|
| `StyleSheet.create()` | Defeats NativeWind v4 | `className` prop |
| `style={{}}` inline | Defeats NativeWind v4 | `className` prop |
| `import { supabase } from '...'` in `components/ui/` | Breaks separation | Move logic to hook |
| `useEffect` for data fetch | Inconsistent loading states | Custom hook in `hooks/` |
| `key={index}` in list | Breaks reconciliation | Use `task.id` |
| `any` type | Breaks type safety | Proper type or `unknown` |
| Hardcoded color strings | Breaks theming | Tailwind token |
| `console.log` in committed code | Debug noise | Remove before commit |
| Direct Anthropic API call from app | Exposes API key | Supabase Edge Function |

## Required Patterns

- Every screen in `(app)/` must check session via `useSession()` — the `_layout.tsx` redirect handles it, but individual screens may also guard sensitive data.
- Every list must handle empty state with `<EmptyState />`.
- Every async action button must show loading state (`isLoading` prop on `<Button />`).
- Haptic feedback on task tick: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`.

## Performance Rules

- Use `FlashList` (from `@shopify/flash-list`) for task lists, not `FlatList`.
- Do not fetch all history on screen load — paginate task_completions (7 days max in MVP).
- Supabase Realtime: subscribe to `task_completions` table changes, not the full tasks table.

## Accessibility

- Every interactive element has an `accessibilityLabel`.
- Color is never the only indicator of state (e.g., completed task shows checkmark + color).
- Text minimum size: `text-sm` (14px).
