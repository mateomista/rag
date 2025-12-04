/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tech: {
          bg: "hsl(var(--tech-bg))",
          panel: "hsl(var(--tech-panel))",
          border: "hsl(var(--tech-border))",
          neonViolet: "hsl(var(--tech-neonViolet))",
          neonPink: "hsl(var(--tech-neonPink))",
        },
      },

      boxShadow: {
        neon: "0 0 5px hsl(var(--tech-neonViolet)), 0 0 20px hsl(var(--tech-neonViolet))",
        "subtle-glow": "0 0 10px rgba(139, 92, 246, 0.3)",
      },

      backgroundImage: {
        "cyber-gradient": "linear-gradient(to right, hsl(var(--tech-neonViolet)), hsl(var(--tech-neonPink)))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
