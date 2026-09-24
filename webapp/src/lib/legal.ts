/**
 * @file 法的・ポリシーページに関する共通定数および設定
 */

/**
 * 問い合わせ先フォーム URL。
 * 環境変数 NEXT_PUBLIC_CONTACT_FORM_URL が設定されていればそれを優先し、
 * 未設定時は GitHub Issues をフォールバックとして使用します。
 */
export const CONTACT_FORM_URL =
  process.env.NEXT_PUBLIC_CONTACT_FORM_URL ||
  "https://github.com/1021ky/instagram-feed-epublisher/issues";

/**
 * 法的・ポリシーページの最終更新日
 */
export const LEGAL_UPDATED_AT = "2026年9月23日";
