import { Image, View } from 'react-native'
import type { FC } from 'react'

interface FlameViewProps {
  size?: number
}

export const FlameView: FC<FlameViewProps> = ({ size = 48 }) => {
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={require('@/assets/flame.gif')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  )
}
