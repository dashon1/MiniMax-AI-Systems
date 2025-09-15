/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Command Center Colors
        command: {
          bg: "hsl(var(--command-bg))",
          accent: "hsl(var(--command-accent))",
          success: "hsl(var(--command-success))",
          warning: "hsl(var(--command-warning))",
          danger: "hsl(var(--command-danger))",
        },
        neural: {
          glow: "hsl(var(--neural-glow))",
        },
        // Super Agent Group Power Colors
        agent: {
          electric: "#00D4FF",
          neon: "#00FF88",
          power: "#FF0040",
          deep: "#0A0A0F",
          space: "#1A1A2E",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Command Center Animations
        "power-surge": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
        },
        "neural-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(0, 212, 255, 0.8)" },
        },
        "hologram-scan": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
        "matrix-rain": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(100vh)", opacity: "0" },
        },
        "energy-flow": {
          "0%": { transform: "translateX(-100%) translateY(-50%)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateX(100%) translateY(-50%)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "power-surge": "power-surge 2s ease-in-out infinite",
        "neural-pulse": "neural-pulse 3s ease-in-out infinite",
        "hologram-scan": "hologram-scan 4s ease-in-out infinite",
        "matrix-rain": "matrix-rain 6s linear infinite",
        "energy-flow": "energy-flow 3s linear infinite",
      },
      backgroundImage: {
        'command-gradient': 'linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 50%, #0A0A0F 100%)',
        'agent-gradient': 'linear-gradient(135deg, #00D4FF 0%, #00FF88 50%, #FF0040 100%)',
        'neural-pattern': 'radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0, 255, 136, 0.15) 0%, transparent 50%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}