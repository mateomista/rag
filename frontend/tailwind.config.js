/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/ui/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      colors: {
        tech: {
          bg: "hsl(var(--tech-bg))",
          panel: "hsl(var(--tech-panel))",
          border: "hsl(var(--tech-border))",
          neonBlue: "hsl(var(--tech-neonBlue))",
          neonPurple: "hsl(var(--tech-neonPurple))",
        }
      },
    },
  },
  plugins: [],
};
