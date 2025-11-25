// src/tooling/pdf-gen/parser.ts
import * as cheerio from 'cheerio';
import type { ChapterContent, SectionContent, ContentBlock, TableData, ListData, HeadingData, SheetData } from './types';

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

    // Try to find chapter heading - check both h1 and h2, use whichever matches format
    const h1 = $section.find('> h1').first();
    const h2 = $section.find('> h2').first();

    // Try h1 first (for chapters using "Chapter N:" format)
    let titleText = h1.length ? h1.text().trim() : '';
    let match = titleText.match(/^Chapter\s+(\d+):\s*(.+)$/i);

    // If h1 doesn't match, try h2 with "N." format
    if (!match) {
      titleText = h2.length ? h2.text().trim() : '';
      match = titleText.match(/^(\d+)\.\s*(.+)$/);
    }

    // Also try "N." format on h1 (for chapter 1)
    if (!match && h1.length) {
      titleText = h1.text().trim();
      match = titleText.match(/^(\d+)\.\s*(.+)$/);
    }

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

  // Look for h1 or h2 - chapter 1 uses h1, others use h2
  let heading = $chapter.find('> h2').first();
  if (!heading.length) {
    heading = $chapter.find('> h1').first();
  }
  const title = heading.text().replace(/^\d+\.\s*/, '').trim();

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

    if (tagName === 'h2') {
      // Skip chapter headings, they're handled separately
      return;
    }

    if (tagName === 'h3' || tagName === 'h4') {
      // Include subsection headings as content blocks
      blocks.push({
        type: 'heading',
        content: {
          level: tagName === 'h3' ? 3 : 4,
          text: extractTextWithSpacing($, $child),
        },
      });
      return;
    }

    if (tagName === 'p') {
      blocks.push({
        type: 'paragraph',
        content: extractTextWithSpacing($, $child),
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
    } else if ($child.hasClass('sheet-block')) {
      // Extract sheet as a special block type for print-friendly rendering
      const sheetId = $child.attr('id') || '';
      const sheetTitle = $child.find('h3, h1').first().text().trim() || 'Sheet';
      blocks.push({
        type: 'sheet',
        content: {
          id: sheetId,
          title: sheetTitle,
          blocks: extractSheetContent($, $child),
        },
      });
    } else if (tagName === 'div' || tagName === 'section') {
      // Recursively extract from nested containers
      blocks.push(...extractContentBlocks($, $child));
    }
  });

  return blocks;
}

/**
 * Extract content from a sheet-block element.
 * Sheets have special content like fill lines, checkboxes, and clock segments.
 */
