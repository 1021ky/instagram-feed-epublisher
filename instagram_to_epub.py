import os
import sys

# Ensure src/ is on sys.path when running as a script from repo root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from app.cli import main, run_all  # noqa: E402
from app.commands import create_epub_from_saved_data  # noqa: E402
from app.housekeeping import cleanup_temp_files  # noqa: E402
from instagram.fetch import fetch_instagram_data  # noqa: E402

if __name__ == "__main__":
    main()
