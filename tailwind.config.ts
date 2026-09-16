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
          DEFAULT: "#F7F6F2",
          elev: "#FFFFFF",
          mute: "#EDEBE4",
        },
        ink: {
          DEFAULT: "#12151A",
          soft: "#3A4048",
          faint: "#6B727C",
          line: "#D6D3C9",
        },
        accent: {
          DEFAULT: "#0F4C3A",
          hover: "#0B3A2C",
          soft: "#E4EFE9",
        },
        danger: {
          DEFAULT: "#8B2E2E",
          soft: "#F5E8E8",
        },
        warn: {
          DEFAULT: "#7A5A12",
          soft: "#F5EEDC",
        },
      },
      fontFamily: {
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "72rem",
      },
    },
  },
  plugins: [],
};

export default config;
