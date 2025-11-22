// src/tooling/pdf-gen/parser.ts
import * as cheerio from 'cheerio';
import type { ChapterContent, SectionContent, ContentBlock, TableData, ListData } from './types';

export type CheerioAPI = ReturnType<typeof cheerio.load>;
// Use AnyNode since Element type isn't directly exported from cheerio in newer versions
type CheerioSelection = ReturnType<CheerioAPI>;

/**
 * Parse HTML string into a cheerio instance.
 */
export function parseHTML(html: string): CheerioAPI {
  return cheerio.load(html);
}

/**
 * Load and parse HTML from a file path.
 */
export async function parseHTMLFile(filePath: string): Promise<CheerioAPI> {
  const fs = await import('fs/promises');
  const html = await fs.readFile(filePath, 'utf-8');
  return parseHTML(html);
}

/**
 * Extract chapter data from parsed HTML.
 */
export function extractChapters($: CheerioAPI): ChapterContent[] {
  const chapters: ChapterContent[] = [];

  $('section[id^="ch-"]').each((_, element) => {
    const $section = $(element);
    const id = $section.attr('id') ?? '';
    const h2 = $section.find('> h2').first();
    const titleText = h2.text().trim();

    // Parse "N. Title" format
    const match = titleText.match(/^(\d+)\.\s*(.+)$/);
    if (!match) return;

    const [, numStr, title] = match;
    const number = parseInt(numStr, 10);

    const sections = extractSections($, $section);

    chapters.push({
      number,
      title,
      slug: id,
      sections,
    });
  });

  return chapters.sort((a, b) => a.number - b.number);
}

/**
 * Extract sections (h3/h4 based) from a chapter.
 */
function extractSections($: CheerioAPI, $chapter: CheerioSelection): SectionContent[] {
  // For simplicity, treat the entire chapter as one section initially
  // A more sophisticated version would split by h3/h4
  const content = extractContentBlocks($, $chapter);

  const h2 = $chapter.find('> h2').first();
  const title = h2.text().replace(/^\d+\.\s*/, '').trim();

  return [{
    level: 2,
    title,
    id: $chapter.attr('id') ?? '',
    content,
  }];
}

/**
 * Extract content blocks from an element.
 */
function extractContentBlocks($: CheerioAPI, $parent: CheerioSelection): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  $parent.children().each((_, child) => {
    const $child = $(child);
    const tagName = child.tagName?.toLowerCase();

    if (tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
      // Skip headings, they're handled separately
      return;
    }

    if (tagName === 'p') {
      blocks.push({
        type: 'paragraph',
        content: $child.text().trim(),
      });
    } else if ($child.hasClass('example')) {
      blocks.push({
        type: 'example',
        content: extractBoxContent($, $child),
      });
    } else if ($child.hasClass('gm')) {
      blocks.push({
        type: 'gm',
        content: extractBoxContent($, $child),
      });
    } else if (tagName === 'table') {
      blocks.push({
        type: 'table',
        content: extractTableData($, $child),
      });
    } else if (tagName === 'ul' || tagName === 'ol') {
      blocks.push({
        type: 'list',
        content: extractListData($, $child, tagName === 'ol'),
      });
    } else if (tagName === 'hr') {
      blocks.push({
        type: 'hr',
        content: '',
      });
    } else if (tagName === 'div' || tagName === 'section') {
      // Recursively extract from nested containers
      blocks.push(...extractContentBlocks($, $child));
    }
  });

  return blocks;
}

/**
 * Extract text content from an example or GM box.
 */
function extractBoxContent($: CheerioAPI, $box: CheerioSelection): string {
  // Remove the title (strong/b element) and get remaining text
  const $clone = $box.clone();
  $clone.find('strong, b').first().remove();
  return $clone.text().trim();
}

/**
 * Extract table data from a table element.
 */
function extractTableData($: CheerioAPI, $table: CheerioSelection): TableData {
  const headers: string[] = [];
  const rows: string[][] = [];

  $table.find('thead th, thead td').each((_, th) => {
    headers.push($(th).text().trim());
  });

  // If no thead, use first row as headers
  if (headers.length === 0) {
    $table.find('tr').first().find('th, td').each((_, cell) => {
      headers.push($(cell).text().trim());
    });
  }

  $table.find('tbody tr, tr').each((i, tr) => {
    // Skip header row if no thead
    if (headers.length > 0 && i === 0 && $table.find('thead').length === 0) return;

    const row: string[] = [];
    $(tr).find('td, th').each((_, td) => {
      row.push($(td).text().trim());
    });
    if (row.length > 0) {
      rows.push(row);
    }
  });

  return { headers, rows };
}

/**
 * Extract list data from ul/ol element.
 */
function extractListData($: CheerioAPI, $list: CheerioSelection, ordered: boolean): ListData {
  const items: string[] = [];
  $list.find('> li').each((_, li) => {
    items.push($(li).text().trim());
  });
  return { ordered, items };
}
