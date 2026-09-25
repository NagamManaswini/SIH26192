/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hazard: {
          bg: '#0a0f1d',
          surface: '#111827',
          card: '#1f293d',
          border: '#2e3b52',
          cyan: '#06b6d4',
          blue: '#3b82f6',
          amber: '#f59e0b',
          rose: '#f43f5e',
          emerald: '#10b981',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      }
    },
  },
  plugins: [],
}
