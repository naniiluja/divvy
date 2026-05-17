# brainstorm: client-side caching layer

## Goal

Giảm số lần giao tiếp xuống Supabase và loại bỏ tình trạng re-fetch mỗi khi component mount/remount, bằng cách thêm một cache layer phù hợp với stack hiện tại (Expo 54, React Native 0.81, Supabase JS v2, Zustand v5).

## What I already know

- Không có cache layer nào trong codebase hiện tại (lib/, hooks/, stores/ đều clean)
- Mỗi hook fetch riêng lẻ: `useSpace`, `useTasks`, `useHistory`, `useMembers` đều gọi Supabase mỗi lần mount
- `useSpaceStats` có N+1 problem: với 5 spaces = 16 API calls; 10 spaces = 31 calls
- `useTasks` + `useHistory` đều subscribe Realtime nhưng độc lập → 2 channels trên cùng 1 table khi cả 2 tabs mount
- `useSpace` và `useMembers` đều gọi `getSpaceMembers()` riêng → duplicated fetch
- Không có TanStack Query, SWR trong package.json
- Không có React Server Components (mobile app) → `React.cache()` không dùng được
- Zustand v5 hiện tại persist `activeSpaceId` + UI state, spec cấm store server data

## Assumptions (temporary)

- Stale threshold chấp nhận được: 30–60 giây cho tasks/members (có Realtime bù)
- Không cần offline support phức tạp
- Scale: household nhỏ, < 50 tasks, < 10 members, < 7 ngày history

## Research References

- [`research/tanstack-query-supabase.md`](research/tanstack-query-supabase.md) — TanStack Query v5 với RN cần wire focusManager + onlineManager thủ công; `staleTime: Infinity` + Realtime `setQueryData` là pattern chuẩn; bundle 13KB gzip
- [`research/zustand-cache-pattern.md`](research/zustand-cache-pattern.md) — Zustand TTL cache slice khả thi nhưng cần sửa spec; cấm `useStore.getState()` trong component không block dùng ở Realtime callback; `immer` chưa install
- [`research/swr-minimal-cache.md`](research/swr-minimal-cache.md) — SWR 5.2KB gzip, zero peer deps, fully compatible RN/Expo 54/React 19; custom Map cache ~50 lines, zero deps nhưng cần tự handle dedup

## Open Questions

- Anh muốn thêm dependency mới (SWR/TanStack Query) hay giữ zero-dep với custom cache?

## Feasible Approaches

---

### Approach A: SWR (Recommended)

**How it works:**
- Add `swr` package (~5.2KB gzip)
- Mỗi hook đổi từ `useEffect + setState` sang `useSWR(key, fetcher)`
- SWR tự cache theo key, dedup concurrent requests, return stale data ngay lập tức khi mount lại
- Realtime handler gọi `mutate(key)` để trigger revalidation (hoặc `mutate(key, newData)` để update in-place không cần re-fetch)

**Pros:**
- Bundle nhỏ nhất trong các lib (5.2KB)
- Zero peer deps, React 19 compatible
- Built-in dedup: `useTasks` và `useHistory` cùng fetch `tasks:spaceId` → chỉ 1 request
- `stale-while-revalidate`: mount lại → show data cũ ngay, fetch mới ở background
- Global `mutate` từ Realtime → update cache mà không re-fetch

**Cons:**
- Thêm 1 dependency
- Cần migrate từng hook (thay useEffect pattern)
- `revalidateOnFocus` không hoạt động trong RN (phải disable)

---

### Approach B: TanStack Query v5

**How it works:**
- Add `@tanstack/react-query` (~13KB gzip)
- Wrap app với `QueryClientProvider`
- `useQuery({ queryKey: ['tasks', spaceId], queryFn: ..., staleTime: Infinity })`
- Realtime → `queryClient.setQueryData(key, updaterFn)` surgical update

**Pros:**
- Mạnh nhất: devtools, retry, pagination, optimistic update
- `staleTime: Infinity` + Realtime = không bao giờ re-fetch tự động, chỉ update qua Realtime
- Query dedup tốt nhất

**Cons:**
- Bundle 2.5x lớn hơn SWR
- Cần thêm `expo-network` cho onlineManager
- Cần wire `focusManager` thủ công
- Overkill cho scale hiện tại của Divvy

---

### Approach C: Custom in-memory Map cache (zero-dep)

**How it works:**
- Tạo `lib/cache.ts`: singleton `Map<string, { data, fetchedAt }>` + TTL check
- Mỗi API call trong hook: check cache trước, nếu fresh thì return ngay, nếu stale thì fetch + update cache
- Realtime handler: `cache.set(key, { data: updatedData, fetchedAt: now })`

**Pros:**
- Zero dependencies
- Fit hoàn toàn với pattern hiện tại, thay đổi ít nhất
- Có thể implement chỉ cho các hooks bị nặng nhất (useSpaceStats trước)

**Cons:**
- Không có built-in dedup (cần tự viết `inFlight Map`)
- Không có stale-while-revalidate (phải tự implement)
- Nhiều boilerplate hơn
- Không có devtools để debug cache state

---

## Decision (ADR-lite)

**Context**: Cần cache layer để giảm re-fetch mỗi mount và duplicate API calls.

**Decision**: SWR — migrate tất cả hooks cùng lúc (useTasks, useHistory, useMembers, useSpace).

**Consequences**:
- Thêm 1 dep (`swr` ~5.2KB gzip)
- Tất cả data-fetching hooks dùng `useSWR` thay vì `useEffect + setState`
- Realtime handlers dùng `mutate(key)` thay vì `setState`
- Spec `hook-guidelines.md` cần update để ghi nhận SWR pattern
- `revalidateOnFocus: false` global vì React Native không có visibilitychange

## Out of Scope

- Offline support / persistence cache xuống disk (không cần với scale hiện tại)
- Server-side cache / CDN
- Optimistic updates phức tạp (chỉ cần Realtime sync là đủ)
- GraphQL / DataLoader pattern

## Technical Notes

- Files bị ảnh hưởng: `hooks/useTasks.ts`, `hooks/useHistory.ts`, `hooks/useMembers.ts`, `hooks/useSpace.ts`, `hooks/useSpaceStats.ts` (nếu có)
- Realtime hiện tại: `useTasks` subscribe `task_completions`, `useHistory` subscribe cùng table → collapse thành 1 shared channel là quick win
- N+1 trong `useSpaceStats` cần fix riêng (batch query) độc lập với cache approach
- Spec `state-management.md` cần update nếu chọn approach có store cache (A hoặc B không cần sửa spec)
