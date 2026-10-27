#!/usr/bin/env bash
set -euo pipefail

# Codespaces already defaults to private. Reapply it when reconnecting, too.
# This hook only sets port access; it never starts the app or downloads a model.
if [[ -n "${CODESPACE_NAME:-}" ]]; then
  gh codespace ports visibility 3000:private 8000:private -c "$CODESPACE_NAME"
fi
