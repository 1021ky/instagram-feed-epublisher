"""Commands for building EPUB from saved Instagram data."""

import json
import os
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

from app.config import POSTS_DATA_FILE, TEMP_IMAGE_DIR
from epubkit.builder import create_epub


def create_epub_from_saved_data(
    title: str | None = None,
    author: str | None = None,
    output_epub: str | None = None,
):
    """
    Create EPUB from previously saved Instagram posts data.

    Reads posts_data.json, downloads any missing images, and builds EPUB.

    Args:
        title: EPUB title (optional)
        author: EPUB author (optional)
        output_epub: Output filename (optional)
    """
    # Check if JSON data exists
    if not os.path.exists(POSTS_DATA_FILE):
        print(
            f"[!] {POSTS_DATA_FILE} が見つかりません。先に fetch を実行してください。"
        )
        return

    # Load posts data
    with open(POSTS_DATA_FILE, "r", encoding="utf-8") as f:
        posts_data = json.load(f)

    if not posts_data:
        print("[!] 投稿データが空です。")
        return

    # Ensure temp image directory exists
    os.makedirs(TEMP_IMAGE_DIR, exist_ok=True)

    # Download missing images
    for post in posts_data:
        image_path = post.get("image_path")
        image_url = post.get("image_url")

        if not image_path or not image_url:
            continue

        # Check if image already exists
        if not os.path.exists(image_path):
            # Download the image
            try:
                # Get file extension from URL
                parsed_url = urlparse(image_url)
                ext = os.path.splitext(parsed_url.path)[1] or ".jpg"

                # Ensure the directory exists
                os.makedirs(os.path.dirname(image_path), exist_ok=True)

                # Download
                urllib.request.urlretrieve(image_url, image_path)
                print(f"Downloaded: {image_path}")
            except Exception as e:
                print(f"[!] Failed to download {image_url}: {e}")

    # Create EPUB
    print(f"EPUBを生成しています...")
    create_epub(
        posts=posts_data,
        title=title,
        author=author,
        output_epub=output_epub,
    )
    print(f"✓ EPUB生成完了: {output_epub}")
