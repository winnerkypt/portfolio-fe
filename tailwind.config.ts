import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "var(--color-cream)",
        "cream-deep": "var(--color-cream-deep)",
        sand: "var(--color-sand)",
        brown: "var(--color-brown)",
        pink: "var(--color-pink)",
        ink: "var(--color-ink)",
        moss: "var(--color-moss)",
        "moss-soft": "var(--color-moss-soft)",
        paper: "var(--color-paper)",
        board: "var(--color-board)",
      },
      fontFamily: {
        sans: ["var(--font)"],
        display: ["var(--font-display)", "Impact", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
