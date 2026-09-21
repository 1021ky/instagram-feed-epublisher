/**
 * @file Cover theme definitions for EPUB rendering.
 */
import type { CoverThemeId } from "@/lib/epub/types";

export type CoverThemeDefinition = {
  backgroundColor: string;
  panelBackground: string;
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
  titleFontFamily: string;
  bodyFontFamily: string;
  titleLetterSpacing: string;
};

export const DEFAULT_COVER_THEME_ID: CoverThemeId = "navy";

export const COVER_THEMES: Record<CoverThemeId, CoverThemeDefinition> = {
  navy: {
    backgroundColor: "#0f172a",
    panelBackground: "linear-gradient(160deg, #1e3a8a, #0f172a)",
    accentColor: "#f59e0b",
    textColor: "#f8fafc",
    mutedTextColor: "#cbd5e1",
    titleFontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    bodyFontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    titleLetterSpacing: "0.02em",
  },
  slate: {
    backgroundColor: "#111827",
    panelBackground: "linear-gradient(160deg, #334155, #111827)",
    accentColor: "#38bdf8",
    textColor: "#e5eef8",
    mutedTextColor: "#cbd5e1",
    titleFontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    bodyFontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    titleLetterSpacing: "0.04em",
  },
  ivory: {
    backgroundColor: "#faf6ef",
    panelBackground: "linear-gradient(160deg, #fffdf8, #efe5d7)",
    accentColor: "#b7791f",
    textColor: "#3f2d1d",
    mutedTextColor: "#6b4f35",
    titleFontFamily: '"Georgia", "Times New Roman", serif',
    bodyFontFamily: '"Georgia", "Times New Roman", serif',
    titleLetterSpacing: "0.01em",
  },
  white: {
    backgroundColor: "#f8fafc",
    panelBackground: "linear-gradient(160deg, #ffffff, #e2e8f0)",
    accentColor: "#2563eb",
    textColor: "#0f172a",
    mutedTextColor: "#475569",
    titleFontFamily: '"Avenir Next", "Helvetica Neue", "Arial", sans-serif',
    bodyFontFamily: '"Avenir Next", "Helvetica Neue", "Arial", sans-serif',
    titleLetterSpacing: "0.05em",
  },
  purple: {
    backgroundColor: "#2e1065",
    panelBackground: "linear-gradient(160deg, #7c3aed, #2e1065)",
    accentColor: "#f9a8d4",
    textColor: "#faf5ff",
    mutedTextColor: "#ddd6fe",
    titleFontFamily: '"Trebuchet MS", "Helvetica", "Arial", sans-serif',
    bodyFontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    titleLetterSpacing: "0.03em",
  },
};

export function resolveCoverTheme(themeId?: CoverThemeId): CoverThemeDefinition {
  return COVER_THEMES[themeId ?? DEFAULT_COVER_THEME_ID];
}
