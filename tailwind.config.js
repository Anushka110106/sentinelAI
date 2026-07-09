/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'earth': {
          'dark': '#0A3323',      // Dark green - primary
          'moss': '#839958',      // Moss green - secondary
          'beige': '#F7F4D5',     // Beige - light background
          'brown': '#D3968C',     // Rosy brown - accents/warnings
          'teal': '#105666',      // Midnight green - borders/accents
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