function extractSheetContent($: CheerioAPI, $sheet: CheerioSelection): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  $sheet.children().each((_, child) => {
    const $child = $(child);
    const tagName = child.tagName?.toLowerCase();

    // Skip the sheet title (h1, h3) as it's extracted separately
    if (tagName === 'h1' || tagName === 'h3') {
      return;
    }

    if (tagName === 'h2' || tagName === 'h4') {
      blocks.push({
        type: 'heading',
        content: {
          level: tagName === 'h2' ? 3 : 4,
          text: extractTextWithSpacing($, $child),
        },
      });
    } else if (tagName === 'p') {
      blocks.push({
        type: 'paragraph',
        content: extractSheetText($, $child),
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
    }
  });

  return blocks;
}

/**
 * Extract text from sheet elements, preserving fill lines and checkboxes.
 */
function extractSheetText($: CheerioAPI, $el: CheerioSelection): string {
  let html = $el.html() || '';

  // Convert fill-line spans to underscores for visual indication
  html = html.replace(/<span class="fill-line[^"]*"><\/span>/g, '________________________');

  // Parse and extract text
  const $temp = cheerio.load(`<div>${html}</div>`);
  return cleanTextContent($temp('div').text());
}

/**
 * Extract text from an element with proper spacing around inline elements.
 * Cheerio's .text() loses spaces between adjacent inline elements.
 */
function extractTextWithSpacing($: CheerioAPI, $el: CheerioSelection): string {
  // Get inner HTML and process it to preserve spacing
  let html = $el.html() || '';

  // Add space before/after inline tags to prevent word concatenation
  // This handles cases like "<strong>Tags</strong>describe" -> "Tags describe"
  const inlineTags = ['strong', 'b', 'em', 'i', 'span', 'a', 'code'];
  for (const tag of inlineTags) {
    // Add space before opening tag if preceded by word character (not already spaced)
    // Match: word<tag> or word<tag  -> add space before <tag
    html = html.replace(new RegExp(`(\\w)(<${tag}[\\s>])`, 'gi'), '$1 $2');
    // Add space after closing tag if followed by word character
    html = html.replace(new RegExp(`(</${tag}>)(\\w)`, 'gi'), '$1 $2');
    // Add space after punctuation before opening tag: ":"<em> -> ": "<em>
    html = html.replace(new RegExp(`([:;,])(<${tag}[\\s>])`, 'gi'), '$1 $2');
  }

  // Parse the modified HTML and extract text
  const $temp = cheerio.load(`<div>${html}</div>`);
  return cleanTextContent($temp('div').text());
}

/**
 * Clean and normalize text content for PDF rendering.
 * Handles special characters that fonts may not support.
 */
function cleanTextContent(text: string): string {
  return text
    // Replace ballot box (checkbox) with empty square bracket notation
    .replace(/☐/g, '[ ]')
    // Replace checked ballot box
    .replace(/☑/g, '[x]')
    // Mathematical symbols - convert to ASCII equivalents
    .replace(/≥/g, '>=')  // greater than or equal
    .replace(/≤/g, '<=')  // less than or equal
    .replace(/−/g, '-')   // minus sign (U+2212) to hyphen
    .replace(/×/g, 'x')   // multiplication sign
    .replace(/÷/g, '/')   // division sign
    // Replace other common problematic characters
    .replace(/—/g, '-')   // em dash to hyphen
    .replace(/–/g, '-')   // en dash to hyphen
    .replace(/'/g, "'")   // smart quote
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/…/g, '...') // ellipsis
    // Handle markdown-style asterisk formatting: *word*text -> word text
    .replace(/\*\*([^*]+)\*\*(\w)/g, '$1 $2')  // **bold**word -> bold word
    .replace(/\*([^*]+)\*(\w)/g, '$1 $2')       // *italic*word -> italic word
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract text content from an example or GM box.
 */
function extractBoxContent($: CheerioAPI, $box: CheerioSelection): string {
  // Remove the title (strong/b element) and get remaining text
  const $clone = $box.clone();
  $clone.find('strong, b').first().remove();
  return extractTextWithSpacing($, $clone);
}

/**
 * Extract table data from a table element.
 */
function extractTableData($: CheerioAPI, $table: CheerioSelection): TableData {
  const headers: string[] = [];
  const rows: string[][] = [];

  $table.find('thead th, thead td').each((_, th) => {
    headers.push(extractTextWithSpacing($, $(th)));
  });

  // If no thead, use first row as headers
  if (headers.length === 0) {
    $table.find('tr').first().find('th, td').each((_, cell) => {
      headers.push(extractTextWithSpacing($, $(cell)));
    });
  }

  const hasThead = $table.find('thead').length > 0;

  $table.find('tbody tr, tr').each((i, tr) => {
    // Skip header row if no thead
    if (headers.length > 0 && i === 0 && !hasThead) return;

    const row: string[] = [];
    $(tr).find('td, th').each((_, td) => {
      row.push(extractTextWithSpacing($, $(td)));
    });

    // Skip empty rows
    if (row.length === 0) return;

    // Skip rows that are duplicates of headers (common in some HTML tables)
    if (row.length === headers.length) {
      const isDuplicate = row.every((cell, idx) => cell === headers[idx]);
      if (isDuplicate) return;
    }

    rows.push(row);
  });

  return { headers, rows };
}

/**
 * Extract list data from ul/ol element.
 */
function extractListData($: CheerioAPI, $list: CheerioSelection, ordered: boolean): ListData {
  const items: string[] = [];
  $list.find('> li').each((_, li) => {
    items.push(extractTextWithSpacing($, $(li)));
  });
  return { ordered, items };
}
