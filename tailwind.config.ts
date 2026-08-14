import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
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
        brand: {
          50: "#eef4ff",
          100: "#dae5ff",
          200: "#bdd1ff",
          300: "#90b1ff",
          400: "#6188ff",
          500: "#3d63ff",
          600: "#2440f5",
          700: "#1b30d8",
          800: "#1a2cae",
          900: "#0c1a6b",
          950: "#070f3d",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)",
        "aurora":
          "radial-gradient(60% 80% at 50% 0%, rgba(61,99,255,0.35) 0%, rgba(7,15,61,0) 60%), radial-gradient(40% 60% at 100% 30%, rgba(120,170,255,0.25) 0%, rgba(7,15,61,0) 70%), radial-gradient(50% 50% at 0% 70%, rgba(255,170,120,0.18) 0%, rgba(7,15,61,0) 70%)",
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
        shimmer: {
          "0%": { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2.2s linear infinite",
        pulseGlow: "pulseGlow 3.6s ease-in-out infinite",
        floaty: "floaty 6s ease-in-out infinite",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(99,130,255,0.25), 0 8px 30px -10px rgba(36,64,245,0.35)",
        "glow-lg":
          "0 0 0 1px rgba(99,130,255,0.3), 0 20px 60px -20px rgba(36,64,245,0.45)",
        soft: "0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px -10px rgba(2,8,32,0.6)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
