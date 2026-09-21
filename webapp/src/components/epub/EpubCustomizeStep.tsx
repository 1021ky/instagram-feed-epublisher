/**
 * @file EPUB customization step UI.
 */
import * as React from "react";
import { CoverThemeSelector } from "@/components/epub/CoverThemeSelector";
import type { EpubCustomSettings } from "@/types/ui";

type EpubCustomizeStepProps = {
  settings: EpubCustomSettings;
  onChange: (settings: EpubCustomSettings) => void;
  defaultTitle: string;
};

/**
 * Renders the Step 3 customization form for EPUB export.
 */
export function EpubCustomizeStep({ settings, onChange, defaultTitle }: EpubCustomizeStepProps) {
  const update = <Key extends keyof EpubCustomSettings>(
    key: Key,
    value: EpubCustomSettings[Key],
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <section className="card">
      <div className="card__header">
        <span className="tag">Step 3</span>
        <h2>EPUBの装丁を整える</h2>
        <p>タイトル・並び順・表紙テーマを設定して、読みやすい1冊に仕上げます。</p>
      </div>

      <div className="grid">
        <label className="field">
          <span>書籍タイトル</span>
          <input
            type="text"
            placeholder={defaultTitle}
            value={settings.title}
            onChange={(event) => update("title", event.target.value)}
          />
        </label>
        <label className="field">
          <span>サブタイトル</span>
          <input
            type="text"
            placeholder="100日チャレンジの振り返り"
            value={settings.subtitle ?? ""}
            onChange={(event) => update("subtitle", event.target.value)}
          />
        </label>
        <label className="field">
          <span>著者名</span>
          <input
            type="text"
            placeholder="@your_account"
            value={settings.author}
            onChange={(event) => update("author", event.target.value)}
          />
        </label>
        <label className="field">
          <span>連絡先（メールなど）</span>
          <input
            type="text"
            placeholder="you@example.com"
            value={settings.contact ?? ""}
            onChange={(event) => update("contact", event.target.value)}
          />
        </label>
        <label className="field">
          <span>Instagram URL</span>
          <input
            type="url"
            placeholder="https://instagram.com/your_account"
            value={settings.instagramUrl ?? ""}
            onChange={(event) => update("instagramUrl", event.target.value)}
          />
        </label>
      </div>

      <div className="stack">
        <fieldset className="choice-group">
          <legend>掲載順序</legend>
          <label className="choice-card">
            <input
              type="radio"
              name="sortOrder"
              value="asc"
              checked={settings.sortOrder === "asc"}
              onChange={() => update("sortOrder", "asc")}
            />
            <span>
              <strong>古い順（Day 1 → 100 推奨）</strong>
              <small>日々の積み重ねを時系列で読み返しやすい並びです。</small>
            </span>
          </label>
          <label className="choice-card">
            <input
              type="radio"
              name="sortOrder"
              value="desc"
              checked={settings.sortOrder === "desc"}
              onChange={() => update("sortOrder", "desc")}
            />
            <span>
              <strong>新しい順</strong>
              <small>最近の投稿からすぐに読み始めたい場合に向いています。</small>
            </span>
          </label>
        </fieldset>

        <div className="field">
          <span>表紙テーマ</span>
          <CoverThemeSelector
            selectedTheme={settings.coverTheme}
            onChange={(themeId) => update("coverTheme", themeId)}
          />
        </div>
      </div>
    </section>
  );
}
