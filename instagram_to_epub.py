import os
import sys

# Ensure src/ is on sys.path when running as a script from repo root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from app.cli import main  # noqa: E402


if __name__ == "__main__":
    main()
