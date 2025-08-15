import os
import time
import json
from datetime import datetime

import instaloader

from app.config import TEMP_IMAGE_DIR, POSTS_DATA_FILE
from app.utils import parse_hashtags


def fetch_instagram_data(
    hashtags=None,
    *,
    login_user: str | None = None,
    target_user: str | None = None,
):
    """Instagramからデータ取得して画像を保存し、メタデータをJSONに書き出す。"""
    normalized_tags = parse_hashtags(hashtags)
    if not normalized_tags and not target_user:
        print(
            "[!] ハッシュタグまたはターゲットのユーザー名を指定してください。"
        )
        return

    if target_user:
        print(f"[*] 対象ユーザー: @{target_user} の投稿を取得します")
    else:
        tags_label = ", ".join(f"#{t}" for t in normalized_tags)
        print(f"[*] 検索ハッシュタグ: {tags_label}")

    L = instaloader.Instaloader()
    try:
        if not login_user:
            login_user = input("Instagramのユーザー名を入力してください: ")
        print(
            f"セッションファイルから '{login_user}' のログイン情報を読み込んでいます..."
        )
        L.load_session_from_file(login_user)
        print("セッションの読み込みに成功しました。")
    except FileNotFoundError:
        print(f"'{login_user}' のセッションファイルが見つかりませんでした。")
        print(
            "先にコマンドラインでログインを済ませてください。例: instaloader --login="
            + str(login_user)
        )
        return
    except Exception as e:
        print(f"セッションの読み込み中にエラーが発生しました: {e}")
        return

    if not os.path.exists(TEMP_IMAGE_DIR):
        os.makedirs(TEMP_IMAGE_DIR)

    if target_user:
        print(f"@{target_user} の投稿を取得しています...")
    else:
        print(f"#{normalized_tags[0]} の投稿を検索しています...")

    posts_data = []
    try:
        # 取得モードを選択
        if target_user:
            profile = instaloader.Profile.from_username(L.context, target_user)
            posts = profile.get_posts()
        else:
            posts = instaloader.Hashtag.from_name(
                L.context, normalized_tags[0]
            ).get_posts()

        for i, post in enumerate(posts):
            caption_lower = post.caption.lower() if post.caption else ""
            condition = (
                True
                if target_user
                else all(
                    f"#{tag.lower()}" in caption_lower
                    for tag in normalized_tags
                )
            )
            if not condition:
                continue

            print(f"  [+] 条件に一致する投稿を発見: {post.shortcode}")
            base_path = os.path.join(TEMP_IMAGE_DIR, post.shortcode)

            try:
                print(
                    "    [-] 画像ダウンロード開始 "
                    f"url={post.url} -> base={base_path}"
                )
                L.download_pic(
                    filename=base_path,
                    url=post.url,
                    mtime=post.date_utc,
                )
                prefix = f"{post.shortcode}."
                files = sorted(os.listdir(TEMP_IMAGE_DIR))
                matches = [nm for nm in files if nm.startswith(prefix)]
                if matches:
                    saved_name = matches[0]
                    image_path = os.path.join(TEMP_IMAGE_DIR, saved_name)
                elif os.path.exists(base_path):
                    image_path = base_path
                else:
                    image_path = os.path.join(
                        TEMP_IMAGE_DIR, f"{post.shortcode}.jpg"
                    )

                posts_data.append(
                    {
                        "caption": post.caption,
                        "image_path": image_path,
                        "post_url": (
                            "https://www.instagram.com/p/" f"{post.shortcode}/"
                        ),
                        "image_url": post.url,
                        "date": post.date_utc.isoformat(),
                        "shortcode": post.shortcode,
                    }
                )
            except Exception as dl_error:
                print(
                    "    [!] 画像のダウンロードに失敗しました: "
                    f"{post.shortcode}, type={type(dl_error).__name__}, "
                    f"error={dl_error!r}"
                )

            time.sleep(1)

            if (i + 1) % 10 == 0:
                print(f"...{i+1}件の投稿をチェックしました...")

    except instaloader.exceptions.InstaloaderException as e:
        print(f"投稿の取得中にエラーが発生しました: {e}")
        return
    except KeyboardInterrupt:
        print("\n処理を中断しました。")

    if not posts_data:
        print(
            "条件に一致する投稿が見つかりませんでした。JSONは書き出しません。"
        )
        return

    try:
        posts_data.sort(key=lambda x: datetime.fromisoformat(x["date"]))
    except Exception:
        pass

    with open(POSTS_DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(posts_data, f, ensure_ascii=False, indent=2)

    print(
        f"\n合計 {len(posts_data)} 件の投稿メタデータを '{POSTS_DATA_FILE}' に保存しました。"
    )
