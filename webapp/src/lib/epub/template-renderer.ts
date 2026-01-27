/**
 * @file EPUB HTML template renderer aligned with book_layout.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseHTML } from "linkedom";
import { getLogger } from "@/lib/logger";
import type { InstagramMedia } from "@/lib/instagram/types";

const logger = getLogger("epub.template-renderer");

// book_layout is at repo root (one level up from webapp)
const layoutDir = path.resolve(process.cwd(), "..", "book_layout");
const layoutHtmlPath = path.join(layoutDir, "layout.html");
const layoutCssPath = path.join(layoutDir, "layout.css");

/**
 * Loads the HTML/CSS template from book_layout.
 */
export async function loadLayoutTemplate() {
  const [layoutHtml, cssContent] = await Promise.all([
    readFile(layoutHtmlPath, "utf-8"),
    readFile(layoutCssPath, "utf-8"),
  ]);
  return { layoutHtml, cssContent };
}

/**
 * XMLエンティティをエスケープする
 * XHTML/XMLパース時にエラーにならないよう特殊文字を変換
 * @param text - エスケープ対象のテキスト
 * @returns エスケープ後のテキスト
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * 生成したHTMLがXHTMLとして有効かを検証する
 * @param html - 検証対象のHTML文字列
 * @returns XHTMLとして有効ならtrue、無効ならfalse
 */
function validateXhtml(html: string): boolean {
  try {
    const { document } = parseHTML(html);
    // parsererrorが存在する場合は無効なXML
    const parseErrors = document.querySelectorAll("parsererror");
    if (parseErrors.length > 0) {
      logger.error("生成されたHTMLがXHTMLとして無効です", {
        errorCount: parseErrors.length,
        firstError: parseErrors[0]?.textContent?.slice(0, 200),
      });
      return false;
    }
    return true;
  } catch (error) {
    logger.error("XHTML検証中にエラーが発生しました", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Renders a chapter HTML using the book_layout template.
 */
export function renderChapterHtml(
  template: { layoutHtml: string; cssContent: string },
  item: InstagramMedia,
  imagePath: string
): string {
  // 重要: 改行を<br />に変換する前にXMLエスケープを行う
  // これにより<br />タグ自体がエスケープされることを防ぐ
  const escapedCaption = escapeXml(item.caption ?? "");
  const captionHtml = escapedCaption.replace(/\n/g, "<br />");

  // チャプタータイトルもエスケープ
  const rawTitle = item.caption?.slice(0, 32) || "Instagram Post";
  const chapterTitle = escapeXml(rawTitle);

  // post_urlもエスケープ（URLのクエリパラメータに&が含まれる場合があるため）
  const postUrl = escapeXml(item.permalink);

  // imagePathはローカルファイルパスなのでエスケープ不要
  const html = template.layoutHtml
    .replaceAll("{css_content}", template.cssContent)
    .replaceAll("{chapter_title}", chapterTitle)
    .replaceAll("{image_filename}", imagePath)
    .replaceAll("{caption_html}", captionHtml)
    .replaceAll("{post_url}", postUrl);

  // 生成したHTMLがXHTMLとして有効かを検証（ログ出力のみ、処理は継続）
  const isValid = validateXhtml(html);
  logger.debug("チャプターHTMLを生成しました", {
    itemId: item.id,
    isValidXhtml: isValid,
    captionLength: item.caption?.length ?? 0,
  });

  return html;
}
