import os
import sys
from io import BytesIO
from typing import List

from ebooklib import epub
from PIL import Image

from app.config import OUTPUT_EPUB_FILE, DEFAULT_AUTHOR


def load_layout_files():
    """
    book_layoutディレクトリからレイアウトファイルを読み込む
    
    Returns:
        tuple: (html_template, css_content)
        
    Raises:
        FileNotFoundError: レイアウトファイルが見つからない場合
        ValueError: レイアウトファイルの内容が不正な場合
    """
    layout_dir = "book_layout"
    html_path = os.path.join(layout_dir, "layout.html")
    css_path = os.path.join(layout_dir, "layout.css")
    
    # ファイルの存在確認
    if not os.path.exists(html_path):
        print(f"[!] レイアウトファイルが見つかりません: {html_path}", file=sys.stderr)
        raise FileNotFoundError(f"Layout HTML file not found: {html_path}")
    
    if not os.path.exists(css_path):
        print(f"[!] レイアウトファイルが見つかりません: {css_path}", file=sys.stderr)
        raise FileNotFoundError(f"Layout CSS file not found: {css_path}")
    
    try:
        # HTMLファイルを読み込み
        with open(html_path, "r", encoding="utf-8") as f:
            html_template = f.read()
        
        # CSSファイルを読み込み
        with open(css_path, "r", encoding="utf-8") as f:
            css_content = f.read()
        
        # 基本的な構造検証
        if "{chapter_title}" not in html_template:
            print("[!] layoutファイルの構造が不正です: {chapter_title}が見つかりません", file=sys.stderr)
            raise ValueError("Invalid layout structure: {chapter_title} placeholder not found")
        
        return html_template, css_content
        
    except Exception as e:
        if isinstance(e, (FileNotFoundError, ValueError)):
            raise
        print(f"[!] layoutファイルの構造が不正です: {e}", file=sys.stderr)
        raise ValueError(f"Invalid layout file content: {e}")


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
        html_template, css_content = load_layout_files()
    except (FileNotFoundError, ValueError):
        # エラーはload_layout_files内で標準エラーに出力済み
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
                post_url=post['post_url']
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
