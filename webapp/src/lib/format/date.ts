/**
 * @file 日時フォーマット用汎用ユーティリティ。
 */

/**
 * ISO 8601 形式の日時文字列を `YYYY/MM/DD HH:mm` 形式に変換します。
 * 解釈できない文字列が渡された場合は入力値をそのまま返します。
 */
export function formatDateTimeJP(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return isoString;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}/${month}/${day} ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}
