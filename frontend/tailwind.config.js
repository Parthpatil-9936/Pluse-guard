/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pulse: {
          dark: "#0A0D14",
          card: "#121824",
          border: "#1E293B",
          green: "#10B981",
          yellow: "#F59E0B",
          red: "#EF4444",
          grey: "#64748B",
          cyan: "#00D6FF",
          blue: "#0050FF"
        }
      }
    },
  },
  plugins: [],
}
