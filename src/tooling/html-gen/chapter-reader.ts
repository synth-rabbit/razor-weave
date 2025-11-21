/**
 * Chapter Reader
 *
 * Reads markdown chapter and sheet files from disk.
 */

import { readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';

export interface ChapterFile {
  number: number;
  slug: string;
  filePath: string;
  content: string;
}

/**
 * Sheet ordering - defines the canonical order for sheets
 */
const SHEET_ORDER = [
  'character_sheet',
  'advancement_tracker',
  'session_log',
  'gm_session_prep',
  'campaign_fronts_sheet',
  'npc_vpc_profile',
  'reference_tags_conditions',
  'reference_clocks_templates',
  'reference_dc_tiers',
];

/**
 * Parse chapter number and slug from filename
 * Input: "08-actions-checks-outcomes.md"
 * Output: { number: 8, slug: "actions-checks-outcomes" }
 */
function parseChapterFilename(filename: string): { number: number; slug: string } | null {
  const match = filename.match(/^(\d+)-(.+)\.md$/);
  if (!match) return null;

  return {
    number: parseInt(match[1], 10),
    slug: match[2],
  };
}

/**
 * Read all chapter files from a directory, sorted by chapter number
 */
export async function readChapters(chaptersDir: string): Promise<ChapterFile[]> {
  const files = await readdir(chaptersDir);

  const chapters: ChapterFile[] = [];

  for (const file of files) {
    if (file === 'README.md') continue;

    const parsed = parseChapterFilename(file);
    if (!parsed) continue;

    const filePath = join(chaptersDir, file);
    const content = await readFile(filePath, 'utf-8');

    chapters.push({
      number: parsed.number,
      slug: parsed.slug,
      filePath,
      content,
    });
  }

  return chapters.sort((a, b) => a.number - b.number);
}

interface SheetWithSortOrder extends ChapterFile {
  _sortOrder: number;
}

/**
 * Read all sheet files from a directory, in canonical order
 */
export async function readSheets(sheetsDir: string): Promise<ChapterFile[]> {
  const files = await readdir(sheetsDir);

  const sheets: SheetWithSortOrder[] = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = join(sheetsDir, file);
    const content = await readFile(filePath, 'utf-8');

    // Extract slug from filename (e.g., "core_rulebook_character_sheet.md" -> "character_sheet")
    const slug = basename(file, '.md').replace(/^core_rulebook_/, '');

    // Find order index
    const orderIndex = SHEET_ORDER.findIndex(s => slug.includes(s));
    const sortOrder = orderIndex >= 0 ? orderIndex : 999;

    sheets.push({
      number: 27 + (sortOrder + 1) / 10, // 27.1, 27.2, etc
      slug,
      filePath,
      content,
      _sortOrder: sortOrder,
    });
  }

  // Sort by canonical order and remove _sortOrder
  return sheets
    .sort((a, b) => a._sortOrder - b._sortOrder)
    .map(({ _sortOrder, ...sheet }) => sheet);
}
