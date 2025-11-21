/**
 * TOC Generator
 *
 * Generates table of contents structure from chapters.
 */

export interface TocEntry {
  type: 'part' | 'chapter';
  id: string;
  title: string;
  number?: number;
  children?: TocEntry[];
}

export interface PartDefinition {
  id: string;
  title: string;
  chapters: [number, number]; // [start, end] inclusive
}

export const PARTS: PartDefinition[] = [
  { id: 'part-i-foundations', title: 'Part I: Foundations', chapters: [1, 13] },
  { id: 'part-ii-skills-proficiencies', title: 'Part II: Skills, Proficiencies, and Mechanical Reference', chapters: [14, 20] },
  { id: 'part-iii-reference-and-gm', title: 'Part III: Game Master Section', chapters: [21, 26] },
  { id: 'part-iv-glossary-index', title: 'Part IV: Reference Sheets, Glossary, and Index', chapters: [27, 30] },
];

interface ChapterInfo {
  number: number;
  title: string;
  slug: string;
}

/**
 * Generate chapter ID from number and slug
 */
function chapterId(number: number, slug: string): string {
  const paddedNum = number.toString().padStart(2, '0');
  return `ch-${paddedNum}-${slug}`;
}

/**
 * Generate TOC structure with parts and chapters
 */
export function generateToc(chapters: ChapterInfo[]): TocEntry[] {
  return PARTS.map(part => {
    const [start, end] = part.chapters;
    const partChapters = chapters.filter(c => c.number >= start && c.number <= end);

    return {
      type: 'part' as const,
      id: part.id,
      title: part.title,
      children: partChapters.map(c => ({
        type: 'chapter' as const,
        id: chapterId(c.number, c.slug),
        title: `${c.number}. ${c.title}`,
        number: c.number,
      })),
    };
  });
}

/**
 * Render TOC to HTML string
 */
export function renderTocHtml(toc: TocEntry[]): string {
  const renderEntry = (entry: TocEntry): string => {
    if (entry.type === 'part') {
      const childrenHtml = entry.children?.map(renderEntry).join('\n') || '';
      return `
<li>
  <a href="#${entry.id}">${entry.title}</a>
  <ul class="toc-list">
    ${childrenHtml}
  </ul>
</li>`;
    }
    return `<li><a href="#${entry.id}">${entry.title}</a></li>`;
  };

  return `<ul class="toc-root">
${toc.map(renderEntry).join('\n')}
</ul>`;
}
