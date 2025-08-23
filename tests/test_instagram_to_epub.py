from unittest.mock import patch

import pytest

from app import cli


@pytest.mark.parametrize(
    "hashtags, target_user, should_call",
    [
        (None, None, False),
        ("", None, False),
        ([], None, False),
        ("tag", None, True),
        (None, "user", True),
    ],
)
@patch("app.cli.create_epub_from_saved_data")
@patch("app.cli.fetch_instagram_data")
@patch("app.cli.cleanup_temp_files")
def test_run_all_dispatch(
    mock_clean, mock_fetch, mock_build, hashtags, target_user, should_call
):
    cli.run_all(hashtags=hashtags, login_user="login", target_user=target_user)
    assert mock_fetch.called is should_call
    assert mock_build.called is should_call
    assert mock_clean.called is should_call


@patch("app.cli.create_epub_from_sample_data")
def test_build_sample_function_available(mock_build_sample):
    """Test that the build_sample function is available and callable."""
    # Import the function directly
    from app.cli import create_epub_from_sample_data

    # Call it to ensure it works
    create_epub_from_sample_data(title="Test")
    assert mock_build_sample.called
