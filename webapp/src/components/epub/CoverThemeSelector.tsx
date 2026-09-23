/**
 * @file EPUB 表紙テーマセレクター
 */
import * as React from "react";
import { COVER_THEMES } from "@/lib/epub/themes";
import type { CoverThemeId } from "@/types/ui";

type CoverThemeSelectorProps = {
  selectedTheme: CoverThemeId;
  onChange: (themeId: CoverThemeId) => void;
};

/**
 * EPUB 表紙テーマの視覚的な選択 UI を表示する。
 */
export function CoverThemeSelector({ selectedTheme, onChange }: CoverThemeSelectorProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const { key, currentTarget } = event;
    const offset =
      key === "ArrowRight" || key === "ArrowDown"
        ? 1
        : key === "ArrowLeft" || key === "ArrowUp"
          ? -1
          : 0;

    if (offset === 0) {
      return;
    }

    event.preventDefault();
    const nextIndex = (currentIndex + offset + COVER_THEMES.length) % COVER_THEMES.length;
    const nextTheme = COVER_THEMES[nextIndex];
    if (!nextTheme) {
      return;
    }

    onChange(nextTheme.id);

    const nextButton = currentTarget.parentElement?.querySelector<HTMLButtonElement>(
      `[data-theme-id="${nextTheme.id}"]`,
    );
    nextButton?.focus();
  };

  return (
    <div className="theme-selector" role="radiogroup" aria-label="表紙テーマ">
      {COVER_THEMES.map((theme, index) => {
        const isSelected = theme.id === selectedTheme;
        return (
          <button
            key={theme.id}
            type="button"
            data-theme-id={theme.id}
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            className={`theme-card ${isSelected ? "theme-card--selected" : ""}`}
            style={{ background: theme.cardBackground, color: theme.textColor }}
            onClick={() => onChange(theme.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <span className="theme-card__accent" style={{ background: theme.accentColor }} />
            <span className="theme-card__title">{theme.name}</span>
            <span className="theme-card__body" style={{ color: theme.metaColor }}>
              {theme.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
