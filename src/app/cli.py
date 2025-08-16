import fire

from app.commands import create_epub_from_saved_data
from app.config import OUTPUT_EPUB_FILE
from app.housekeeping import cleanup_temp_files
from app.utils import default_epub_name, parse_hashtags
from instagram.fetch import fetch_instagram_data


def run_all(
    hashtags: str | list[str] | None = None,
    login_user: str | None = None,
    target_user: str | None = None,
    title: str | None = None,
    author: str | None = None,
    output_epub: str | None = None,
):
    if not parse_hashtags(hashtags) and not target_user:
        print("[!] all には --hashtags もしくは --target_user が必要です。")
        return
    resolved_epub = output_epub or default_epub_name(
        hashtags, target_user, OUTPUT_EPUB_FILE
    )
    fetch_instagram_data(
        hashtags=hashtags, login_user=login_user, target_user=target_user
    )
    create_epub_from_saved_data(
        title=title, author=author, output_epub=resolved_epub
    )
    cleanup_temp_files()


def main():
    fire.Fire(
        {
            "fetch": fetch_instagram_data,
            "build": create_epub_from_saved_data,
            "clean": cleanup_temp_files,
            "all": run_all,
        }
    )
