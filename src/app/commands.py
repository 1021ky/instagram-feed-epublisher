import json
import os
import urllib.request
from datetime import datetime
from urllib.parse import urlparse

from app.config import POSTS_DATA_FILE, TEMP_IMAGE_DIR
from epubkit.builder import create_epub

# Sample data constants
SAMPLE_DATA_DIR = "sample/fetch"
SAMPLE_POSTS_DATA_FILE = os.path.join(SAMPLE_DATA_DIR, "posts_data.json")


def create_epub_from_saved_data(
    *,
    title: str | None = None,
    author: str | None = None,
    output_epub: str | None = None,
    from_sample: bool = False,
):
    """
    保存済みJSON(POSTS_DATA_FILE)を読み込み、EPUBを生成する。
    欠損画像はimage_urlから再取得を試みる。
    
    Args:
        title: EPUBのタイトル
        author: EPUBの著者
        output_epub: 出力EPUBファイル名
        from_sample: Trueの場合、サンプルデータを使用
    """
    # データソースを決定
    if from_sample:
        data_file = SAMPLE_POSTS_DATA_FILE
        data_source_name = "サンプルデータ"
    else:
        data_file = POSTS_DATA_FILE
        data_source_name = "保存済みデータ"
    
    if not os.path.exists(data_file):
        if from_sample:
            print(f"[!] '{data_file}' が見つかりません。サンプルデータが正しく配置されているか確認してください。")
        else:
            print(f"[!] '{data_file}' が見つかりません。先にデータ取得を実行してください。")
        return

    print(f"[*] {data_source_name}からEPUBを生成します...")
    with open(data_file, "r", encoding="utf-8") as f:
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

    # サンプルデータの場合は画像の再取得をスキップ（すでに存在する前提）
    if from_sample:
        print("  [*] サンプルデータモード: 画像の再取得はスキップします")
        # サンプルデータの画像パスが存在するか確認
        for p in posts_data:
            img_path = p.get("image_path")
            if img_path and os.path.exists(img_path):
                print(f"  [✓] サンプル画像確認 OK: {img_path}")
            else:
                print(f"  [!] サンプル画像が見つかりません: {img_path}")
    else:
        # 通常モード: 欠損画像の再取得処理
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


def create_epub_from_sample_data(
    *,
    title: str | None = None,
    author: str | None = None,
    output_epub: str | None = None,
):
    """
    サンプルデータからEPUBを生成する専用関数。
    """
    return create_epub_from_saved_data(
        title=title,
        author=author,
        output_epub=output_epub,
        from_sample=True,
    )
