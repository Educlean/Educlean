/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#39B52D",
        secondary: "#C5F3BF",
        accent: "#092B08",
        lightGray: "#F6F6F6",
        borderCard: "#EAECF0",
      },
      spacing: {
        base: "1rem",
      },
      padding: {},
    },
  },
  plugins: [],
};

export default config;
