"""Shared test fixtures for all tests."""

import pytest


@pytest.fixture(autouse=True, scope="function")
def setup_book_layout_if_needed(tmp_path, monkeypatch, request):
    """
    Auto-setup a basic book_layout directory for tests that don't explicitly set one up.

    This is skipped for tests that have their own book_layout setup
    (detected by checking if test changes directory or has layout fixtures).
    """
    # Skip for tests that explicitly handle layout (e.g., test_layout_loading tests)
    if (
        "layout" in request.node.name.lower()
        or "valid_layout_fixtures" in request.fixturenames
        or "invalid_layout_fixtures" in request.fixturenames
    ):
        return

    # Create a minimal book_layout in tmp_path
    book_layout_dir = tmp_path / "book_layout"
    book_layout_dir.mkdir(exist_ok=True)

    # Create minimal layout files
    html_content = """<html>
<head>
    <style>{css_content}</style>
</head>
<body>
    <h1>{chapter_title}</h1>
    <img src="{image_filename}" alt="Post image"/>
    <div>{caption_html}</div>
    <p><a href="{post_url}">{post_url}</a></p>
</body>
</html>"""

    css_content = """body {
    font-family: sans-serif;
}"""

    (book_layout_dir / "layout.html").write_text(html_content, encoding="utf-8")
    (book_layout_dir / "layout.css").write_text(css_content, encoding="utf-8")

    # Change to tmp_path so book_layout is found
    monkeypatch.chdir(tmp_path)
