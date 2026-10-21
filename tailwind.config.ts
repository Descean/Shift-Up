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
        // Charte SHIFT UP : bleu marine, blanc, noir, gris (+ nuances dérivées uniquement)
        primary: {
          DEFAULT: "#0A2533", // bleu marine
          50: "#EEF2F5",
          100: "#D9E1E7",
          200: "#B3C2CD",
          300: "#8399A9",
          400: "#4F6B7E",
          500: "#0A2533",
          600: "#08202C",
          700: "#061A24",
          800: "#04131B",
          900: "#020C11",
        },
        accent: {
          DEFAULT: "#2D5B78", // bleu marine moyen (acier)
          50: "#EFF4F7",
          100: "#DDE7EE",
          200: "#BACFDC",
          300: "#8FAEC2",
          400: "#5F87A2",
          500: "#2D5B78",
          600: "#244B63",
          700: "#1C3B4E",
          800: "#152C3A",
          900: "#0E1E28",
        },
        secondary: {
          DEFAULT: "#5F6772", // gris anthracite
          50: "#F5F6F7",
          100: "#E8EAED",
          200: "#D1D5DA",
          300: "#AEB4BC",
          400: "#858D97",
          500: "#5F6772",
          600: "#4B525B",
          700: "#3A3F46",
          800: "#26292E",
          900: "#111315",
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
        dark: "#0A2533",
        light: "#F7F8FA",
        paper: "#FAFAF9",
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
          "linear-gradient(135deg, #0A2533 0%, #12354A 50%, #0A2533 100%)",
        "gradient-card":
          "linear-gradient(135deg, rgba(45,91,120,0.08) 0%, rgba(95,103,114,0.04) 100%)",
        "mesh-gradient":
          "radial-gradient(at 40% 20%, rgba(143,174,194,0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(255,255,255,0.05) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(10,37,51,0.8) 0px, transparent 50%)",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glow: "0 6px 20px rgba(10,37,51,0.18)",
        "glow-green": "0 6px 20px rgba(10,37,51,0.18)",
        card: "0 1px 3px rgba(10,37,51,0.06), 0 4px 16px rgba(10,37,51,0.06)",
        "card-hover": "0 2px 6px rgba(10,37,51,0.08), 0 12px 32px rgba(10,37,51,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
