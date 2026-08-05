/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: "#fff7ed",
          400: "#fb923c",
          500: "#F97316",
          600: "#ea580c",
          700: "#c2410c",
        },
        secondary: {
          400: "#818cf8",
          500: "#6366F1",
          600: "#4f46e5",
        },
        accent: {
          400: "#2dd4bf",
          500: "#14B8A6",
          600: "#0d9488",
        },
        surface: {
          bg: "#0B0F19",
          card: "#111827",
          border: "rgba(255,255,255,0.08)",
        },
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(249,115,22,0.35)",
        glass: "0 8px 32px 0 rgba(0,0,0,0.37)",
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}