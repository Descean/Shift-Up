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
        // Charte SHIFT UP (refonte 2026) : Oxford Blue, Space cadet, YInMn Blue, Jordy Blue, Lavender
        primary: {
          DEFAULT: "#192338", // Oxford Blue
          50: "#F1F3F7",
          100: "#DDE2EB",
          200: "#BBC3D1",
          300: "#8C97AD",
          400: "#4F5C76",
          500: "#192338",
          600: "#151E30",
          700: "#121928",
          800: "#0E1420",
          900: "#0A0E17",
        },
        accent: {
          DEFAULT: "#31487A", // YInMn Blue
          50: "#EEF2F9",
          100: "#D9E1F1",
          200: "#B4C9E8",
          300: "#8FB3E2",
          400: "#5F7DB0",
          500: "#31487A",
          600: "#2A3E69",
          700: "#233458",
          800: "#1E2E4F",
          900: "#192338",
        },
        secondary: {
          DEFAULT: "#1E2E4F", // Space cadet
          50: "#F0F2F7",
          100: "#DCE1EB",
          200: "#B9C2D5",
          300: "#8E9AB8",
          400: "#556689",
          500: "#1E2E4F",
          600: "#1A2844",
          700: "#162139",
          800: "#111A2D",
          900: "#0D1322",
        },
        // Gris froids alignés sur le marine (remplacent les gris Tailwind par défaut)
        gray: {
          50: "#F7F8FA",
          100: "#EEF0F3",
          200: "#E1E4E9",
          300: "#C9CED5",
          400: "#6F7783",
          500: "#5A626D",
          600: "#474E58",
          700: "#353A42",
          800: "#23262B",
          900: "#111315",
        },
        ink: "#111315", // noir
        dark: "#192338",
        light: "#F7F8FA",
        paper: "#FAFAF9",
        // Palette de la refonte (accueil) : Oxford Blue, Space cadet, YInMn Blue, Jordy Blue, Lavender
        su: {
          nuit: "#192338",
          cadet: "#1E2E4F",
          bleu: "#31487A",
          ciel: "#8FB3E2",
          clair: "#B4C9E8",
          lavande: "#D9E1F1",
          brume: "#EEF2F9",
        },
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
          "linear-gradient(135deg, #192338 0%, #1E2E4F 50%, #192338 100%)",
        "gradient-card":
          "linear-gradient(135deg, rgba(49,72,122,0.08) 0%, rgba(30,46,79,0.04) 100%)",
        "mesh-gradient":
          "radial-gradient(at 40% 20%, rgba(143,179,226,0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(255,255,255,0.05) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(25,35,56,0.8) 0px, transparent 50%)",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glow: "0 6px 20px rgba(30,46,79,0.18)",
        "glow-green": "0 6px 20px rgba(30,46,79,0.18)",
        card: "0 1px 3px rgba(10,37,51,0.06), 0 4px 16px rgba(10,37,51,0.06)",
        "card-hover": "0 2px 6px rgba(30,46,79,0.06), 0 12px 30px rgba(30,46,79,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
