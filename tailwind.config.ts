import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        soilab: {
          navy: "#46549C",
          blue: "#248DAC",
          green: "#228D7B",
          paper: "#EEF4FF"
        }
      },
      boxShadow: {
        soft: "0 24px 64px rgba(25, 38, 74, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
