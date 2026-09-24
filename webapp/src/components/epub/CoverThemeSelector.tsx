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
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
      role="radiogroup"
      aria-label="表紙テーマ"
    >
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
            className={`relative p-4 rounded-2xl border text-left cursor-pointer transition min-h-[140px] flex flex-col justify-between overflow-hidden shadow-xs focus:outline-none ${
              isSelected
                ? "ring-2 ring-slate-900 ring-offset-2 border-transparent"
                : "border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
            }`}
            style={{ background: theme.cardBackground, color: theme.textColor }}
            onClick={() => onChange(theme.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <div>
              <span
                className="block w-8 h-1.5 rounded-full mb-3"
                style={{ background: theme.accentColor }}
              />
              <span className="block font-bold text-xs sm:text-sm mb-1">{theme.name}</span>
            </div>
            <span
              className="block text-[11px] leading-relaxed opacity-85"
              style={{ color: theme.metaColor }}
            >
              {theme.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
