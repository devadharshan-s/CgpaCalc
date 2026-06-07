/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        body: ["DM Sans", "sans-serif"],
        display: ["Syne", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#040810",
          900: "#080f1e",
          800: "#0d1628",
          700: "#152035",
        },
        amber: {
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
        },
        violet: {
          400: "#a78bfa",
          500: "#8b5cf6",
        },
        rose: {
          400: "#fb7185",
          500: "#f43f5e",
        },
        emerald: {
          400: "#34d399",
        },
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
        glow: "0 0 40px rgba(251,191,36,0.15)",
        "glow-violet": "0 0 40px rgba(139,92,246,0.2)",
      },
    },
  },
  plugins: [],
};
