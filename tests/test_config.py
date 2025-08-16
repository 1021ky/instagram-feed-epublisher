from config import (
    DEFAULT_AUTHOR,
    OUTPUT_EPUB_FILE,
    POSTS_DATA_FILE,
    TEMP_IMAGE_DIR,
)


def test_config_constants_types_and_values():
    assert isinstance(OUTPUT_EPUB_FILE, str)
    assert OUTPUT_EPUB_FILE.endswith(".epub")
    assert isinstance(DEFAULT_AUTHOR, str) and DEFAULT_AUTHOR
    assert isinstance(TEMP_IMAGE_DIR, str) and TEMP_IMAGE_DIR
    assert isinstance(POSTS_DATA_FILE, str)
    assert POSTS_DATA_FILE.endswith(".json")
