# refactor: members screen spec compliance

## Goal

Refactor `app/(app)/(tabs)/members.tsx` để tuân thủ đầy đủ spec: extract data-fetching
hook, loại bỏ `StyleSheet.create` + inline `style={{}}`, thay bằng NativeWind `className`,
và xóa màu hardcode.

## Requirements

- Tạo `hooks/useMembers.ts` — fetch space info + members + 7-day completions, return standard shape
- Xóa toàn bộ `StyleSheet.create` trong members.tsx
- Xóa toàn bộ inline `style={{}}` (trừ Neumorphic shadow spread objects)
- Thay bằng NativeWind `className` tokens
- Xóa màu hardcode `#54D49B` và `'white'`
- Giữ nguyên UI/UX — không thay đổi layout hay visual

## Acceptance Criteria

- [ ] `hooks/useMembers.ts` tồn tại và return `{ space, members, memberStats, isLoading, error }`
- [ ] `members.tsx` không còn `StyleSheet.create` hay import `StyleSheet`
- [ ] `members.tsx` không còn inline `style={{}}` (trừ shadow spread)
- [ ] Không còn màu hex hardcode (`#54D49B`, `'white'`)
- [ ] TypeScript pass (`tsc --noEmit`)

## Technical Approach

- `useMembers(spaceId)` wrap `getSpaceById` + `getSpaceMembers` + `getRecentCompletions` trong `Promise.all`
- Tính toán `memberStats` (sort, displayName fallback, done7d) trong hook
- Online dot màu: dùng Tailwind token `bg-green-400` thay `#54D49B`; border: `border-neu-bg dark:border-neu-d-bg`
- Shadow spread objects (`shadow('raised')` etc.) vẫn dùng inline style object — đây là ngoại lệ cho phép

## Out of Scope

- Thay đổi design/layout
- Thêm Realtime subscription (MVP simplicity)
- Fix các screen khác (index.tsx cũng có vấn đề tương tự — task riêng)

## Technical Notes

- `getSpaceMembers` trong `lib/api.ts` đã join profiles — trả về `SpaceMember & { profiles? }`
- `useSpace.ts` hiện có nhưng không fetch `getSpaceById` hay completions → cần hook mới
- `Avatar` component tồn tại nhưng dùng Neumorphic style riêng — members.tsx dùng custom avatar với shadow
- Online dot hiện dùng `borderColor: 'white'` hardcode — cần token NativeWind
