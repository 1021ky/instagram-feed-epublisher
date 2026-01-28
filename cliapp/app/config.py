"""Configuration constants for the Instagram to EPUB application."""

import os

# File paths
OUTPUT_EPUB_FILE = "output.epub"
POSTS_DATA_FILE = "posts_data.json"
TEMP_IMAGE_DIR = "temp_images"

# EPUB metadata defaults
DEFAULT_AUTHOR = "Instagram Collection"

# Layout file paths (relative to current working directory)
# When running from repo root: "./book_layout"
# When running tests: tests set up their own book_layout in test directories
DEFAULT_LAYOUT_DIR = "book_layout"
DEFAULT_LAYOUT_HTML_FILE = "layout.html"
DEFAULT_LAYOUT_CSS_FILE = "layout.css"
