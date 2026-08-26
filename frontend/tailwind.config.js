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
          bg: "#E2E8F0",
          card: "#FFFFFF",
          cardMuted: "#F8FAFC",
          inset: "#F1F5F9",
          border: "#CBD5E1",
          borderLight: "#E2E8F0",
          text: "#0F172A",
          muted: "#475569",
          teal: "#0D9488",
          tealLight: "#E6F4F1",
          blue: "#2563EB",
          blueLight: "#EFF6FF",
          green: "#059669",
          greenLight: "#ECFDF5",
          yellow: "#D97706",
          yellowLight: "#FFFBEB",
          red: "#DC2626",
          redLight: "#FEF2F2",
          grey: "#64748B",
        }
      }
    },
  },
  plugins: [],
}

