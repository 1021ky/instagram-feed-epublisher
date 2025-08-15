import os
from io import BytesIO
from typing import List

from ebooklib import epub
from PIL import Image

from app.config import OUTPUT_EPUB_FILE, DEFAULT_AUTHOR


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
        chapter.content = f"""
        <html>
        <head>
            <title>{chapter_title}</title>
            <style>
                body {{ font-family: sans-serif; line-height: 1.6; }}
                img {{ max-width: 100%; height: auto; display: block;
                      margin: 0 auto; }}
                p.caption {{ margin-top: 1em; white-space: pre-wrap; }}
                p.post-link {{ font-size: 0.8em; text-align: center;
                               margin-top: 2em; }}
            </style>
        </head>
        <body>
            <h1>{chapter_title}</h1>
            <img src="{epub_image_item.file_name}" alt="Instagram Post Image"/>
            <p class="caption">{caption_html}</p>
            <p class="post-link">
                <a href="{post['post_url']}">Instagramで元の投稿を見る</a>
            </p>
        </body>
        </html>
        """
        book.add_item(chapter)
        chapters.append(chapter)

    book.toc = chapters
    book.spine = ["nav"] + chapters
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())

    epub.write_epub(resolved_output, book, {})
