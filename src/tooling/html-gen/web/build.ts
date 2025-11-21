/**
 * Web Reader Build Pipeline
 *
 * Orchestrates the full build process:
 * 1. Read chapters and sheets
 * 2. Hash sources, check if rebuild needed
 * 3. Apply transforms (example blocks, GM boxes, web IDs)
 * 4. Generate TOC
 * 5. Assemble with template
 * 6. Write output and record build
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import type Database from 'better-sqlite3';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

import { readChapters, readSheets, type ChapterFile, type SheetFile } from '../chapter-reader.js';
import { hashFile, hashFiles } from '../hasher.js';
import { HtmlBuildClient } from '../build-client.js';
import { remarkExampleBlocks, remarkGmBoxes, remarkWebIds } from '../transforms/index.js';
import { generateToc, renderTocHtml } from '../toc-generator.js';
import { assembleContent, type ChapterHtml, type SheetHtml } from '../assembler.js';

export interface BuildOptions {
  bookPath: string;
  chaptersDir: string;
  sheetsDir: string;
  outputPath: string;
  templatePath: string;
  db: Database.Database;
  force?: boolean;
}

export interface BuildResult {
  status: 'success' | 'skipped' | 'failed';
  buildId?: string;
  outputPath: string;
  chapterCount?: number;
  sheetCount?: number;
  reason?: string;
}

/**
 * Strip YAML frontmatter from AST
 */
function remarkStripFrontmatter() {
  return (tree: Root) => {
    visit(tree, 'yaml', (_node, index, parent) => {
      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1);
        return index;
      }
    });
  };
}

/**
 * Replace underscore fill sequences with styled form field spans
 */
function replaceUnderscoreFills(html: string): string {
  return html.replace(/_{3,}/g, (match) => {
    const len = match.length;
    let sizeClass = 'fill-sm';
    if (len >= 31) sizeClass = 'fill-full';
    else if (len >= 17) sizeClass = 'fill-lg';
    else if (len >= 9) sizeClass = 'fill-md';
    return `<span class="fill-line ${sizeClass}"></span>`;
  });
}

/**
 * Extract title from chapter content
 */
function extractTitle(content: string): string {
  const match = content.match(/^##\s*\d+\.\s*(.+)$/m);
  return match ? match[1].trim() : '';
}

/**
 * Generate build ID
 */
function generateBuildId(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, '');
  const random = Math.random().toString(36).substring(2, 8);
  return `build-${timestamp}-${random}`;
}

/**
 * Process single chapter through transform pipeline
 */
async function processChapter(chapter: ChapterFile): Promise<ChapterHtml> {
  const pipeline = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkStripFrontmatter)
    .use(remarkGfm)
    .use(remarkExampleBlocks)
    .use(remarkGmBoxes)
    .use(remarkWebIds, {
      chapterNumber: chapter.number,
      chapterSlug: chapter.slug,
    })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const result = await pipeline.process(chapter.content);

  return {
    number: chapter.number,
    slug: chapter.slug,
    html: String(result),
  };
}

/**
 * Process single sheet through transform pipeline
 */
async function processSheet(sheet: SheetFile): Promise<SheetHtml> {
  const pipeline = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkStripFrontmatter)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const result = await pipeline.process(sheet.content);

  return {
    slug: sheet.slug,
    html: replaceUnderscoreFills(String(result)),
  };
}

/**
 * Build web reader HTML
 */
export async function buildWebReader(options: BuildOptions): Promise<BuildResult> {
  const { bookPath, chaptersDir, sheetsDir, outputPath, templatePath, db, force } = options;
  const buildClient = new HtmlBuildClient(db);
  const buildId = generateBuildId();

  try {
    // 1. Read source files
    const chapters = await readChapters(chaptersDir);
    const sheets = await readSheets(sheetsDir);

    // 2. Calculate source hash
    const allPaths = [
      ...chapters.map(c => c.filePath),
      ...sheets.map(s => s.filePath),
    ];
    const sourceHash = await hashFiles(allPaths);

    // 3. Check if rebuild needed
    if (!force) {
      const latestBuild = buildClient.getLatestBuild('web-reader');
      if (latestBuild && latestBuild.sourceHash === sourceHash) {
        return {
          status: 'skipped',
          outputPath,
          reason: 'Sources unchanged since last build',
        };
      }
    }

    // 4. Process chapters
    const processedChapters: ChapterHtml[] = [];
    for (const chapter of chapters) {
      const processed = await processChapter(chapter);
      processedChapters.push(processed);
    }

    // 5. Process sheets
    const processedSheets: SheetHtml[] = [];
    for (const sheet of sheets) {
      const processed = await processSheet(sheet);
      processedSheets.push(processed);
    }

    // 6. Generate TOC
    const tocData = chapters.map(c => ({
      number: c.number,
      title: extractTitle(c.content),
      slug: c.slug,
    }));
    const toc = generateToc(tocData);
    const tocHtml = renderTocHtml(toc);

    // 7. Assemble content
    const contentHtml = assembleContent({
      chapters: processedChapters,
      sheets: processedSheets,
      partIntros: new Map(),
    });

    // 8. Merge with template
    const template = await readFile(templatePath, 'utf-8');
    const finalHtml = template
      .replace('{{TOC}}', tocHtml)
      .replace('{{CONTENT}}', contentHtml);

    // 9. Write output
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, finalHtml, 'utf-8');

    // 10. Record build with source hashes
    const sources: Array<{
      filePath: string;
      contentHash: string;
      fileType: 'chapter' | 'sheet';
    }> = [];

    for (const chapter of chapters) {
      sources.push({
        filePath: chapter.filePath,
        contentHash: await hashFile(chapter.filePath),
        fileType: 'chapter',
      });
    }

    for (const sheet of sheets) {
      sources.push({
        filePath: sheet.filePath,
        contentHash: await hashFile(sheet.filePath),
        fileType: 'sheet',
      });
    }

    const recordedBuildId = buildClient.createBuild({
      outputType: 'web-reader',
      bookPath,
      outputPath,
      sourceHash,
      sources,
    });

    return {
      status: 'success',
      buildId: recordedBuildId,
      outputPath,
      chapterCount: chapters.length,
      sheetCount: sheets.length,
    };
  } catch (error) {
    return {
      status: 'failed',
      buildId,
      outputPath,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
