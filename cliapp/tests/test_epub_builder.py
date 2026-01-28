from pathlib import Path
from unittest.mock import patch

import pytest

from epubkit.builder import create_epub


@pytest.fixture()
def sample_posts(tmp_path):
    # create two fake images
    img1 = tmp_path / "a.jpg"
    img2 = tmp_path / "b.png"
    img1.write_bytes(b"\x89JPEGFAKE")
    img2.write_bytes(b"\x89PNGFAKE")

    return [
        {
            "caption": "cap1",
            "image_path": str(img1),
            "post_url": "https://insta/p/SC1/",
            "image_url": "https://img/1.jpg",
            "date": "2024-01-01T00:00:00",
            "shortcode": "SC1",
        },
        {
            "caption": "cap2",
            "image_path": str(img2),
            "post_url": "https://insta/p/SC2/",
            "image_url": "https://img/2.png",
            "date": "2024-01-02T00:00:00",
            "shortcode": "SC2",
        },
    ]


@patch("epubkit.builder.Image")
@patch("epubkit.builder.epub")
@pytest.mark.parametrize("title, author, output_name", [ (None, None, "out.epub") ])
def test_create_epub_fails_gracefully_when_layout_missing(
    tmp_path, sample_posts, monkeypatch, title, author, output_name  # 引数を追加
):
    # Arrange: レイアウトファイルが存在しない空のディレクトリへ移動
    empty_dir = tmp_path / "empty_project"
    empty_dir.mkdir()
    monkeypatch.chdir(empty_dir)
    
    output_file = empty_dir / "test.epub"

    # Act: 実行（内部でFileNotFoundErrorが起きるが、create_epubがキャッチしてreturnするはず）
    create_epub(sample_posts, output_epub=str(output_file))

    # Assert: EPUBファイルが生成されていないことを確認
    assert not output_file.exists()