/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: 'hsl(0, 85%, 60%)',
          light: 'hsl(0, 85%, 70%)',
          dark: 'hsl(0, 85%, 45%)',
        },
        secondary: {
          DEFAULT: 'hsl(253, 90%, 73%)',
          dark: 'hsl(253, 33%, 43%)',
        },
        surface: {
          background: 'hsl(240, 7%, 4%)',
          lowest: 'hsl(240, 7%, 6%)',
          card: 'hsl(224, 20%, 12%)',
          container: 'hsl(224, 18%, 15%)',
          bright: 'hsl(224, 15%, 22%)',
        },
        border: {
          DEFAULT: 'hsl(224, 20%, 20%)',
        },
        'on-surface': 'hsl(224, 10%, 80%)',
        'muted-fg': 'hsl(224, 8%, 50%)',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px 2px hsla(0,85%,60%,0.15)' },
          '50%': { boxShadow: '0 0 24px 6px hsla(0,85%,60%,0.35)' },
        },
        'shimmer-move': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'border-beam-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundSize: '400% 400%', backgroundPosition: '0% 50%' },
          '50%': { backgroundSize: '400% 400%', backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'slide-in': 'slide-in 0.3s ease-out forwards',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'shimmer': 'shimmer-move 2.5s linear infinite',
        'border-beam': 'border-beam-spin 3s linear infinite',
        'gradient-shift': 'gradient-shift 10s ease infinite',
      },
    },
  },
  plugins: [],
};
