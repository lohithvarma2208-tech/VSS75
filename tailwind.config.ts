import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Deep Posh Forest Green Palette from the reference
        forest: {
          950: "#031d15",
          900: "#062c21",
          850: "#08372a",
          800: "#0a4434",
          750: "#0d4f3d",
          700: "#115c48",
          600: "#18755c",
          500: "#229476",
        },
        lime: {
          accent: "#bef264",
          hover: "#a3e635",
          dark: "#062c21",
        },
        gold: {
          accent: "#eab308",
          warm: "#f59e0b",
        },
        klu: {
          50: "#fff1f2",
          100: "#ffe4e6",
          500: "#e11d48",
          700: "#9f1239",
          800: "#881337",
          900: "#4c0519",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.25)',
        'card-hover': '0 12px 30px -4px rgba(0, 0, 0, 0.35)',
        'lime-glow': '0 0 25px rgba(190, 242, 100, 0.35)',
        'gold-glow': '0 0 20px rgba(234, 179, 8, 0.35)',
      },
    },
  },
  plugins: [],
};
export default config;
