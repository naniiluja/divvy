import { Tabs } from 'expo-router'
import { Text, type TextStyle } from 'react-native'
import { colors } from '@/constants/theme'

// Tab bar uses RN style config objects — not JSX className
const TAB_BAR_STYLE = {
  backgroundColor: colors.light.bg,
  borderTopWidth: 0,
  elevation: 0,
  shadowOpacity: 0,
} as const

const TAB_LABEL_STYLE = {
  fontFamily: 'PlusJakartaSans_500Medium',
  fontSize: 12,
} as const

function tabIconStyle(color: string): TextStyle {
  return { fontSize: 20, color }
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarActiveTintColor: colors.light.accent,
        tabBarInactiveTintColor: colors.light.textMid,
        tabBarLabelStyle: TAB_LABEL_STYLE,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hôm nay',
          tabBarIcon: ({ color }) => (
            <Text style={tabIconStyle(color)}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="spaces"
        options={{
          title: 'Spaces',
          tabBarIcon: ({ color }) => (
            <Text style={tabIconStyle(color)}>⊞</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color }) => (
            <Text style={tabIconStyle(color)}>👤</Text>
          ),
        }}
      />
    </Tabs>
  )
}
