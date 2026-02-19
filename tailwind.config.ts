import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "Segoe UI", "Roboto", "Helvetica", "Arial"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.12)",
      },
      backgroundImage: {
        glow: "radial-gradient(1200px circle at 20% 20%, rgba(99,102,241,.22), transparent 40%), radial-gradient(900px circle at 80% 10%, rgba(16,185,129,.18), transparent 40%), radial-gradient(1100px circle at 70% 80%, rgba(59,130,246,.16), transparent 40%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
