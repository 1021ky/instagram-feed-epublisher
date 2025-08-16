import json
from datetime import datetime
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from config import POSTS_DATA_FILE, TEMP_IMAGE_DIR
from instagram_fetch import fetch_instagram_data


@pytest.fixture(autouse=True)
def _clean_tmp(tmp_path, monkeypatch):
    # Redirect temp paths into a temp dir for isolation
    monkeypatch.setenv("PYTHONHASHSEED", "0")
    monkeypatch.chdir(tmp_path)
    yield


class DummyPost:
    def __init__(self, shortcode: str, url: str, caption: str | None, dt):
        self.shortcode = shortcode
        self.url = url
        self.caption = caption
        self.date_utc = dt


def _make_posts(count=3, with_tags=("tag1", "tag2")):
    posts = []
    for i in range(count):
        cap = None if i == 0 else " ".join(f"#{t}" for t in with_tags)
        posts.append(
            DummyPost(
                shortcode=f"SC{i}",
                url=f"https://example.com/image_{i}.jpg",
                caption=cap,
                dt=datetime(2024, 1, 1, 12, 0, 0),
            )
        )
    return posts


@pytest.mark.parametrize(
    "hashtags, target_user, expect_saved",
    [
        (None, None, False),  # neither provided
        ("tag1 tag2", None, True),  # hashtag mode
        (None, "publicuser", True),  # user mode
    ],
)
@patch("instagram.fetch.instaloader")
def test_fetch_instagram_data_controls(
    mock_instaloader, hashtags, target_user, expect_saved
):
    L = MagicMock()
    mock_instaloader.Instaloader.return_value = L
    L.load_session_from_file.return_value = None

    # Mock hashtag path
    H = MagicMock()
    H.from_name.return_value.get_posts.return_value = iter(_make_posts())
    mock_instaloader.Hashtag = H

    # Mock profile path
    P = MagicMock()
    prof = MagicMock()
    prof.get_posts.return_value = iter(_make_posts())
    P.from_username.return_value = prof
    mock_instaloader.Profile = P

    # Keep download_pic from creating real files
    def fake_download_pic(filename, url, mtime):
        # emulate instaloader saving pattern: creates a jpeg next to temp dir
        p = Path(TEMP_IMAGE_DIR)
        p.mkdir(exist_ok=True)
        # saved file name is shortcode.jpg; filename is base path without ext
        stem = Path(filename).name
        # when called with base_path=temp_images/SC0, we create SC0.jpg
        (p / f"{stem}.jpg").write_bytes(b"fake")

    L.download_pic.side_effect = fake_download_pic

    # Execute
    fetch_instagram_data(
        hashtags=hashtags, login_user="login", target_user=target_user
    )

    # Verify JSON presence according to mode
    if expect_saved:
        assert Path(
            POSTS_DATA_FILE
        ).exists(), "posts_data.json should be written"
        data = json.loads(Path(POSTS_DATA_FILE).read_text("utf-8"))
        assert isinstance(data, list) and len(data) > 0
        for item in data:
            assert set(
                [
                    "caption",
                    "image_path",
                    "post_url",
                    "image_url",
                    "date",
                    "shortcode",
                ]
            ) <= set(item)
    else:
        assert not Path(
            POSTS_DATA_FILE
        ).exists(), "should not write JSON without inputs"


@pytest.mark.parametrize(
    "hashtags, provided_captions, expected_count",
    [
        (
            "tag1 tag2",
            [None, "#tag1 #tag2", "#tag1 only"],
            1,
        ),  # filter requires all tags
        ("tag1", ["#tag1", "#TAG1", "nope"], 2),  # case-insensitive
    ],
)
@patch("instagram.fetch.instaloader")
def test_fetch_filters_by_caption(
    mock_instaloader, hashtags, provided_captions, expected_count
):
    L = MagicMock()
    mock_instaloader.Instaloader.return_value = L
    L.load_session_from_file.return_value = None

    # Build posts according to captions
    posts = []
    for i, cap in enumerate(provided_captions):
        posts.append(
            DummyPost(f"S{i}", f"https://x/{i}.jpg", cap, datetime(2024, 1, 1))
        )

    H = MagicMock()
    H.from_name.return_value.get_posts.return_value = iter(posts)
    mock_instaloader.Hashtag = H

    def fake_download_pic(filename, url, mtime):
        p = Path(TEMP_IMAGE_DIR)
        p.mkdir(exist_ok=True)
        stem = Path(filename).name
        (p / f"{stem}.jpg").write_bytes(b"fake")

    L.download_pic.side_effect = fake_download_pic

    fetch_instagram_data(
        hashtags=hashtags, login_user="login", target_user=None
    )

    saved = json.loads(Path(POSTS_DATA_FILE).read_text("utf-8"))
    assert len(saved) == expected_count
