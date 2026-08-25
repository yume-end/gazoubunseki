import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#08111f",
        panel: "#0e1b2f",
        panel2: "#13253f",
        text: "#eaf1ff",
        muted: "#9fb3d1",
        accent: "#6ee7ff",
        accent2: "#8b5cf6",
        danger: "#ff7a90"
      }
    }
  },
  plugins: []
};

export default config;
