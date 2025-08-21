from io import StringIO
from pathlib import Path
from unittest.mock import patch

import pytest

from epubkit.builder import create_epub, load_layout_files


class TestLayoutLoading:
    """レイアウトファイル読み込み機能のテスト"""

    @pytest.fixture()
    def valid_layout_fixtures(self, tmp_path):
        """正しいレイアウトファイルのフィクスチャ"""
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

        (book_layout_dir / "layout.html").write_text(
            html_content, encoding="utf-8"
        )
        (book_layout_dir / "layout.css").write_text(
            css_content, encoding="utf-8"
        )

        return book_layout_dir

    @pytest.fixture()
    def invalid_layout_fixtures(self, tmp_path):
        """不正なレイアウトファイルのフィクスチャ"""
        book_layout_dir = tmp_path / "book_layout"
        book_layout_dir.mkdir()

        # 必須プレースホルダーが欠損したHTMLテンプレート
        invalid_html_content = """<html>
<head>
    <title>Static Title</title>
    <style>{css_content}</style>
</head>
<body>
    <h1>Missing chapter_title placeholder</h1>
</body>
</html>"""

        css_content = "body { font-family: serif; }"

        (book_layout_dir / "layout.html").write_text(
            invalid_html_content, encoding="utf-8"
        )
        (book_layout_dir / "layout.css").write_text(
            css_content, encoding="utf-8"
        )

        return book_layout_dir

    @pytest.fixture()
    def missing_files_fixtures(self, tmp_path):
        """ファイルが存在しないフィクスチャ"""
        book_layout_dir = tmp_path / "book_layout"
        book_layout_dir.mkdir()
        # ファイルは作成しない
        return book_layout_dir

    def test_load_layout_files_success(
        self, valid_layout_fixtures, monkeypatch
    ):
        """レイアウトファイル読み込み成功のテスト（AAAパターン）"""
        # Arrange - 準備
        monkeypatch.chdir(valid_layout_fixtures.parent)

        # Act - 実行
        html_template, css_content = load_layout_files()

        # Assert - アサート
        # 期待される内容が含まれていることを確認
        assert "{chapter_title}" in html_template
        assert "{css_content}" in html_template
        assert "{image_filename}" in html_template
        assert "{caption_html}" in html_template
        assert "{post_url}" in html_template
        assert "font-family: serif" in css_content

    def test_load_layout_files_invalid_structure(
        self, invalid_layout_fixtures, monkeypatch
    ):
        """レイアウトファイル構造不正時のテスト（AAAパターン）"""
        # Arrange - 準備
        monkeypatch.chdir(invalid_layout_fixtures.parent)

        # stderr出力をキャプチャ
        captured_stderr = StringIO()

        # Act & Assert - 実行とアサート
        with patch("sys.stderr", captured_stderr):
            with pytest.raises(ValueError):
                load_layout_files()

            # エラーメッセージが標準エラーに出力されていることを確認
            stderr_output = captured_stderr.getvalue()
            assert "[!]" in stderr_output

    def test_load_layout_files_missing_files(
        self, missing_files_fixtures, monkeypatch
    ):
        """レイアウトファイル不存在時のテスト（AAAパターン）"""
        # Arrange - 準備
        monkeypatch.chdir(missing_files_fixtures.parent)

        # stderr出力をキャプチャ
        captured_stderr = StringIO()

        # Act & Assert - 実行とアサート
        with patch("sys.stderr", captured_stderr):
            with pytest.raises(FileNotFoundError):
                load_layout_files()

            # エラーメッセージが標準エラーに出力されていることを確認
            stderr_output = captured_stderr.getvalue()
            assert "[!]" in stderr_output

    def test_load_layout_files_with_missing_css_only(
        self, tmp_path, monkeypatch
    ):
        """CSSファイルのみが存在しない場合のテスト（AAAパターン）"""
        # Arrange - 準備
        book_layout_dir = tmp_path / "book_layout"
        book_layout_dir.mkdir()

        html_content = "<html><title>{chapter_title}</title></html>"
        (book_layout_dir / "layout.html").write_text(
            html_content, encoding="utf-8"
        )
        # CSSファイルは作成しない

        monkeypatch.chdir(tmp_path)
        captured_stderr = StringIO()

        # Act & Assert - 実行とアサート
        with patch("sys.stderr", captured_stderr):
            with pytest.raises(FileNotFoundError):
                load_layout_files()

            stderr_output = captured_stderr.getvalue()
            assert "layout.css" in stderr_output
            assert "[!]" in stderr_output

    def test_create_epub_with_layout_files(
        self, tmp_path, monkeypatch, valid_layout_fixtures
    ):
        """create_epub関数がレイアウトファイルを正しく使用することのテスト（AAAパターン）"""
        # Arrange - 準備
        monkeypatch.chdir(valid_layout_fixtures.parent)

        # サンプル投稿データ
        img_file = tmp_path / "test.jpg"
        img_file.write_bytes(b"\x89JPEGFAKE")

        posts = [
            {
                "caption": "Test caption",
                "image_path": str(img_file),
                "post_url": "https://example.com/post/1",
                "shortcode": "TEST1",
            }
        ]

        output_file = tmp_path / "test.epub"

        # Act - 実行
        with (
            patch("epubkit.builder.epub") as mock_epub,
            patch("epubkit.builder.Image") as mock_image,
        ):

            # モックの設定
            mock_img = type("_Img", (), {"format": "JPEG"})()
            mock_image.open.return_value = mock_img

            mock_epub.write_epub.side_effect = lambda name, book, opts: Path(
                name
            ).write_bytes(b"EPUB")

            create_epub(posts, output_epub=str(output_file))

        # Assert - アサート
        assert output_file.exists()
        assert mock_epub.EpubHtml.called

    def test_create_epub_with_missing_layout_files(
        self, tmp_path, monkeypatch
    ):
        """レイアウトファイルがない場合のcreate_epubのテスト（AAAパターン）"""
        # Arrange - 準備
        monkeypatch.chdir(tmp_path)  # book_layoutディレクトリが存在しない場所

        posts = [
            {
                "caption": "Test caption",
                "image_path": str(tmp_path / "test.jpg"),
                "post_url": "https://example.com/post/1",
                "shortcode": "TEST1",
            }
        ]

        output_file = tmp_path / "test.epub"
        captured_stderr = StringIO()

        # Act - 実行
        with patch("sys.stderr", captured_stderr):
            create_epub(posts, output_epub=str(output_file))

        # Assert - アサート
        # ファイルが作成されていないことを確認
        assert not output_file.exists()

        # エラーメッセージが出力されていることを確認
        stderr_output = captured_stderr.getvalue()
        assert "[!]" in stderr_output
        assert "layout.html" in stderr_output

    def test_create_epub_with_invalid_layout_template(
        self, tmp_path, monkeypatch
    ):
        """テンプレートの置換でエラーが発生する場合のテスト（AAAパターン）"""
        # Arrange - 準備
        book_layout_dir = tmp_path / "book_layout"
        book_layout_dir.mkdir()

        # 不正なプレースホルダーを含むHTMLテンプレート
        invalid_html = """<html>
<title>{chapter_title}</title>
<body>
    <h1>{invalid_placeholder}</h1>
    <p>{css_content}</p>
</body>
</html>"""

        css_content = "body { color: red; }"

        (book_layout_dir / "layout.html").write_text(
            invalid_html, encoding="utf-8"
        )
        (book_layout_dir / "layout.css").write_text(
            css_content, encoding="utf-8"
        )

        monkeypatch.chdir(tmp_path)

        # サンプル投稿データ
        img_file = tmp_path / "test.jpg"
        img_file.write_bytes(b"\x89JPEGFAKE")

        posts = [
            {
                "caption": "Test caption",
                "image_path": str(img_file),
                "post_url": "https://example.com/post/1",
                "shortcode": "TEST1",
            }
        ]

        output_file = tmp_path / "test.epub"
        captured_stderr = StringIO()

        # Act - 実行
        with (
            patch("epubkit.builder.epub") as mock_epub,
            patch("epubkit.builder.Image") as mock_image,
            patch("sys.stderr", captured_stderr),
        ):

            mock_img = type("_Img", (), {"format": "JPEG"})()
            mock_image.open.return_value = mock_img

            mock_epub.write_epub.side_effect = lambda name, book, opts: Path(
                name
            ).write_bytes(b"EPUB")

            create_epub(posts, output_epub=str(output_file))

        # Assert - アサート
        stderr_output = captured_stderr.getvalue()
        assert "[!]" in stderr_output
        assert "layoutファイルの構造が不正です" in stderr_output

    def test_load_layout_files_with_custom_parameters(
        self, tmp_path, monkeypatch
    ):
        """カスタムパラメータでレイアウトファイルを読み込むテスト（AAAパターン）"""
        # Arrange - 準備
        custom_layout_dir = tmp_path / "custom_layouts"
        custom_layout_dir.mkdir()

        # カスタムファイル名を使用
        custom_html_name = "custom_template.html"
        custom_css_name = "custom_styles.css"

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

        css_content = """body { font-family: custom-font; }
img { width: 100%; }
.caption { color: green; }"""

        (custom_layout_dir / custom_html_name).write_text(
            html_content, encoding="utf-8"
        )
        (custom_layout_dir / custom_css_name).write_text(
            css_content, encoding="utf-8"
        )

        monkeypatch.chdir(tmp_path)

        # Act - 実行
        html_template, css_content_result = load_layout_files(
            layout_dir="custom_layouts",
            html_file=custom_html_name,
            css_file=custom_css_name,
        )

        # Assert - アサート
        assert "{chapter_title}" in html_template
        assert "{css_content}" in html_template
        assert "{image_filename}" in html_template
        assert "{caption_html}" in html_template
        assert "{post_url}" in html_template
        assert "font-family: custom-font" in css_content_result
        assert "color: green" in css_content_result
