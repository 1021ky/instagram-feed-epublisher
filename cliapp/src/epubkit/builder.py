import os
import sys
from io import BytesIO
from typing import List

from config import (
    DEFAULT_AUTHOR,
    DEFAULT_LAYOUT_CSS_FILE,
    DEFAULT_LAYOUT_DIR,
    DEFAULT_LAYOUT_HTML_FILE,
    OUTPUT_EPUB_FILE,
)
from ebooklib import epub
from PIL import Image


def _load_layout_files(
    layout_dir=DEFAULT_LAYOUT_DIR,
    html_file=DEFAULT_LAYOUT_HTML_FILE,
    css_file=DEFAULT_LAYOUT_CSS_FILE,
):
    """
    book_layoutディレクトリからレイアウトファイルを読み込む

    Args:
        layout_dir: レイアウトファイルが格納されているディレクトリ
        html_file: HTMLテンプレートファイル名
        css_file: CSSファイル名

    Returns:
        tuple: (html_template, css_content)

    Raises:
        FileNotFoundError: レイアウトファイルが見つからない場合
        ValueError: レイアウトファイルの内容が不正な場合
    """
    html_path = os.path.join(layout_dir, html_file)
    css_path = os.path.join(layout_dir, css_file)

    try:
        # HTMLファイルを読み込み
        with open(html_path, "r", encoding="utf-8") as f:
            html_template = f.read()

        # CSSファイルを読み込み
        with open(css_path, "r", encoding="utf-8") as f:
            css_content = f.read()

        # 基本的な構造検証
        if "{chapter_title}" not in html_template:
            print(
                "[!] layoutファイルの構造が不正です: {chapter_title}が見つかりません",
                file=sys.stderr,
            )
            raise ValueError(
                "Invalid layout structure: {chapter_title} placeholder not found"
            )

        return html_template, css_content

    except FileNotFoundError as e:
        print(
            f"[!] レイアウトファイルが見つかりません: {e.filename}",
            file=sys.stderr,
        )
        raise e
    except ValueError as e:
        raise e


def create_epub(
    posts: List[dict],
    *,
    title: str | None = None,
    author: str | None = None,
    output_epub: str | None = None,
):
    """取得した投稿データからEPUBファイルを生成する関数"""
    resolved_output = output_epub or OUTPUT_EPUB_FILE
    resolved_title = (
        title or os.path.splitext(os.path.basename(resolved_output))[0]
    )
    resolved_author = author or DEFAULT_AUTHOR

    # レイアウトファイルを読み込み
    try:
        html_template, css_content = _load_layout_files()
    except (FileNotFoundError, ValueError):
        # エラーは_load_layout_files内で標準エラーに出力済み
        return

    book = epub.EpubBook()
    book.set_identifier("urn:uuid:instagram-collection-001")
    book.set_title(resolved_title)
    book.set_language("ja")
    book.add_author(resolved_author)

    chapters = []

    if posts:
        first_post_image_path = posts[0]["image_path"]
        with open(first_post_image_path, "rb") as f:
            book.set_cover("cover.jpg", f.read())

    for i, post in enumerate(posts):
        chapter_title = f"Post {i+1}: {post['shortcode']}"
        chapter_filename = f"chapter_{i+1}.xhtml"

        try:
            with open(post["image_path"], "rb") as img_file:
                image_content = img_file.read()
            image = Image.open(BytesIO(image_content))
            fmt = (image.format or "JPEG").lower()
            mime_type = f"image/{fmt}"
            epub_image_item = epub.EpubImage(
                uid=f"img_{i+1}",
                file_name=f"images/{post['shortcode']}.{fmt}",
                media_type=mime_type,
                content=image_content,
            )
            book.add_item(epub_image_item)
        except Exception as _img_err:
            print(
                "[!] 画像が読み込めませんでした。shortcode="
                f"{post.get('shortcode')} : {_img_err}"
            )
            continue

        caption = post.get("caption") or "（説明文なし）"
        caption_html = caption.replace("\n", "<br />")

        chapter = epub.EpubHtml(
            title=chapter_title, file_name=chapter_filename, lang="ja"
        )

        # テンプレートに値を埋め込み
        try:
            chapter.content = html_template.format(
                chapter_title=chapter_title,
                css_content=css_content,
                image_filename=epub_image_item.file_name,
                caption_html=caption_html,
                post_url=post["post_url"],
            )
        except Exception as e:
            print(f"[!] layoutファイルの構造が不正です: {e}", file=sys.stderr)
            continue

        book.add_item(chapter)
        chapters.append(chapter)

    book.toc = chapters
    book.spine = ["nav"] + chapters
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())

    epub.write_epub(resolved_output, book, {})
