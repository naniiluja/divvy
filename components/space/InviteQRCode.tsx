import { View, Text } from 'react-native'
import type { FC } from 'react'

interface InviteQRCodeProps {
  inviteUrl: string
}

// QR code will be implemented in Phase 2 with a QR library
export const InviteQRCode: FC<InviteQRCodeProps> = ({ inviteUrl }) => {
  return (
    <View className="items-center gap-3 p-6 bg-neu-bg2 dark:bg-neu-d-bg2 rounded-card">
      <View className="w-48 h-48 bg-white items-center justify-center rounded-lg">
        <Text className="text-text-mid dark:text-text-mid-d text-center text-xs font-body px-2">
          QR Code{'\n'}(Phase 2)
        </Text>
      </View>
      <Text className="text-text-mid dark:text-text-mid-d text-xs font-body text-center" numberOfLines={1}>
        {inviteUrl}
      </Text>
    </View>
  )
}
