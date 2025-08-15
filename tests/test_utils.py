import pytest

from utils import parse_hashtags, default_epub_name


@pytest.mark.parametrize(
    "hashtags, expected",
    [
        (None, []),
        ("", []),
        ([], []),
        (["#a"], ["a"]),
        (["%a"], ["a"]),
        (["#a", "#b"], ["a", "b"]),
        ("#a #b", ["a", "b"]),
        ("#a,#b", ["a", "b"]),
        ("  #a   ,   #b  ", ["a", "b"]),
    ],
)
def test_parse_hashtags(hashtags, expected):
    assert parse_hashtags(hashtags) == expected


@pytest.mark.parametrize(
    "hashtags, target_user, fallback, expected",
    [
        (None, None, "fallback.epub", "fallback.epub"),
        ([], None, "fallback.epub", "fallback.epub"),
        ("", None, "fallback.epub", "fallback.epub"),
        ("#tag1 #tag2", None, "fallback.epub", "tag1.epub"),
        (["tagA", "tagB"], None, "fallback.epub", "tagA.epub"),
        (None, "user1", "fallback.epub", "user1.epub"),
    ],
)
def test_default_epub_name(hashtags, target_user, fallback, expected):
    assert default_epub_name(hashtags, target_user, fallback) == expected
