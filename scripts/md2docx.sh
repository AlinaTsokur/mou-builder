#!/usr/bin/env bash
# Собирает .docx из markdown-файла через LibreOffice.
# Использование: scripts/md2docx.sh docs/templates-audit-2026-08.md ~/Desktop
set -euo pipefail

SRC="${1:?укажите .md файл}"
OUTDIR="${2:-$HOME/Desktop}"
NAME="$(basename "${SRC%.*}")"
TMP="$(mktemp -d)"

python3 "$(dirname "$0")/md2html.py" "$SRC" "$TMP/$NAME.html"
soffice --headless --infilter="HTML (StarWriter)" \
        --convert-to "docx:MS Word 2007 XML" \
        --outdir "$TMP" "$TMP/$NAME.html" >/dev/null

mv "$TMP/$NAME.docx" "$OUTDIR/$NAME.docx"
rm -rf "$TMP"
echo "готово: $OUTDIR/$NAME.docx"
