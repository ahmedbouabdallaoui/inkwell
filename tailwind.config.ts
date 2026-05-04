import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          bg:      '#0F0F12',
          surface: '#1A1A1F',
          raised:  '#242429',
          border:  '#2E2E35',
          text:    '#E8E8F0',
          muted:   '#8888A0',
          violet:  '#8B6FE8',
          paper:   '#F5EDD9',
          bookink: '#2C2416',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        serif:   ['Lora', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono:    ['Inter Mono', 'monospace'],
      },
      boxShadow: {
        'violet-glow': '0 0 0 2px rgba(139,111,232,0.35)',
        'book':        '0 20px 60px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
} satisfies Config
