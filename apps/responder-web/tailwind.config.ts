import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["var(--font-mono)", "IBM Plex Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        /* ── Core Surfaces (Dark Command Center) ──────────────── */
        canvas: "#0B0F19",
        surface: "#111827",
        "surface-2": "#1F2937",
        "surface-3": "#374151",
        line: "rgba(255, 255, 255, 0.06)",
        "line-2": "rgba(255, 255, 255, 0.10)",

        /* ── Ink (Text on dark) ───────────────────────────────── */
        ink: {
          900: "#F9FAFB",
          700: "#D1D5DB",
          500: "#9CA3AF",
          300: "#6B7280",
        },

        /* ── Action (Context-aware accent) ────────────────────── */
        action: {
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
          soft: "rgba(59, 130, 246, 0.12)",
        },

        /* ── Danger ───────────────────────────────────────────── */
        danger: {
          DEFAULT: "#EF4444",
          hover: "#DC2626",
          soft: "rgba(239, 68, 68, 0.12)",
        },

        /* ── Success ──────────────────────────────────────────── */
        success: {
          DEFAULT: "#10B981",
          hover: "#059669",
          soft: "rgba(16, 185, 129, 0.12)",
        },

        /* ── Warning ──────────────────────────────────────────── */
        warning: {
          DEFAULT: "#F59E0B",
          soft: "rgba(245, 158, 11, 0.12)",
        },

        /* ── Priority Palette ─────────────────────────────────── */
        priority: {
          critical: "#EF4444",
          criticalBg: "rgba(239, 68, 68, 0.12)",
          high: "#F97316",
          highBg: "rgba(249, 115, 22, 0.12)",
          medium: "#EAB308",
          mediumBg: "rgba(234, 179, 8, 0.10)",
          low: "#10B981",
          lowBg: "rgba(16, 185, 129, 0.10)",
          pending: "#6B7280",
          pendingBg: "rgba(107, 114, 128, 0.10)",
        },

        /* ── Status Palette ───────────────────────────────────── */
        status: {
          new: "#3B82F6",
          newBg: "rgba(59, 130, 246, 0.12)",
          acknowledged: "#8B5CF6",
          acknowledgedBg: "rgba(139, 92, 246, 0.12)",
          inProgress: "#F97316",
          inProgressBg: "rgba(249, 115, 22, 0.12)",
          resolved: "#10B981",
          resolvedBg: "rgba(16, 185, 129, 0.12)",
          closed: "#6B7280",
          closedBg: "rgba(107, 114, 128, 0.10)",
        },

        /* ── Disaster Context Colors ──────────────────────────── */
        ctx: {
          fire: "#F97316",
          flood: "#06B6D4",
          landslide: "#EAB308",
          other: "#8B5CF6",
        },
      },

      boxShadow: {
        panel: "0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.24)",
        "panel-lg": "0 4px 12px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.3)",
        glow: "0 0 20px var(--ctx-glow)",
      },

      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },

      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in": "slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "live-pulse": "live-pulse 2s ease-in-out infinite",
        "alert-border": "alert-gradient 2s ease-in-out infinite",
        ambient: "ambient-glow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
