import os

from app.config import TEMP_IMAGE_DIR


def cleanup_temp_files():
    """一時画像とディレクトリを削除する後処理。"""
    if not os.path.exists(TEMP_IMAGE_DIR):
        print("クリーンアップ対象のディレクトリがありません。")
        return
    print("一時ファイルをクリーンアップしています...")
    for item in os.listdir(TEMP_IMAGE_DIR):
        try:
            os.remove(os.path.join(TEMP_IMAGE_DIR, item))
        except FileNotFoundError:
            pass
    try:
        os.rmdir(TEMP_IMAGE_DIR)
    except OSError:
        pass
