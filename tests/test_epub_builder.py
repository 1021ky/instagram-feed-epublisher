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
@pytest.mark.parametrize(
    "title, author, output_name",
    [
        (None, None, "out.epub"),
        ("T", None, "out.epub"),
        (None, "A", "out.epub"),
        ("T", "A", "out.epub"),
    ],
)
def test_create_epub_builds_epub(
    mock_epub,
    mock_image,
    tmp_path,
    sample_posts,
    title,
    author,
    output_name,
):
    # stub epub.write_epub
    out = tmp_path / output_name

    def _write(name, book, opts):
        Path(name).write_bytes(b"EPUB")

    mock_epub.write_epub.side_effect = _write

    # mock Image.open to return object with format attribute
    mock_img = type("_Img", (), {"format": "JPEG"})()
    mock_image.open.return_value = mock_img

    create_epub(sample_posts, title=title, author=author, output_epub=str(out))

    assert out.exists()
    # Ensure cover/chapters added
    assert mock_epub.EpubBook.called
    assert mock_epub.EpubHtml.called
    assert mock_epub.EpubImage.called
