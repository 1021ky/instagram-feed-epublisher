"""Utility functions for Instagram to EPUB application."""

import re


def parse_hashtags(hashtags: str | list[str] | None) -> list[str]:
    """
    Parse hashtags from string or list and normalize them.

    Removes # and % prefixes, splits on spaces/commas, and returns clean list.

    Args:
        hashtags: String (space/comma separated) or list of hashtag strings

    Returns:
        List of normalized hashtag strings without prefixes
    """
    if not hashtags:
        return []

    if isinstance(hashtags, str):
        # Split on spaces or commas
        hashtags = re.split(r"[,\s]+", hashtags)

    # Remove # and % prefixes and strip whitespace
    result = []
    for tag in hashtags:
        tag = tag.strip()
        if tag:
            # Remove leading # or %
            tag = tag.lstrip("#%")
            if tag:
                result.append(tag)

    return result


def default_epub_name(
    hashtags: str | list[str] | None, target_user: str | None, fallback: str
) -> str:
    """
    Generate a default EPUB filename based on hashtags or target user.

    Priority:
    1. First hashtag if available
    2. Target user if available
    3. Fallback value

    Args:
        hashtags: String or list of hashtags
        target_user: Instagram username
        fallback: Default filename to use if neither hashtags nor user provided

    Returns:
        Generated filename ending in .epub
    """
    parsed = parse_hashtags(hashtags)
    if parsed:
        return f"{parsed[0]}.epub"

    if target_user:
        return f"{target_user}.epub"

    return fallback
