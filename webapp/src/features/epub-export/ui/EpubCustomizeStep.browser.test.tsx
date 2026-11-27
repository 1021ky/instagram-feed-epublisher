import { useRef, useState } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import type { EpubCustomSettings } from "@/types/ui";
import { EpubCustomizeStep } from "./EpubCustomizeStep";

/** 実ブラウザ検証で初期表示に用いる標準の装丁設定データ */
const initialSettings: EpubCustomSettings = {
  title: "初期タイトル",
  subtitle: "",
  author: "@alice",
  coverTheme: "navy",
  sortOrder: "asc",
  contact: "",
  instagramUrl: "",
};

/**
 * 入力編集・フォーカス誘導・推奨タイトル復元を実ブラウザ上で検証するためのラッパー。
 */
function StatefulEpubCustomizeStep() {
  const [settings, setSettings] = useState<EpubCustomSettings>(initialSettings);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div>
      <EpubCustomizeStep
        settings={settings}
        onChange={setSettings}
        defaultTitle="@aliceの投稿記録"
        titleInputRef={titleInputRef}
      />
      <button type="button" onClick={() => titleInputRef.current?.focus()}>
        タイトル欄へフォーカス
      </button>
    </div>
  );
}

describe("EPUB装丁設定ステップの操作 (EpubCustomizeStep)", () => {
  it("タイトルを空にしてフォーカスを外すとエラーが表示され、推奨タイトル入力ボタンで解消されること", async () => {
    const screen = await render(<StatefulEpubCustomizeStep />);
    const titleInput = screen.getByLabelText(/書籍タイトル/);

    await titleInput.fill("");
    await screen.getByLabelText("サブタイトル").click();

    await expect.element(titleInput).toHaveAttribute("aria-invalid", "true");
    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("書籍タイトルを入力してください");

    await screen.getByRole("button", { name: "推奨タイトルを入力" }).click();
    await expect.element(titleInput).toHaveValue("@aliceの投稿記録");
    await expect.element(titleInput).toHaveAttribute("aria-invalid", "false");
  });

  it("titleInputRef を通じて書籍タイトル入力欄へフォーカスを移動できること", async () => {
    const screen = await render(<StatefulEpubCustomizeStep />);
    const titleInput = screen.getByLabelText(/書籍タイトル/);

    await screen.getByRole("button", { name: "タイトル欄へフォーカス" }).click();
    await expect.element(titleInput).toHaveFocus();
  });
});
