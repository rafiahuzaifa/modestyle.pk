// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#C6A45C', // Warm gold
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#1A1A1A', // Deep black
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#F5F5F5', // Off-white
          foreground: '#1A1A1A',
        },
        gold: {
          50: '#FBF8F0',
          100: '#F7F0E1',
          200: '#EFE1C3',
          300: '#E7D2A5',
          400: '#DFC387',
          500: '#C6A45C', // Main gold
          600: '#B08F4A',
          700: '#9A7A38',
          800: '#846526',
          900: '#6E5014',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-playfair)', 'serif'],
        light: ['var(--font-light)', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C6A45C 0%, #E7D2A5 50%, #C6A45C 100%)',
        'marble': "url('/images/marble-bg.jpg')",
        'gold-pattern': "url('/images/gold-pattern.png')",
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-up': 'scaleUp 0.3s ease-out',
        'shine': 'shine 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'gold-shimmer': 'goldShimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shine: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        goldShimmer: {
          '0%': { opacity: '0.5' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config