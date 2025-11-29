/**
 * Print Build Orchestrator
 *
 * Coordinates the full build pipeline for print-design HTML.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

import type Database from 'better-sqlite3';
import { readChapters, readSheets } from '../chapter-reader.js';
import { hashFile, hashFiles } from '../hasher.js';
import { generateToc, renderTocHtml } from '../toc-generator.js';
import { HtmlBuildClient } from '../build-client.js';
import { assembleContent, type ChapterHtml, type SheetHtml } from '../assembler.js';
import { renderTemplate, type TemplateVars } from '../template-renderer.js';
import { remarkExampleBlocks, remarkGmBoxes, remarkSemanticIds } from '../transforms/index.js';

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

export interface BuildOptions {
  bookPath: string;
  chaptersDir: string;
  sheetsDir: string;
  outputPath: string;
  db?: Database.Database;
}

export interface BuildResult {
  success: boolean;
  buildId: string;
  outputPath: string;
  sourceHash: string;
  chapterCount: number;
  sheetCount: number;
  error?: string;
}

/**
 * Create the markdown processing pipeline with print-specific transforms
 */
function createPrintPipeline() {
  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])  // Parse frontmatter
    .use(remarkStripFrontmatter)        // Remove it from output
    .use(remarkGfm)
    .use(remarkExampleBlocks)
    .use(remarkGmBoxes)
    .use(remarkSemanticIds)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true });
}

/**
 * Replace underscore fill sequences with styled form field spans
 * Width varies based on underscore count:
 * - 3-8 underscores: small (names, short labels)
 * - 9-16 underscores: medium (phrases)
 * - 17-30 underscores: large (sentences)
 * - 31+ underscores: full width (paragraphs)
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
 * Handles multiple formats:
 * - ## N. Title (standard h2)
 * - # N. Title (h1 with number-dot)
 * - # Chapter N: Title (h1 with "Chapter N:" prefix)
 */
function extractTitle(content: string, fallback: string): string {
  // Try ## N. Title format first
  let match = content.match(/^##\s*\d+\.\s*(.+)$/m);
  if (match) return match[1].trim();

  // Try # N. Title format (h1 with number-dot)
  match = content.match(/^#\s*\d+\.\s*(.+)$/m);
  if (match) return match[1].trim();

  // Try # Chapter N: Title format
  match = content.match(/^#\s*Chapter\s+\d+:\s*(.+)$/m);
  if (match) return match[1].trim();

  return fallback;
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
 * Get template path relative to this module
 */
function getTemplatePath(): string {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  return join(__dirname, '../templates/print-design.html');
}

/**
 * Build print-design HTML from markdown sources
 */
export async function buildPrintHtml(options: BuildOptions): Promise<BuildResult> {
  const buildId = generateBuildId();
  const pipeline = createPrintPipeline();

  try {
    // Read source files
    const chapters = await readChapters(options.chaptersDir);
    const sheets = await readSheets(options.sheetsDir);

    // Calculate source hash
    const allPaths = [
      ...chapters.map(c => c.filePath),
      ...sheets.map(s => s.filePath),
    ];
    const sourceHash = await hashFiles(allPaths);

    // Process chapters
    const processedChapters: ChapterHtml[] = [];
    for (const chapter of chapters) {
      const result = await pipeline.process(chapter.content);
      processedChapters.push({
        number: chapter.number,
        slug: chapter.slug,
        html: String(result),
      });
    }

    // Process sheets (with underscore fill replacement)
    const processedSheets: SheetHtml[] = [];
    for (const sheet of sheets) {
      const result = await pipeline.process(sheet.content);
      processedSheets.push({
        slug: sheet.slug,
        html: replaceUnderscoreFills(String(result)),
      });
    }

    // Generate TOC
    const tocEntries = generateToc(
      processedChapters.map(c => ({
        number: c.number,
        title: extractTitle(chapters.find(ch => ch.number === c.number)?.content || '', c.slug),
        slug: c.slug,
      }))
    );
    const tocHtml = renderTocHtml(tocEntries);

    // Assemble content
    const assembledContent = assembleContent({
      chapters: processedChapters,
      sheets: processedSheets,
      partIntros: new Map(), // TODO: Add part intro support
    });

    // Load template
    let template: string;
    try {
      template = await readFile(getTemplatePath(), 'utf-8');
    } catch {
      // Fallback minimal template for testing
      template = `<!DOCTYPE html>
<html><head><title>{{title}} - {{subtitle}}</title></head>
<body>
<nav><ul class="toc-root">{{toc}}</ul></nav>
<main>{{content}}</main>
</body></html>`;
    }

    // Render final HTML
    const vars: TemplateVars = {
      title: 'RAZORWEAVE',
      subtitle: 'Core Rulebook',
      author: 'Panda Edwards',
      toc: tocHtml,
      content: assembledContent,
    };
    const finalHtml = renderTemplate(template, vars);

    // Ensure output directory exists
    await mkdir(dirname(options.outputPath), { recursive: true });

    // Write output
    await writeFile(options.outputPath, finalHtml, 'utf-8');

    // Record build to database if provided
    if (options.db) {
      const buildClient = new HtmlBuildClient(options.db);

      // Hash individual files for source tracking
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

      buildClient.createBuild({
        outputType: 'print-design',
        bookPath: options.bookPath,
        outputPath: options.outputPath,
        sourceHash,
        sources,
      });
    }

    return {
      success: true,
      buildId,
      outputPath: options.outputPath,
      sourceHash,
      chapterCount: chapters.length,
      sheetCount: sheets.length,
    };
  } catch (error) {
    return {
      success: false,
      buildId,
      outputPath: options.outputPath,
      sourceHash: '',
      chapterCount: 0,
      sheetCount: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
