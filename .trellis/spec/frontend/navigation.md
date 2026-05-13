# Navigation (Expo Router v4)

## Route Groups

```
(auth)/   — unauthenticated, no tab bar
(app)/    — authenticated, has tab bar
(app)/(tabs)/  — bottom tab navigator
```

## Auth Guard Pattern

`app/(app)/_layout.tsx` is the single auth checkpoint:

```tsx
import { Redirect, Stack } from 'expo-router'
import { useSession } from '@/hooks/useSession'

export default function AppLayout() {
  const { session, isLoading } = useSession()

  if (isLoading) return <SplashScreen />
  if (!session) return <Redirect href="/sign-in" />

  return <Stack />
}
```

Do not add auth checks anywhere else — one redirect location only.

## Navigation Patterns

```ts
import { useRouter } from 'expo-router'

// Navigate (push)
router.push('/space/new')

// Replace (no back button)
router.replace('/(app)/(tabs)/')

// Go back
router.back()

// Navigate with params
router.push({ pathname: '/space/[id]', params: { id: spaceId } })
```

## Reading Params

```ts
import { useLocalSearchParams } from 'expo-router'

const { id } = useLocalSearchParams<{ id: string }>()
```

## Tab Bar

Three tabs in MVP:

| Tab | Route | Icon |
|-----|-------|------|
| Home | `(tabs)/index` | house |
| Spaces | `(tabs)/spaces` | grid |
| Profile | `(tabs)/profile` | person |

## Deep Links / Invite Links

Invite links format: `divvy://invite/<spaceId>/<token>`

Handler in `app/(app)/space/invite/[id].tsx`. Validates token against Supabase before joining.

## Forbidden

- Do not use `navigation.navigate()` from React Navigation directly — use `router` from `expo-router`.
- Do not navigate inside a Zustand store action — stores are navigation-agnostic.
