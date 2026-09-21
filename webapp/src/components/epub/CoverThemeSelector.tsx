/**
 * @file EPUB cover theme selector.
 */
import * as React from "react";
import type { CoverTheme, CoverThemeId } from "@/types/ui";

export const COVER_THEMES: CoverTheme[] = [
  {
    id: "navy",
    name: "濃紺: チャレンジ",
    description: "挑戦の記録に似合う、芯のあるクラシックネイビー",
    bgClass: "theme-card--navy",
    textClass: "theme-card__title--light",
    accentClass: "theme-card__accent--gold",
    previewBg: "#0f172a",
    previewAccent: "#f59e0b",
  },
  {
    id: "slate",
    name: "スレート: モダン",
    description: "都会的で引き締まった、モダンなスレートグレー",
    bgClass: "theme-card--slate",
    textClass: "theme-card__title--light",
    accentClass: "theme-card__accent--sky",
    previewBg: "#1f2937",
    previewAccent: "#38bdf8",
  },
  {
    id: "ivory",
    name: "アイボリー: エディトリアル",
    description: "雑誌のように上品で柔らかな、エディトリアル調",
    bgClass: "theme-card--ivory",
    textClass: "theme-card__title--dark",
    accentClass: "theme-card__accent--copper",
    previewBg: "#f8f3e8",
    previewAccent: "#c2410c",
  },
  {
    id: "white",
    name: "白: ミニマル",
    description: "写真を主役にしたいときの、余白を活かすミニマル構成",
    bgClass: "theme-card--white",
    textClass: "theme-card__title--dark",
    accentClass: "theme-card__accent--ink",
    previewBg: "#ffffff",
    previewAccent: "#0f172a",
  },
  {
    id: "purple",
    name: "紫: ダーク",
    description: "夜景やムードのある投稿に映える、深いダークパープル",
    bgClass: "theme-card--purple",
    textClass: "theme-card__title--light",
    accentClass: "theme-card__accent--violet",
    previewBg: "#2e1065",
    previewAccent: "#c4b5fd",
  },
];

type CoverThemeSelectorProps = {
  selectedTheme: CoverThemeId;
  onChange: (themeId: CoverThemeId) => void;
};

/**
 * Renders a visual selector for EPUB cover themes.
 */
export function CoverThemeSelector({ selectedTheme, onChange }: CoverThemeSelectorProps) {
  return (
    <div className="theme-selector" role="radiogroup" aria-label="表紙テーマ">
      {COVER_THEMES.map((theme) => {
        const isSelected = theme.id === selectedTheme;
        return (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`theme-card ${theme.bgClass} ${isSelected ? "theme-card--selected" : ""}`}
            onClick={() => onChange(theme.id)}
          >
            <span className={`theme-card__accent ${theme.accentClass}`} />
            <span className={`theme-card__title ${theme.textClass}`}>{theme.name}</span>
            <span className={`theme-card__body ${theme.textClass}`}>{theme.description}</span>
          </button>
        );
      })}
    </div>
  );
}
