/**
 * Content Assembler
 *
 * Combines processed chapters and sheets into final document structure.
 */

import { PARTS } from './toc-generator.js';

export interface ChapterHtml {
  number: number;
  slug: string;
  html: string;
}

export interface SheetHtml {
  slug: string;
  html: string;
}

export interface AssemblyParts {
  chapters: ChapterHtml[];
  sheets: SheetHtml[];
  partIntros: Map<string, string>;
}

/**
 * Wrap chapter content in section element
 */
export function wrapChapter(number: number, slug: string, html: string): string {
  const paddedNum = number.toString().padStart(2, '0');
  const id = `ch-${paddedNum}-${slug}`;
  return `<section id="${id}">\n${html}\n</section>`;
}

/**
 * Wrap sheet content in div.sheet-block
 */
export function wrapSheet(slug: string, html: string): string {
  return `<div class="sheet-block" id="${slug}">\n${html}\n</div>`;
}

/**
 * Wrap part intro in section
 */
function wrapPartIntro(partId: string, title: string, introHtml: string): string {
  return `<section id="${partId}" class="part-intro">
  <h1>${title}</h1>
  ${introHtml}
</section>`;
}

/**
 * Assemble all content into final document order
 */
export function assembleContent(parts: AssemblyParts): string {
  const sections: string[] = [];

  for (const part of PARTS) {
    const [startChapter, endChapter] = part.chapters;

    // Add part intro if available
    const intro = parts.partIntros.get(part.id);
    if (intro) {
      sections.push(wrapPartIntro(part.id, part.title, intro));
    }

    // Add chapters in this part
    for (const chapter of parts.chapters) {
      if (chapter.number >= startChapter && chapter.number <= endChapter) {
        // Chapter 27 combines its narrative intro with the actual sheets
        if (chapter.number === 27 && parts.sheets.length > 0) {
          const sheetsHtml = assembleSheetBlocks(parts.sheets);
          const combinedHtml = chapter.html + '\n\n' + sheetsHtml;
          sections.push(wrapChapter(chapter.number, chapter.slug, combinedHtml));
        } else {
          sections.push(wrapChapter(chapter.number, chapter.slug, chapter.html));
        }
      }
    }
  }

  return sections.join('\n\n');
}

/**
 * Assemble sheet blocks (without section wrapper)
 * Returns HTML for all sheets with headings, to be appended to chapter 27 content
 */
function assembleSheetBlocks(sheets: SheetHtml[]): string {
  return sheets.map((s, i) => {
    const sectionNum = `27.${i + 1}`;
    const withHeading = `<h3>${sectionNum} ${formatSheetTitle(s.slug)}</h3>\n${s.html}`;
    return wrapSheet(s.slug, withHeading);
  }).join('\n\n');
}

/**
 * Format sheet slug to title
 */
function formatSheetTitle(slug: string): string {
  return slug
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
