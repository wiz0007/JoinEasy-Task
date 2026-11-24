/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F3FC',
          100: '#E2E8F9',
          500: '#3157D5',
          600: '#2645B0',
          700: '#1D358B',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1E293B',
        },
        background: {
          DEFAULT: '#F7F8FC',
          dark: '#0F172A',
        },
        main: {
          text: '#172033',
        },
        muted: {
          text: '#64748B',
        },
        border: {
          DEFAULT: '#E5E9F2',
          dark: '#334155',
        },
        status: {
          submitted: '#10B981',
          pending: '#F59E0B',
          overdue: '#EF4444',
          progress: '#3B82F6',
        }
      },
    },
  },
  plugins: [],
}
