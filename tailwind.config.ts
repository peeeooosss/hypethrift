import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#121212",
        cream: "#F4F0EA",
        paper: "#FFFFFF",
        acid: "#D4FF33",
        "acid-light": "#E8FF7A",
        bubblegum: "#FF66B2",
        aqua: "#33CCFF",
        amber: "#FFB347",
        lilac: "#C084FC",
        teal: "#2DD4BF",
        gold: "#FDE047",
        coral: "#FB7185",
        danger: "#EF4444",
        "mall-floor": "#E9E4DB",
        "mall-wall": "#1A1A1A",
        "mall-night": "#0B0B0F",
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "-apple-system", "sans-serif"],
        display: ["Archivo Black", "Arial Black", "system-ui", "sans-serif"],
        mono: ["Space Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        "brut-xs": "2px 2px 0px 0px #121212",
        "brut-sm": "3px 3px 0px 0px #121212",
        "brut-md": "4px 4px 0px 0px #121212",
        "brut-lg": "6px 6px 0px 0px #121212",
        "brut-xl": "8px 8px 0px 0px #121212",
        "brut-2xl": "12px 12px 0px 0px #121212",
        "brut-acid": "4px 4px 0px 0px #D4FF33",
        "brut-acid-sm": "2px 2px 0px 0px #D4FF33",
        "brut-bubblegum": "3px 3px 0px 0px #FF66B2",
        "brut-white": "4px 4px 0px 0px #FFFFFF",
        "brut-lilac": "4px 4px 0px 0px #C084FC",
      },
      dropShadow: {
        brutal: "4px 4px 0px #121212",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shine: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "pulse-live": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.3)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "portal-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212,255,51,0.55)" },
          "50%": { boxShadow: "0 0 0 18px rgba(212,255,51,0)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        marquee: "marquee 20s linear infinite",
        shine: "shine 3s linear infinite",
        "pulse-live": "pulse-live 1.5s ease-in-out infinite",
        float: "float 5s ease-in-out infinite",
        "portal-pulse": "portal-pulse 2.2s ease-out infinite",
        scan: "scan 4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
