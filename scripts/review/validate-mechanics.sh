#!/usr/bin/env bash
# validate-mechanics.sh - Check for non-standard dice notation

set -euo pipefail

HTML_FILE="${1:-source/codex/book/core_rulebook.html}"

echo "=== Dice Notation Validation ==="
echo "Checking for non-4d6 dice references..."
echo ""

# Find all dice notation patterns (e.g., 2d20, d20, 3d6, etc.)
# Exclude 4d6, 5d6, 6d6 (valid for advantage/disadvantage)
grep -n -E '\b([2-9]d[0-9]+|d20|1d[0-9]+|[0-9]+d[0-9]+)\b' "$HTML_FILE" \
  | grep -v '4d6' \
  | grep -v '5d6' \
  | grep -v '6d6' \
  || echo "No invalid dice notation found"

echo ""
echo "=== DC Value Validation ==="
echo "Checking for non-standard DC values..."
echo ""

# Find all DC references and check if they match standard ladder
# Standard: 12, 14, 16, 18, 20, 22
grep -n -o -E 'DC [0-9]+' "$HTML_FILE" \
  | grep -v 'DC 12' \
  | grep -v 'DC 14' \
  | grep -v 'DC 16' \
  | grep -v 'DC 18' \
  | grep -v 'DC 20' \
  | grep -v 'DC 22' \
  || echo "All DC values are standard"
