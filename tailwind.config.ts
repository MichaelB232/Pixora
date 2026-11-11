import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#FAF7F2",
          surface: "#FBF9F6",
          card: "#FFFFFF",
          muted: "#F5EFEB",
          warm: "#F4ECE1",
          hero: "#F6EEE3",
        },
        border: {
          warm: "#EAE2D6",
          subtle: "#F0EAE1",
        },
        terracotta: {
          50: "#FAF1EE",
          100: "#F6E4DE",
          200: "#EEC7BC",
          300: "#E3A393",
          400: "#D37B67",
          500: "#B8533C",
          600: "#A2432E",
          700: "#863422",
          DEFAULT: "#B8533C",
        },
        sage: {
          50: "#F4F8F5",
          100: "#E8EFEA",
          200: "#D3E3D7",
          600: "#46654F",
          700: "#36533E",
          800: "#27402F",
          DEFAULT: "#E8EFEA",
        },
        ink: {
          900: "#2D2623",
          800: "#3E3633",
          700: "#5D544F",
          500: "#7A706A",
          400: "#9E948D",
          300: "#C6BEB6",
          DEFAULT: "#2D2623",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Newsreader", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 10px rgba(74, 58, 48, 0.04)",
        card: "0 1px 3px rgba(74, 58, 48, 0.06), 0 4px 16px rgba(74, 58, 48, 0.03)",
        elevated: "0 8px 30px rgba(74, 58, 48, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
