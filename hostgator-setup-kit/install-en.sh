#!/usr/bin/env bash
# Compatibility entry point. The primary installer now provides the English UI.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
printf '\033[33mNote: install-en.sh has been merged into install.sh; starting the primary installer.\033[0m\n'
exec bash "$SCRIPT_DIR/install.sh" "$@"
