import json
import os
import urllib.request
from datetime import datetime
from urllib.parse import urlparse

from app.config import POSTS_DATA_FILE, TEMP_IMAGE_DIR
from epubkit.builder import create_epub


def create_epub_from_saved_data(
    *,
    title: str | None = None,
    author: str | None = None,
    output_epub: str | None = None,
):
    """
    保存済みJSON(POSTS_DATA_FILE)を読み込み、EPUBを生成する。
    欠損画像はimage_urlから再取得を試みる。
    """
    if not os.path.exists(POSTS_DATA_FILE):
        print(
            f"[!] '{POSTS_DATA_FILE}' が見つかりません。先にデータ取得を実行してください。"
        )
        return

    with open(POSTS_DATA_FILE, "r", encoding="utf-8") as f:
        posts_data = json.load(f)

    if not posts_data:
        print("[!] 投稿データが空です。EPUB作成をスキップします。")
        return

    try:
        posts_data.sort(
            key=lambda x: datetime.fromisoformat(x.get("date", ""))
        )
    except Exception:
        pass

    if not os.path.exists(TEMP_IMAGE_DIR):
        os.makedirs(TEMP_IMAGE_DIR)

    for p in posts_data:
        img_path = p.get("image_path")
        if img_path and os.path.exists(img_path):
            print(f"  [-] 画像存在確認 OK: {img_path}")
            continue
        img_url = p.get("image_url")
        if not img_url:
            print("  [!] image_url が無いため再取得不可: ", p.get("shortcode"))
            continue
        shortcode = p.get("shortcode", "post")
        try:
            parsed = urlparse(img_url)
            _, ext = os.path.splitext(parsed.path)
        except Exception:
            ext = ""
        if not ext:
            ext = ".jpg"
        save_path = os.path.join(TEMP_IMAGE_DIR, f"{shortcode}{ext}")
        try:
            print(
                f"  [-] 欠損画像を再取得開始 url={img_url} -> save={save_path}"
            )
            urllib.request.urlretrieve(img_url, save_path)
            p["image_path"] = save_path
            print(f"  [+] 欠損画像を再取得: {shortcode}{ext}")
        except Exception as dl_err:
            print(
                f"  [!] 画像の再取得に失敗: {shortcode} : "
                f"type={type(dl_err).__name__}, error={dl_err!r}"
            )

    print("EPUBファイルを生成します...")
    create_epub(
        posts_data,
        title=title,
        author=author,
        output_epub=output_epub,
    )
    final_name = output_epub or "(自動決定名)"
    print(f"🎉 EPUBファイル '{final_name}' が正常に作成されました。")
