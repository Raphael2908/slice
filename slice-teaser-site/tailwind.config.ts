import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      'inria-serif': ['"Inria Serif"'],
      'inter': ['"Inter"'],
    },
    extend: {
      colors: {
        "slice-white": "#F7F2EE",
        "slice-pink": "#FFADAD"
      },
    },
  },
  plugins: [],
};
export default config;
