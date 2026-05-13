import { View, Text, ScrollView } from 'react-native'
import type { FC } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import type { Profile } from '@/types'

interface MemberAvatarRowProps {
  members: (Profile & { role?: string })[]
}

export const MemberAvatarRow: FC<MemberAvatarRowProps> = ({ members }) => {
  if (members.length === 0) return null

  return (
    <View className="gap-2">
      <Text className="text-text-mid dark:text-text-mid-d text-xs font-body px-4">
        {members.length} thành viên
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 gap-3"
      >
        {members.map((member) => (
          <View key={member.id} className="items-center gap-1">
            <Avatar emoji={member.avatar_emoji} size="sm" />
            <Text className="text-text-light dark:text-text-light-d text-xs font-body max-w-[60px]" numberOfLines={1}>
              {member.display_name}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
