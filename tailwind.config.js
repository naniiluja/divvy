/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Neumorphic light
        neu: {
          bg: '#E4E9F2',
          bg2: '#D9DFEC',
          light: 'rgba(255,255,255,0.95)',
          dark: 'rgba(163,177,198,0.55)',
        },
        // Neumorphic dark
        'neu-d': {
          bg: '#262B3D',
          bg2: '#1E2231',
          light: 'rgba(73,82,110,0.5)',
          dark: 'rgba(8,10,18,0.55)',
        },
        // Text
        text: {
          dark: '#2D3454',
          mid: '#737CA0',
          light: '#A6AEC8',
          'dark-d': '#E8ECF8',
          'mid-d': '#9DA5C2',
          'light-d': '#5C6584',
        },
        // Accent
        accent: '#6C7CFF',
        accent2: '#A78BFA',
        // Brand tokens (for shared components)
        brand: {
          primary: '#6C7CFF',
          secondary: '#A78BFA',
        },
        surface: {
          DEFAULT: '#E4E9F2',
          dark: '#262B3D',
        },
        card: {
          DEFAULT: '#D9DFEC',
          dark: '#1E2231',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      borderRadius: {
        card: '28px',
        input: '20px',
        pill: '999px',
        'small-card': '14px',
        tab: '22px',
      },
      fontFamily: {
        display: ['PlusJakartaSans_700Bold'],
        body: ['PlusJakartaSans_500Medium'],
      },
    },
  },
  plugins: [],
}
