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

import { readChapters, readSheets } from '../chapter-reader.js';
import { hashFiles } from '../hasher.js';
import { generateToc, renderTocHtml } from '../toc-generator.js';
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
  skipDatabase?: boolean;
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
 * Extract title from chapter content
 */
function extractTitle(content: string, fallback: string): string {
  const match = content.match(/^##\s*\d+\.\s*(.+)$/m);
  return match ? match[1].trim() : fallback;
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

    // Process sheets
    const processedSheets: SheetHtml[] = [];
    for (const sheet of sheets) {
      const result = await pipeline.process(sheet.content);
      processedSheets.push({
        slug: sheet.slug,
        html: String(result),
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
