import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        solar: {
          navy: "#0B192C",
          deep: "#1E3E62",
          blue: "#275EE0",
          sky: "#008DDA",
          gold: "#F59E0B",
          amber: "#F7941D",
          light: "#F0F6FF",
          card: "#FFFFFF",
          border: "#E2E8F0",
        },
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#0b192c",
        },
        status: {
          ontrack: "#10B981",
          atrisk: "#F59E0B",
          delayed: "#EF4444",
          onhold: "#64748B",
          completed: "#059669",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        cardHover: "0 10px 15px -3px rgba(11, 25, 44, 0.08), 0 4px 6px -4px rgba(11, 25, 44, 0.04)",
        glass: "0 8px 32px 0 rgba(11, 25, 44, 0.08)",
      }
    },
  },
  plugins: [],
};
export default config;
