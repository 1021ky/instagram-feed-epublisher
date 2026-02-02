from unittest.mock import patch

import pytest

from instagram_feed_epublisher import cli


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
@patch("instagram_feed_epublisher.cli.create_epub_from_saved_data")
@patch("instagram_feed_epublisher.cli.fetch_instagram_data")
@patch("instagram_feed_epublisher.cli.cleanup_temp_files")
def test_run_all_dispatch(
    mock_clean, mock_fetch, mock_build, hashtags, target_user, should_call
):
    cli.run_all(hashtags=hashtags, login_user="login", target_user=target_user)
    assert mock_fetch.called is should_call
    assert mock_build.called is should_call
    assert mock_clean.called is should_call
