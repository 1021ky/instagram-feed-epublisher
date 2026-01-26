/**
 * @file EPUB HTML template renderer aligned with book_layout.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { InstagramMedia } from "@/lib/instagram/types";

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
 * Renders a chapter HTML using the book_layout template.
 */
export function renderChapterHtml(
  template: { layoutHtml: string; cssContent: string },
  item: InstagramMedia,
  imagePath: string
): string {
  const captionHtml = (item.caption ?? "").replace(/\n/g, "<br />");
  const chapterTitle = item.caption?.slice(0, 32) || "Instagram Post";
  return template.layoutHtml
    .replaceAll("{css_content}", template.cssContent)
    .replaceAll("{chapter_title}", chapterTitle)
    .replaceAll("{image_filename}", imagePath)
    .replaceAll("{caption_html}", captionHtml)
    .replaceAll("{post_url}", item.permalink);
}
