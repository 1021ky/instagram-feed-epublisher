import json
import os
from pathlib import Path
from unittest.mock import patch

import pytest

from app.commands import (
    SAMPLE_DATA_DIR,
    SAMPLE_POSTS_DATA_FILE,
    create_epub_from_sample_data,
    create_epub_from_saved_data,
)


@pytest.fixture(autouse=True)
def _chdir(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    yield


@pytest.fixture()
def setup_sample_data(tmp_path):
    """Set up sample data directory with test data."""
    sample_dir = tmp_path / "sample" / "fetch"
    sample_dir.mkdir(parents=True)

    # Create sample posts data
    sample_posts = [
        {
            "caption": "Test caption 1",
            "image_path": str(sample_dir / "test1.jpg"),
            "post_url": "https://example.com/p/TEST1/",
            "image_url": "https://example.com/test1.jpg",
            "date": "2024-01-01T00:00:00",
            "shortcode": "TEST1",
        },
        {
            "caption": "Test caption 2",
            "image_path": str(sample_dir / "test2.jpg"),
            "post_url": "https://example.com/p/TEST2/",
            "image_url": "https://example.com/test2.jpg",
            "date": "2024-01-02T00:00:00",
            "shortcode": "TEST2",
        },
    ]

    # Write sample data file
    with open(sample_dir / "posts_data.json", "w", encoding="utf-8") as f:
        json.dump(sample_posts, f, ensure_ascii=False, indent=2)

    # Create sample images
    (sample_dir / "test1.jpg").write_bytes(b"fake image 1")
    (sample_dir / "test2.jpg").write_bytes(b"fake image 2")

    return sample_dir


@patch("app.commands.create_epub")
def test_create_epub_from_sample_data(mock_create_epub, setup_sample_data):
    """Test that sample data can be used to create EPUB."""
    create_epub_from_sample_data(
        title="Test Title", author="Test Author", output_epub="test.epub"
    )

    # Verify create_epub was called
    assert mock_create_epub.called

    # Get the call arguments
    call_args = mock_create_epub.call_args
    posts_data = call_args[0][0]
    kwargs = call_args[1]

    # Verify correct data was passed
    assert len(posts_data) == 2
    assert posts_data[0]["shortcode"] == "TEST1"
    assert posts_data[1]["shortcode"] == "TEST2"
    assert kwargs["title"] == "Test Title"
    assert kwargs["author"] == "Test Author"
    assert kwargs["output_epub"] == "test.epub"


def test_create_epub_from_sample_data_missing_file():
    """Test behavior when sample data file is missing."""
    # Should handle missing sample data gracefully
    create_epub_from_sample_data()
    # Function should return without error (output checked manually)


@patch("app.commands.create_epub")
def test_create_epub_from_saved_data_with_from_sample_flag(
    mock_create_epub, setup_sample_data
):
    """Test the from_sample parameter in create_epub_from_saved_data."""
    create_epub_from_saved_data(
        title="Sample Test",
        author="Sample Author",
        output_epub="sample_test.epub",
        from_sample=True,
    )

    assert mock_create_epub.called

    call_args = mock_create_epub.call_args
    posts_data = call_args[0][0]

    # Should load sample data
    assert len(posts_data) == 2
    assert posts_data[0]["shortcode"] == "TEST1"


def test_sample_data_constants():
    """Test that sample data constants are properly defined."""
    assert SAMPLE_DATA_DIR == "sample/fetch"
    assert SAMPLE_POSTS_DATA_FILE == os.path.join(
        SAMPLE_DATA_DIR, "posts_data.json"
    )


@patch("app.commands.create_epub")
def test_from_sample_skips_image_redownload(
    mock_create_epub, setup_sample_data
):
    """Test that sample mode skips image re-download logic."""
    # This test verifies the different code path for sample vs normal data
    with patch("app.commands.urllib.request.urlretrieve") as mock_urlretrieve:
        create_epub_from_saved_data(from_sample=True)

        # Should not attempt to re-download images
        assert not mock_urlretrieve.called

        # But should still call create_epub
        assert mock_create_epub.called
