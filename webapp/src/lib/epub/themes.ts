/**
 * @file Shared EPUB cover theme definitions.
 */
import type { CoverTheme, CoverThemeId } from "@/types/ui";

export const COVER_THEMES: CoverTheme[] = [
  {
    id: "navy",
    name: "濃紺: チャレンジ",
    description: "挑戦の記録に似合う、芯のあるクラシックネイビー",
    pageBackground: "#0f172a",
    cardBackground: "linear-gradient(160deg, #1e3a8a, #0f172a)",
    textColor: "#f8fafc",
    metaColor: "#cbd5f5",
    accentColor: "#f59e0b",
  },
  {
    id: "slate",
    name: "スレート: モダン",
    description: "都会的で引き締まった、モダンなスレートグレー",
    pageBackground: "#111827",
    cardBackground: "linear-gradient(160deg, #334155, #111827)",
    textColor: "#f8fafc",
    metaColor: "#cbd5e1",
    accentColor: "#38bdf8",
  },
  {
    id: "ivory",
    name: "アイボリー: エディトリアル",
    description: "雑誌のように上品で柔らかな、エディトリアル調",
    pageBackground: "#f5efe2",
    cardBackground: "linear-gradient(160deg, #fffaf0, #efe5d0)",
    textColor: "#3f2d1d",
    metaColor: "#7c5a3c",
    accentColor: "#c2410c",
  },
  {
    id: "white",
    name: "白: ミニマル",
    description: "写真を主役にしたいときの、余白を活かすミニマル構成",
    pageBackground: "#f8fafc",
    cardBackground: "linear-gradient(160deg, #ffffff, #eef2f7)",
    textColor: "#0f172a",
    metaColor: "#475569",
    accentColor: "#0f172a",
  },
  {
    id: "purple",
    name: "紫: ダーク",
    description: "夜景やムードのある投稿に映える、深いダークパープル",
    pageBackground: "#1e1b4b",
    cardBackground: "linear-gradient(160deg, #581c87, #1e1b4b)",
    textColor: "#f5f3ff",
    metaColor: "#ddd6fe",
    accentColor: "#c4b5fd",
  },
];

/**
 * Resolves a cover theme by id with a stable navy fallback.
 */
export function getCoverTheme(themeId: CoverThemeId = "navy") {
  return COVER_THEMES.find((theme) => theme.id === themeId) ?? COVER_THEMES[0]!;
}
