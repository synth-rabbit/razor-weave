#!/usr/bin/env bash
# validate-links.sh - Check all internal links have valid targets

set -euo pipefail

HTML_FILE="${1:-source/codex/book/core_rulebook.html}"

echo "=== Internal Link Validation ==="
echo ""

# Extract all hrefs that are internal links (start with #)
echo "Extracting all internal link targets..."
HREFS=$(grep -o 'href="#[^"]*"' "$HTML_FILE" | sed 's/href="#\([^"]*\)"/\1/' | sort -u)

# Extract all id attributes
echo "Extracting all id attributes..."
IDS=$(grep -o 'id="[^"]*"' "$HTML_FILE" | sed 's/id="\([^"]*\)"/\1/' | sort -u)

# Check each href has a matching id
echo ""
echo "Checking for broken links..."
BROKEN=0

for href in $HREFS; do
  if ! echo "$IDS" | grep -q "^${href}$"; then
    echo "BROKEN: #${href} (no matching id found)"
    BROKEN=$((BROKEN + 1))
  fi
done

echo ""
if [ $BROKEN -eq 0 ]; then
  echo "✓ All internal links are valid"
else
  echo "✗ Found $BROKEN broken link(s)"
  exit 1
fi
