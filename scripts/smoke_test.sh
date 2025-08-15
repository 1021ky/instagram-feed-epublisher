#!/usr/bin/env zsh
set -euo pipefail

# Simple smoke test for `all --target_user` flow.
# Requirements:
#   - Existing Instaloader session for $LOGIN_USER (run `instaloader --login $LOGIN_USER` beforehand)
#   - Internet access
#   - Public target user
#
# Usage:
#   LOGIN_USER=<login_user> TARGET_USER=<public_account> zsh scripts/smoke_test.sh

if [[ -z "${LOGIN_USER:-}" || -z "${TARGET_USER:-}" ]]; then
  echo "Usage: LOGIN_USER=<login_user> TARGET_USER=<public_account> zsh scripts/smoke_test.sh" 1>&2
  exit 2
fi

EPUB_NAME="${TARGET_USER}.epub"

# Clean previous artifacts
rm -f -- "$EPUB_NAME"

# Run end-to-end
python instagram_to_epub.py all \
  --login_user="$LOGIN_USER" \
  --target_user="$TARGET_USER"

status=$?

if [[ $status -ne 0 ]]; then
  echo "[FAIL] Command exited with status $status" 1>&2
  exit $status
fi

if [[ -f "$EPUB_NAME" ]]; then
  echo "[PASS] Smoke test succeeded: $EPUB_NAME created"
  exit 0
else
  echo "[FAIL] EPUB not found: $EPUB_NAME" 1>&2
  exit 1
fi
