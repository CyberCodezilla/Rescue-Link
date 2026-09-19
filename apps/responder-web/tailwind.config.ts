import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["'JetBrains Mono'", "IBM Plex Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        canvas: "#0B0F19",
        surface: "#131A2B",
        "surface-2": "#1A2338",
        "surface-3": "#1E293B",
        line: "#2A364F",
        "line-2": "#334155",
        ink: {
          900: "#F8FAFC",
          700: "#CBD5E1",
          500: "#8A93A3",
          300: "#475569",
        },
        action: {
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
          soft: "rgba(59, 130, 246, 0.15)",
        },
        danger: {
          DEFAULT: "#EF4444",
          hover: "#DC2626",
          soft: "rgba(239, 68, 68, 0.18)",
        },
        success: {
          DEFAULT: "#22C55E",
          hover: "#16A34A",
          soft: "rgba(34, 197, 94, 0.15)",
        },
        priority: {
          critical: "#EF4444",
          criticalBg: "rgba(239, 68, 68, 0.2)",
          high: "#F97316",
          highBg: "rgba(249, 115, 22, 0.2)",
          medium: "#EAB308",
          mediumBg: "rgba(234, 179, 8, 0.2)",
          low: "#22C55E",
          lowBg: "rgba(34, 197, 94, 0.2)",
          pending: "#94A3B8",
          pendingBg: "rgba(148, 163, 184, 0.15)",
        },
        status: {
          new: "#3B82F6",
          newBg: "rgba(59, 130, 246, 0.2)",
          acknowledged: "#8B5CF6",
          acknowledgedBg: "rgba(139, 92, 246, 0.2)",
          inProgress: "#F97316",
          inProgressBg: "rgba(249, 115, 22, 0.2)",
          resolved: "#22C55E",
          resolvedBg: "rgba(34, 197, 94, 0.2)",
          closed: "#64748B",
          closedBg: "rgba(100, 116, 139, 0.2)",
        },
      },
      boxShadow: {
        panel: "0 2px 8px 0 rgba(0, 0, 0, 0.35)",
        glow: "0 0 15px rgba(59, 130, 246, 0.25)",
        "glow-danger": "0 0 20px rgba(239, 68, 68, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
