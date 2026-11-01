import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f6f5f0",
        "paper-soft": "#eeeee7",
        surface: "#ffffff",
        ink: "#252b27",
        muted: "#697168",
        line: "#dddfd5",
        forest: "#32634b",
        lime: "#d9ec9b",
        rust: "#bd482c",
        peach: "#f8e7df",
        sky: "#3f617e",
      },
      fontFamily: {
        sans: ["Manrope", "Segoe UI", "Arial", "sans-serif"],
        display: ["Instrument Serif", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 3px 0 rgba(37,43,39,0.025), 0 8px 24px rgba(37,43,39,0.035)",
      },
    },
  },
  plugins: [],
} satisfies Config;
