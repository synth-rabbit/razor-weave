#!/usr/bin/env python3
"""
extract-terms.py - Extract defined terms from core rulebook HTML
"""

import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict

def extract_bold_terms(html_content: str) -> Dict[str, List[Tuple[str, str]]]:
    """
    Extract terms defined in bold with definitions.
    Returns dict mapping term -> [(chapter_id, context), ...]
    """
    terms = defaultdict(list)

    # Pattern: <strong>Term</strong>: definition text
    # or <b>Term</b>: definition text
    pattern = r'<(?:strong|b)>([^<]+)</(?:strong|b)>:\s*([^<.]+[.])'

    matches = re.finditer(pattern, html_content)

    for match in matches:
        term = match.group(1).strip()
        definition = match.group(2).strip()

        # Try to find chapter context
        start = max(0, match.start() - 500)
        context_before = html_content[start:match.start()]
        chapter_match = re.search(r'id="([^"]*ch[^"]*)"', context_before)
        chapter_id = chapter_match.group(1) if chapter_match else "unknown"

        terms[term].append((chapter_id, definition))

    return terms

def main():
    if len(sys.argv) < 2:
        print("Usage: extract-terms.py <html-file>")
        sys.exit(1)

    html_file = Path(sys.argv[1])

    if not html_file.exists():
        print(f"Error: {html_file} not found")
        sys.exit(1)

    html_content = html_file.read_text(encoding='utf-8')

    print("=== Term Extraction ===\n")

    terms = extract_bold_terms(html_content)

    print(f"Found {len(terms)} unique terms:\n")

    for term, occurrences in sorted(terms.items()):
        print(f"**{term}**")
        for chapter_id, definition in occurrences:
            print(f"  - Chapter: {chapter_id}")
            print(f"    Definition: {definition[:100]}...")
        print()

if __name__ == "__main__":
    main()
