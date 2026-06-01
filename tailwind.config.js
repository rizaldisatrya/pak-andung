/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Instrument Serif', 'serif'],
        sans:  ['DM Sans', 'sans-serif'],
        mono:  ['DM Mono', 'monospace'],
      },
      colors: {
        cream:  { DEFAULT: '#FDF8F0', dark: '#F5EDD8' },
        teal:   { DEFAULT: '#0F4C5C', mid: '#2D6E7E', light: '#D4E9ED' },
        amber:  { DEFAULT: '#E89B3C', light: '#FDF0DC', dark: '#B5731C' },
        ink:    '#1A2832',
        body:   '#3D4D58',
        muted:  '#7A8D97',
        border: '#E2D9C8',
      },
    },
  },
  plugins: [],
}
