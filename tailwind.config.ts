import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#121212",
        cream: "#F4F0EA",
        acid: "#D4FF33",
        "acid-light": "#E8FF7A",
        bubblegum: "#FF66B2",
        aqua: "#33CCFF",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "sans-serif"],
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
      },
      animation: {
        marquee: "marquee 20s linear infinite",
        shine: "shine 3s linear infinite",
        "pulse-live": "pulse-live 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
