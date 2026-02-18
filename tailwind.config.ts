import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial"],
      },
      boxShadow: {
        soft: "0 20px 50px rgba(0,0,0,0.45)",
      },
      backgroundImage: {
        glow: "radial-gradient(1000px circle at 15% 10%, rgba(255,255,255,.12), transparent 40%), radial-gradient(850px circle at 85% 0%, rgba(255,255,255,.08), transparent 40%), linear-gradient(180deg,#0a0a0a 0%, #050505 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
