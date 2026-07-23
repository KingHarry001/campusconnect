import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      colors: {
        brand: {
          green: "#22c55e",
          "green-dark": "#16a34a",
          "green-light": "#4ade80",
          navy: "#0f172a",
          "navy-light": "#1e293b",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -4px rgba(15,23,42,0.08)",
        lifted: "0 4px 12px rgba(15,23,42,0.06), 0 20px 48px -8px rgba(15,23,42,0.14)",
        glow: "0 0 0 1px rgba(34,197,94,0.18), 0 0 28px rgba(34,197,94,0.28)",
        "soft-dark": "0 1px 2px rgba(0,0,0,0.35), 0 8px 24px -4px rgba(0,0,0,0.45)",
        "lifted-dark": "0 4px 16px rgba(0,0,0,0.45), 0 24px 56px -8px rgba(0,0,0,0.55)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;