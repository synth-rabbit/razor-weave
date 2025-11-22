// src/tooling/pdf-gen/pipeline.ts
import fs from 'fs';
import path from 'path';
import { createPDFDocument } from './document';
import { parseHTMLFile, extractChapters } from './parser';
import { renderChapterOpener } from './renderers/chapter-opener';
import { renderParagraph } from './renderers/text';
import { renderExampleBox, renderGMBox } from './renderers/callouts';
import { renderTable } from './renderers/tables';
import { createPageState, fitsOnPage, getContentStartY, getBodyContentX, grid } from './utils/layout';
import { colors } from './utils/colors';
import type { ChapterContent, ContentBlock, PageState, TableData, ListData } from './types';

export interface GeneratePDFOptions {
  title?: string;
  author?: string;
  skipChapterOpeners?: boolean;
}

/**
 * Generate a PDF from HTML source.
 */
export async function generatePDF(
  htmlPath: string,
  outputPath: string,
  options: GeneratePDFOptions = {}
): Promise<void> {
  const { title = 'Razorweave Core Rulebook', author = 'Panda Edwards' } = options;

  // Parse HTML
  const $ = await parseHTMLFile(htmlPath);
  const chapters = extractChapters($);

  // Create PDF document
  const doc = createPDFDocument({ title, author });

  // Create output stream
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Initialize page state
  let state = createPageState();

  // Render chapters
  for (const chapter of chapters) {
    state = await renderChapter(doc, chapter, state, options);
  }

  // Finalize document
  doc.end();

  // Wait for stream to finish
  await new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

/**
 * Render a single chapter.
 */
async function renderChapter(
  doc: PDFKit.PDFDocument,
  chapter: ChapterContent,
  state: PageState,
  options: GeneratePDFOptions
): Promise<PageState> {
  // Chapter opener page
  if (!options.skipChapterOpeners) {
    renderChapterOpener(doc, chapter.number, chapter.title);
    state.currentPage++;
  }

  // Start content page
  doc.addPage();
  state.currentPage++;
  state.yPosition = getContentStartY();
  state.currentChapter = chapter.title;
  state.pageType = 'content';

  // Render sections
  for (const section of chapter.sections) {
    state = renderSection(doc, section, state);
  }

  return state;
}

/**
 * Render a section within a chapter.
 */
function renderSection(
  doc: PDFKit.PDFDocument,
  section: { level: number; title: string; content: ContentBlock[] },
  state: PageState
): PageState {
  // Render content blocks
  for (const block of section.content) {
    state = renderContentBlock(doc, block, state);
  }

  return state;
}

/**
 * Render a single content block.
 */
function renderContentBlock(
  doc: PDFKit.PDFDocument,
  block: ContentBlock,
  state: PageState
): PageState {
  // Check if we need a new page
  const estimatedHeight = estimateBlockHeight(doc, block);
  if (!fitsOnPage(state, estimatedHeight)) {
    doc.addPage();
    state.currentPage++;
    state.yPosition = getContentStartY();
  }

  switch (block.type) {
    case 'paragraph':
      state.yPosition = renderParagraph(doc, block.content as string, state.yPosition);
      break;

    case 'example':
      state.yPosition = renderExampleBox(doc, block.content as string, state.yPosition);
      break;

    case 'gm':
      state.yPosition = renderGMBox(doc, block.content as string, state.yPosition);
      break;

    case 'table':
      state.yPosition = renderTable(doc, block.content as TableData, state.yPosition);
      break;

    case 'list':
      state.yPosition = renderList(doc, block.content as ListData, state.yPosition);
      break;

    case 'hr':
      state.yPosition = renderHorizontalRule(doc, state.yPosition);
      break;
  }

  return state;
}

/**
 * Estimate the height of a content block.
 */
function estimateBlockHeight(_doc: PDFKit.PDFDocument, block: ContentBlock): number {
  // Rough estimates - can be refined
  switch (block.type) {
    case 'paragraph':
      return 60;
    case 'example':
    case 'gm':
      return 120;
    case 'table':
      return 150;
    case 'list':
      return 80;
    case 'hr':
      return 40;
    default:
      return 50;
  }
}

/**
 * Render a list.
 */
function renderList(
  doc: PDFKit.PDFDocument,
  data: ListData,
  y: number
): number {
  const x = getBodyContentX();
  let currentY = y;

  doc.font('Inter-Regular').fontSize(11).fillColor(colors.inkBlack);

  data.items.forEach((item, index) => {
    const bullet = data.ordered ? `${index + 1}.` : '\u25C6'; // Diamond for unordered
    const bulletWidth = 24;

    // Bullet
    doc
      .fillColor(colors.electricBlue)
      .text(bullet, x, currentY, { width: bulletWidth });

    // Item text
    doc
      .fillColor(colors.inkBlack)
      .text(item, x + bulletWidth, currentY, { width: grid.bodyWidth - bulletWidth });

    currentY = doc.y + 4;
  });

  return currentY + 11;
}

/**
 * Render a horizontal rule.
 */
function renderHorizontalRule(
  doc: PDFKit.PDFDocument,
  y: number
): number {
  const x = getBodyContentX();
  const ruleY = y + 18;

  doc
    .strokeColor(colors.hotPink)
    .opacity(0.6)
    .lineWidth(2)
    .moveTo(x, ruleY)
    .lineTo(x + grid.bodyWidth, ruleY)
    .stroke()
    .opacity(1);

  return ruleY + 18;
}
