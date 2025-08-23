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


@patch("epubkit.builder.Image")
@patch("epubkit.builder.epub")
def test_create_epub_uses_date_in_title(mock_epub, mock_image, tmp_path):
    """Test that chapter titles use formatted date instead of shortcode"""
    # Arrange
    img_file = tmp_path / "test.jpg"
    img_file.write_bytes(b"\x89JPEGFAKE")

    posts = [
        {
            "caption": "Test caption 1",
            "image_path": str(img_file),
            "post_url": "https://insta/p/SC1/",
            "image_url": "https://img/1.jpg",
            "date": "2024-01-15T12:30:45",
            "shortcode": "ABC123",
        },
        {
            "caption": "Test caption 2", 
            "image_path": str(img_file),
            "post_url": "https://insta/p/SC2/",
            "image_url": "https://img/2.jpg",
            "date": "2023-12-25T08:15:30",
            "shortcode": "XYZ789",
        },
    ]

    output_file = tmp_path / "test.epub"

    def _write(name, book, opts):
        Path(name).write_bytes(b"EPUB")

    mock_epub.write_epub.side_effect = _write

    # Mock Image.open to return object with format attribute
    mock_img = type("_Img", (), {"format": "JPEG"})()
    mock_image.open.return_value = mock_img

    # Act
    create_epub(posts, output_epub=str(output_file))

    # Assert - check that EpubHtml was called with date-formatted titles
    epub_html_calls = mock_epub.EpubHtml.call_args_list
    assert len(epub_html_calls) == 2
    
    # First post: 2024-01-15 -> 2024/01/15
    first_call_kwargs = epub_html_calls[0][1]  # kwargs from first call
    assert first_call_kwargs["title"] == "Post 1: 2024/01/15"
    
    # Second post: 2023-12-25 -> 2023/12/25  
    second_call_kwargs = epub_html_calls[1][1]  # kwargs from second call
    assert second_call_kwargs["title"] == "Post 2: 2023/12/25"


@patch("epubkit.builder.Image")
@patch("epubkit.builder.epub")
def test_create_epub_fallback_to_shortcode_on_invalid_date(mock_epub, mock_image, tmp_path):
    """Test that chapter titles fallback to shortcode when date is invalid"""
    # Arrange
    img_file = tmp_path / "test.jpg"
    img_file.write_bytes(b"\x89JPEGFAKE")

    posts = [
        {
            "caption": "Test with invalid date",
            "image_path": str(img_file),
            "post_url": "https://insta/p/SC1/",
            "image_url": "https://img/1.jpg",
            "date": "invalid-date-format",
            "shortcode": "FALLBACK123",
        },
        {
            "caption": "Test with missing date",
            "image_path": str(img_file), 
            "post_url": "https://insta/p/SC2/",
            "image_url": "https://img/2.jpg",
            # "date" key is missing
            "shortcode": "MISSING456",
        },
    ]

    output_file = tmp_path / "test.epub"

    def _write(name, book, opts):
        Path(name).write_bytes(b"EPUB")

    mock_epub.write_epub.side_effect = _write

    # Mock Image.open to return object with format attribute
    mock_img = type("_Img", (), {"format": "JPEG"})()
    mock_image.open.return_value = mock_img

    # Act
    create_epub(posts, output_epub=str(output_file))

    # Assert - check that EpubHtml was called with shortcode fallback titles
    epub_html_calls = mock_epub.EpubHtml.call_args_list
    assert len(epub_html_calls) == 2
    
    # First post: invalid date -> fallback to shortcode
    first_call_kwargs = epub_html_calls[0][1]
    assert first_call_kwargs["title"] == "Post 1: FALLBACK123"
    
    # Second post: missing date -> fallback to shortcode
    second_call_kwargs = epub_html_calls[1][1]
    assert second_call_kwargs["title"] == "Post 2: MISSING456"
