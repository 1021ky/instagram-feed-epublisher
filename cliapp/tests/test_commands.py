import json
from pathlib import Path
from unittest.mock import patch

import pytest

from commands import create_epub_from_saved_data
from config import POSTS_DATA_FILE, TEMP_IMAGE_DIR


@pytest.fixture(autouse=True)
def _chdir(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    yield


@patch("commands.urlparse")
@patch("commands.urllib.request.urlretrieve")
@patch("commands.create_epub")
@pytest.mark.parametrize(
    "has_json, has_images, expect_epub",
    [
        (False, False, False),  # no JSON -> skip
        (True, True, True),  # images present -> build
        (True, False, True),  # re-download missing -> build
    ],
)
def test_create_epub_from_saved_data(
    mock_create,
    mock_urlretrieve,
    mock_urlparse,
    tmp_path,
    has_json,
    has_images,
    expect_epub,
):
    # prepare JSON
    posts = [
        {
            "caption": "c",
            "image_path": str(tmp_path / "temp_images/SC.jpg"),
            "post_url": "https://insta/p/SC/",
            "image_url": "https://img/SC.jpg",
            "date": "2024-01-01T00:00:00",
            "shortcode": "SC",
        }
    ]

    if has_json:
        Path(POSTS_DATA_FILE).write_text(json.dumps(posts), "utf-8")

    # create image or not
    if has_images:
        Path(TEMP_IMAGE_DIR).mkdir(exist_ok=True)
        Path(posts[0]["image_path"]).write_bytes(b"fake")

    # mock urlparse to give extension
    class P:
        path = "/SC.jpg"

    mock_urlparse.return_value = P()

    create_epub_from_saved_data(title="T", author="A", output_epub="out.epub")

    # verify behavior
    if expect_epub:
        assert mock_create.called
    else:
        assert not mock_create.called
