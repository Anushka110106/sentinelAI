/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          '0': '#09090b',
          '1': '#111118',
          '2': '#18181f',
          '3': '#1c1c24',
          '4': '#222230',
          '5': '#2a2a38',
        },
        accent: {
          cyan: '#06b6d4',
          blue: '#3b82f6',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      animation: {
        'float': 'float-gentle 4s ease-in-out infinite',
        'glow': 'border-glow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
