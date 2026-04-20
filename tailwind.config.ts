import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0A2533",
          50: "#E8F4F9",
          100: "#C5E2F0",
          200: "#8BBEDD",
          300: "#4F9AC8",
          400: "#2B7DB2",
          500: "#0A2533",
          600: "#08202C",
          700: "#061A24",
          800: "#04131B",
          900: "#020C11",
        },
        accent: {
          DEFAULT: "#1E9FD4",
          50: "#E8F6FC",
          100: "#C6E9F7",
          200: "#8DD3EF",
          300: "#53BCE6",
          400: "#1EA8DC",
          500: "#1E9FD4",
          600: "#1888B5",
          700: "#136F94",
          800: "#0E5672",
          900: "#083D51",
        },
        secondary: {
          DEFAULT: "#00D4A0",
          50: "#E5FBF5",
          100: "#B8F5E3",
          200: "#7AEDC8",
          300: "#3AE4AD",
          400: "#00DA9C",
          500: "#00D4A0",
          600: "#00B388",
          700: "#008F6D",
          800: "#006B52",
          900: "#004836",
        },
        dark: "#0A2533",
        light: "#F8FAFC",
        paper: "#FAFAF7",
      },
      fontFamily: {
        syne: ["var(--font-syne)", "sans-serif"],
        grotesk: ["var(--font-space-grotesk)", "sans-serif"],
        cormorant: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "slide-in-right": "slideInRight 0.6s ease-out forwards",
        "float": "float 3s ease-in-out infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "gradient": "gradient 8s ease infinite",
        "count-up": "countUp 2s ease-out forwards",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-15px)" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-hero":
          "linear-gradient(135deg, #0A2533 0%, #0D3347 50%, #0A2533 100%)",
        "gradient-card":
          "linear-gradient(135deg, rgba(30,159,212,0.1) 0%, rgba(0,212,160,0.05) 100%)",
        "mesh-gradient":
          "radial-gradient(at 40% 20%, rgba(30,159,212,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(0,212,160,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(10,37,51,0.8) 0px, transparent 50%)",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glow: "0 0 30px rgba(30,159,212,0.3)",
        "glow-green": "0 0 30px rgba(0,212,160,0.3)",
        card: "0 4px 24px rgba(10,37,51,0.12)",
        "card-hover": "0 8px 40px rgba(30,159,212,0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
