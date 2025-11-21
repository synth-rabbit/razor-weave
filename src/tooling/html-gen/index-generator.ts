/**
 * Index Generator
 *
 * Auto-generates index from document headings.
 */

export interface IndexEntry {
  term: string;
  anchor: string;
}

interface HeadingInfo {
  text: string;
  id: string;
  level: number;
}

/**
 * Generate alphabetically sorted index from headings
 */
export function generateIndex(headings: HeadingInfo[]): IndexEntry[] {
  const entries = headings.map(h => ({
    term: h.text,
    anchor: `#${h.id}`,
  }));

  return entries.sort((a, b) => a.term.localeCompare(b.term));
}

/**
 * Render index to HTML
 */
export function renderIndexHtml(entries: IndexEntry[]): string {
  // Group by first letter
  const grouped = new Map<string, IndexEntry[]>();

  for (const entry of entries) {
    const letter = entry.term[0].toUpperCase();
    if (!grouped.has(letter)) {
      grouped.set(letter, []);
    }
    grouped.get(letter)!.push(entry);
  }

  const sections: string[] = [];

  for (const [letter, items] of grouped) {
    const itemsHtml = items
      .map(e => `<dd><a href="${e.anchor}">${e.term}</a></dd>`)
      .join('\n');

    sections.push(`
<div class="index-section">
  <dt>${letter}</dt>
  ${itemsHtml}
</div>`);
  }

  return `<dl class="index">\n${sections.join('\n')}\n</dl>`;
}
