/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        tactical: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#d97706', // amber-600
          light:   '#fbbf24', // amber-400
          dim:     '#78350f', // amber-900
          glow:    'rgba(217,119,6,0.15)',
        },
      },
      boxShadow: {
        'amber-glow': '0 0 0 1px rgba(217,119,6,0.15), 0 0 20px 0 rgba(217,119,6,0.07)',
      },
    },
  },
  plugins: [],
}
