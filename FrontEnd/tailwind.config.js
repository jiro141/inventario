/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#2B3744",
          500: "#2B3744",
          600: "#2B3744",
          700: "#2B3744",
          800: "#1a1a1a",
          900: "#111111",
        },
      },
    },
  },
  plugins: [],
}
