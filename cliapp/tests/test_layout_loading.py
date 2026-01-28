from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from epubkit.builder import _load_layout_files, create_epub

# ----------------------------------------------------------------------------
# Fixtures
# ----------------------------------------------------------------------------


@pytest.fixture
def valid_layout_fixtures(tmp_path):
    """正しいレイアウトファイルを作成し、そのディレクトリパスを返すフィクスチャ"""
    book_layout_dir = tmp_path / "book_layout"
    book_layout_dir.mkdir()

    # 正しいHTMLテンプレート
    html_content = """<html>
<head>
    <title>{chapter_title}</title>
    <style>{css_content}</style>
</head>
<body>
    <h1>{chapter_title}</h1>
    <img src="{image_filename}" alt="Post Image"/>
    <p class="caption">{caption_html}</p>
    <p class="post-link">
        <a href="{post_url}">View Original</a>
    </p>
</body>
</html>"""

    # 正しいCSSファイル
    css_content = """body { font-family: serif; }
img { width: 100%; }
.caption { color: blue; }"""

    (book_layout_dir / "layout.html").write_text(html_content, encoding="utf-8")
    (book_layout_dir / "layout.css").write_text(css_content, encoding="utf-8")

    return book_layout_dir


@pytest.fixture
def dummy_post_data(tmp_path):
    """テスト用のダミー投稿データと画像ファイルを作成するフィクスチャ"""
    img_file = tmp_path / "test.jpg"
    # ダミーのJPEGヘッダを書き込む
    img_file.write_bytes(b"\xff\xd8\xff\xe0\x00\x10JFIF")

    return [
        {
            "caption": "Test caption",
            "image_path": str(img_file),
            "post_url": "https://example.com/post/1",
            "shortcode": "TEST1",
        }
    ]


# ----------------------------------------------------------------------------
# Tests
# ----------------------------------------------------------------------------


@patch("epubkit.builder.Image")
@patch("epubkit.builder.epub")
def test_create_epub_with_layout_files(
    mock_epub,
    mock_image,
    tmp_path,
    monkeypatch,
    valid_layout_fixtures,
    dummy_post_data,
):
    """create_epub関数がレイアウトファイルを正しく使用することのテスト"""
    # Arrange
    # フィクスチャの親ディレクトリに移動して、
    # 相対パスで book_layout を見つけられるようにする
    monkeypatch.chdir(valid_layout_fixtures.parent)

    output_file = tmp_path / "test.epub"

    # Mock setup
    # Image.open().format が "JPEG" を返すように設定
    mock_img_instance = MagicMock()
    mock_img_instance.format = "JPEG"
    mock_image.open.return_value = mock_img_instance

    # epub.write_epub が実際にファイルを書き込む動作をエミュレート（または何もしない）
    # ここではテストの成功条件としてファイル存在確認をしているため、ダミーファイルを作る
    mock_epub.write_epub.side_effect = lambda name, book, opts: Path(
        name
    ).write_bytes(b"EPUB")

    # Act
    create_epub(dummy_post_data, output_epub=str(output_file))

    # Assert
    assert output_file.exists()
    assert mock_epub.EpubHtml.called


@patch("epubkit.builder._load_layout_files")
def test_create_epub_with_missing_layout_files(
    mock_load_layout, tmp_path, monkeypatch, dummy_post_data, capsys
):
    """レイアウトファイルがない場合、エラーログを出力して終了するテスト"""
    # Arrange
    monkeypatch.chdir(tmp_path)
    output_file = tmp_path / "test.epub"

    # _load_layout_files が FileNotFoundError を投げるように設定
    mock_load_layout.side_effect = FileNotFoundError("layout.html")

    # Act
    create_epub(dummy_post_data, output_epub=str(output_file))

    # Assert
    assert not output_file.exists()


@patch("epubkit.builder._load_layout_files")
def test_create_epub_with_invalid_layout_template(
    mock_load_layout, tmp_path, dummy_post_data, capsys
):
    """テンプレート構造が不正な場合のエラーハンドリングテスト"""
    # Arrange
    output_file = tmp_path / "test.epub"

    # _load_layout_files が ValueError を投げるように設定
    mock_load_layout.side_effect = ValueError("Invalid structure")

    # Act
    create_epub(dummy_post_data, output_epub=str(output_file))

    # Assert
    assert not output_file.exists()


def test_load_layout_files_with_custom_parameters(tmp_path, monkeypatch):
    """カスタムパラメータでレイアウトファイルを読み込むテスト"""
    # Arrange
    custom_layout_dir = tmp_path / "custom_layouts"
    custom_layout_dir.mkdir()

    custom_html_name = "custom_template.html"
    custom_css_name = "custom_styles.css"

    html_content = "<html><title>{chapter_title}</title></html>"
    css_content = "body { font-family: custom-font; }"

    (custom_layout_dir / custom_html_name).write_text(
        html_content, encoding="utf-8"
    )
    (custom_layout_dir / custom_css_name).write_text(
        css_content, encoding="utf-8"
    )

    monkeypatch.chdir(tmp_path)

    # Act
    html_template, css_content_result = _load_layout_files(
        layout_dir="custom_layouts",
        html_file=custom_html_name,
        css_file=custom_css_name,
    )

    # Assert
    assert "{chapter_title}" in html_template
    assert "font-family: custom-font" in css_content_result
