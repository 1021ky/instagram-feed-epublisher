/** クイック選択チップとして画面上に並べる最大件数。 */
export const MAX_QUICK_SELECT_CHIPS = 10;

/**
 * ハッシュタグ入力文字列の先頭にある半角・全角シャープ記号を取り除く。
 */
export function stripLeadingHash(raw: string): string {
  return raw.replace(/^[#＃]/, "");
}

/**
 * ハッシュタグの同一性比較用に前後空白除去・先頭記号除去・NFC 正規化・小文字化を行う。
 */
export function normalizeHashtagForComparison(raw?: string): string {
  return stripLeadingHash((raw ?? "").trim())
    .trim()
    .normalize("NFC")
    .toLowerCase();
}

/**
 * ハッシュタグのクイック選択チップがクリックされた際の次の入力値（選択または解除）を算出する。
 */
export function resolveNextHashtagOnChipClick(
  currentHashtag: string | undefined,
  clickedTag: string,
): string | undefined {
  const cleanClicked = stripLeadingHash(clickedTag).trim();
  if (!cleanClicked) {
    return undefined;
  }

  const normalizedCurrent = normalizeHashtagForComparison(currentHashtag);
  const normalizedClicked = cleanClicked.normalize("NFC").toLowerCase();

  if (normalizedCurrent && normalizedCurrent === normalizedClicked) {
    return undefined;
  }

  return cleanClicked;
}
