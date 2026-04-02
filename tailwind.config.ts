import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        /* Wordmark: navy "Team" + orange "Connect"; icon blues + orange */
        "brand-green": "#004A8D",
        "brand-green-hover": "#003A6F",
        "brand-gold": "#F7941D",
        "brand-gold-hover": "#E46C0A",
        "brand-teal": "#1E73BE",
        "brand-teal-hover": "#185F9E",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        tc: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)",
        "tc-md": "0 2px 4px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.08)",
        "tc-nav": "0 4px 24px -8px rgba(0, 74, 141, 0.12)",
      },
      keyframes: {
        "landing-blob": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(28px, -18px) scale(1.04)" },
          "66%": { transform: "translate(-20px, 12px) scale(0.98)" },
        },
        "landing-shimmer": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        "landing-blob": "landing-blob 22s ease-in-out infinite",
        "landing-blob-slow": "landing-blob 32s ease-in-out infinite reverse",
        "landing-shimmer": "landing-shimmer 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
