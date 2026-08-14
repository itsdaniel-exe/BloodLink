/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#050810",
          900: "#0a0f1c",
          850: "#0d1425",
          800: "#111a2e",
          700: "#182238",
          600: "#243252",
        },
        blood: {
          400: "#ff5470",
          500: "#e8264c",
          600: "#c81e40",
          700: "#a51735",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(232,38,76,0.15), 0 8px 30px -8px rgba(232,38,76,0.35)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
