import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        hive: {
          bg: '#FFFFFF',
          card: '#FFFFFF',
          line: '#E7E7E1',
          yellow: '#FFE600',
          gold: '#8A7000',
          ivory: '#141414',
          muted: '#6E6E66',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
      },
      boxShadow: {
        pick: 'inset 0 0 0 1px #FFE600',
      },
    },
  },
  plugins: [],
}

export default config
