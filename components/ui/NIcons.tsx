import type { FC } from 'react'
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg'

interface IconProps {
  size?: number
  color: string
  strokeWidth?: number
}

const wrap = (size = 22) => ({ width: size, height: size, viewBox: '0 0 24 24' })

export const IconArrowLeft: FC<IconProps> = ({ size = 22, color, strokeWidth = 1.8 }) => (
  <Svg {...wrap(size)} fill="none">
    <Path d="M15 6l-6 6 6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

export const IconArrowRight: FC<IconProps> = ({ size = 22, color, strokeWidth = 1.8 }) => (
  <Svg {...wrap(size)} fill="none">
    <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

export const IconCheck: FC<IconProps> = ({ size = 22, color, strokeWidth = 2.2 }) => (
  <Svg {...wrap(size)} fill="none">
    <Path d="M5 12.5l4 4 10-10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

export const IconBell: FC<IconProps> = ({ size = 22, color, strokeWidth = 1.8 }) => (
  <Svg {...wrap(size)} fill="none">
    <Path d="M6 17V11a6 6 0 1112 0v6l1.5 2H4.5L6 17z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 20.5a2 2 0 004 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
)

export const IconPlus: FC<IconProps> = ({ size = 22, color, strokeWidth = 2 }) => (
  <Svg {...wrap(size)} fill="none">
    <Line x1={12} y1={5} x2={12} y2={19} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1={5} y1={12} x2={19} y2={12} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
)

export const IconEdit: FC<IconProps> = ({ size = 22, color, strokeWidth = 1.8 }) => (
  <Svg {...wrap(size)} fill="none">
    <Path d="M4 20h4l10-10-4-4L4 16v4z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 6l4 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
)

export const IconRotate: FC<IconProps> = ({ size = 22, color, strokeWidth = 1.8 }) => (
  <Svg {...wrap(size)} fill="none">
    <Path d="M4 12a8 8 0 0114-5.3L20 9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20 4v5h-5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20 12a8 8 0 01-14 5.3L4 15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 20v-5h5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

export const IconShuffle: FC<IconProps> = ({ size = 22, color, strokeWidth = 1.8 }) => (
  <Svg {...wrap(size)} fill="none">
    <Path d="M3 6h4l11 12h3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18 14l3 4-3 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 18h4l3-3.3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 9.3L18 6h3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18 2l3 4-3 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

export const IconSparkle: FC<IconProps> = ({ size = 22, color, strokeWidth = 1.8 }) => (
  <Svg {...wrap(size)} fill="none">
    <Path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" fill="none" />
    <Path d="M19 16l.8 1.6L21.5 18l-1.6.8L19 20l-.8-1.6L16.5 18l1.6-.8L19 16z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" fill="none" />
  </Svg>
)

export const IconQR: FC<IconProps> = ({ size = 22, color, strokeWidth = 1.8 }) => (
  <Svg {...wrap(size)} fill="none">
    <Rect x={4} y={4} width={6} height={6} stroke={color} strokeWidth={strokeWidth} rx={1} />
    <Rect x={14} y={4} width={6} height={6} stroke={color} strokeWidth={strokeWidth} rx={1} />
    <Rect x={4} y={14} width={6} height={6} stroke={color} strokeWidth={strokeWidth} rx={1} />
    <Path d="M14 14h2v2M18 14v2h2M14 18h2v2M18 20h2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
)

export const IconLink: FC<IconProps> = ({ size = 22, color, strokeWidth = 1.8 }) => (
  <Svg {...wrap(size)} fill="none">
    <Path d="M9 15l6-6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M10.5 6.5L13 4a4 4 0 015.7 5.7L16 12.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.5 17.5L11 20a4 4 0 01-5.7-5.7L8 11.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

export const IconUsers: FC<IconProps> = ({ size = 22, color, strokeWidth = 1.8 }) => (
  <Svg {...wrap(size)} fill="none">
    <Circle cx={9} cy={9} r={3.2} stroke={color} strokeWidth={strokeWidth} />
    <Path d="M3 19c.6-3.2 3.2-5 6-5s5.4 1.8 6 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={17} cy={7.5} r={2.5} stroke={color} strokeWidth={strokeWidth} />
    <Path d="M16 14c2.5.3 4.5 1.8 5 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
)

export const IconChevronRight: FC<IconProps> = ({ size = 22, color, strokeWidth = 1.8 }) => (
  <Svg {...wrap(size)} fill="none">
    <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

export const IconClose: FC<IconProps> = ({ size = 22, color, strokeWidth = 2 }) => (
  <Svg {...wrap(size)} fill="none">
    <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
)
