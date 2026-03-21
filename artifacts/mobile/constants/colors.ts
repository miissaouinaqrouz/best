const accent = "#FF6B2B"; // Vibrant orange - competitive energy
const accentDark = "#FF8C55";
const success = "#00C896";
const warning = "#FFB400";
const danger = "#FF3B5C";

const Colors = {
  light: {
    text: "#0D0D0D",
    textSecondary: "#6B7280",
    textTertiary: "#9CA3AF",
    background: "#F8F8F8",
    surface: "#FFFFFF",
    surfaceSecondary: "#F0F0F0",
    border: "#E5E7EB",
    tint: accent,
    accent,
    accentSoft: "rgba(255, 107, 43, 0.12)",
    success,
    successSoft: "rgba(0, 200, 150, 0.12)",
    warning,
    warningSoft: "rgba(255, 180, 0, 0.12)",
    danger,
    dangerSoft: "rgba(255, 59, 92, 0.12)",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: accent,
    shadow: "rgba(0, 0, 0, 0.08)",
    overlay: "rgba(0, 0, 0, 0.4)",
    cardBg: "#FFFFFF",
    headerBg: "#FFFFFF",
    inputBg: "#F0F0F0",
    badge: "#FF3B5C",
  },
  dark: {
    text: "#F9FAFB",
    textSecondary: "#9CA3AF",
    textTertiary: "#6B7280",
    background: "#0A0A0A",
    surface: "#141414",
    surfaceSecondary: "#1F1F1F",
    border: "#2A2A2A",
    tint: accentDark,
    accent: accentDark,
    accentSoft: "rgba(255, 140, 85, 0.15)",
    success,
    successSoft: "rgba(0, 200, 150, 0.15)",
    warning,
    warningSoft: "rgba(255, 180, 0, 0.15)",
    danger,
    dangerSoft: "rgba(255, 59, 92, 0.15)",
    tabIconDefault: "#4B5563",
    tabIconSelected: accentDark,
    shadow: "rgba(0, 0, 0, 0.3)",
    overlay: "rgba(0, 0, 0, 0.6)",
    cardBg: "#141414",
    headerBg: "#0A0A0A",
    inputBg: "#1F1F1F",
    badge: "#FF3B5C",
  },
};

export type ColorScheme = typeof Colors.light;
export default Colors;
