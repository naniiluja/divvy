import { Tabs } from 'expo-router'
import Svg, { Rect, Path, Circle } from 'react-native-svg'
import { useTheme } from '@/hooks/useTheme'
import { useNeumorphic } from '@/hooks/useNeumorphic'
import { LIGHT, DARK } from '@/constants/theme'

function IconToday({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Rect fill="none" stroke={color} strokeWidth={1.8} x={3.5} y={5} width={17} height={15} rx={3} />
      <Path stroke={color} strokeWidth={1.8} strokeLinecap="round" d="M8 3v4M16 3v4M3.5 10h17" />
    </Svg>
  )
}

function IconHistory({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle fill="none" stroke={color} strokeWidth={1.8} cx={12} cy={12} r={8.5} />
      <Path fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" d="M12 7v5l3.5 2" />
    </Svg>
  )
}

function IconMembers({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle fill="none" stroke={color} strokeWidth={1.8} cx={9} cy={9} r={3.2} />
      <Path fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M3 19c.6-3.2 3.2-5 6-5s5.4 1.8 6 5" />
      <Circle fill="none" stroke={color} strokeWidth={1.8} cx={17} cy={7.5} r={2.5} />
      <Path fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" d="M16 14c2.5.3 4.5 1.8 5 5" />
    </Svg>
  )
}

function IconProfile({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle fill="none" stroke={color} strokeWidth={1.8} cx={12} cy={9} r={3.5} />
      <Path fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6" />
    </Svg>
  )
}

export default function TabsLayout() {
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT
  const { shadow } = useNeumorphic()

  const tabBarStyle = {
    position: 'absolute' as const,
    left: 14,
    right: 14,
    bottom: 20,
    borderRadius: 28,
    backgroundColor: c.bg,
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    height: 68,
    paddingBottom: 6,
    paddingTop: 6,
    paddingHorizontal: 6,
    ...shadow('raised', 'md'),
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textMid,
        tabBarLabelStyle: {
          fontFamily: 'PlusJakartaSans_600SemiBold',
          fontSize: 10,
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          borderRadius: 22,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hôm nay',
          tabBarIcon: ({ color }) => <IconToday color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Lịch sử',
          tabBarIcon: ({ color }) => <IconHistory color={color} />,
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'Người',
          tabBarIcon: ({ color }) => <IconMembers color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Bạn',
          tabBarIcon: ({ color }) => <IconProfile color={color} />,
        }}
      />
    </Tabs>
  )
}
