// src/tooling/pdf-gen/pipeline.ts
import fs from 'fs';
import path from 'path';
import { createPDFDocument } from './document';
import { parseHTMLFile, extractChapters } from './parser';
import { renderChapterOpener, renderPartDivider } from './renderers/chapter-opener';
import { renderCoverPage } from './renderers/cover';
import { renderPageFurniture, renderFooter } from './renderers/page-furniture';
import { renderTableOfContents, estimateChapterPages } from './renderers/toc';
import { renderParagraph, renderHeading } from './renderers/text';
import { renderExampleBox, renderGMBox, calculateCalloutHeight } from './renderers/callouts';
import { renderTable } from './renderers/tables';
import { renderSheet } from './renderers/sheets';
import { createPageState, fitsOnPage, getContentStartY, getBodyContentX, grid, defaultConfig } from './utils/layout';
import { colors } from './utils/colors';
import type { ChapterContent, ContentBlock, PageState, TableData, ListData, HeadingData, SheetData } from './types';

/**
 * Add a new content page with footer.
 * Sets font state first, then renders footer to avoid affecting layout calculations.
 */
function addContentPageWithFooter(
  doc: PDFKit.PDFDocument,
  state: PageState
): PageState {
  doc.addPage();
  state.currentPage++;
  state.yPosition = getContentStartY();

  // Establish font state first (content font), then render footer
  doc.font('Inter-Regular').fontSize(11);

  // Render footer after font state is established
  renderFooter(doc, {
    pageNumber: state.currentPage,
    chapterTitle: state.currentChapter,
  });

  // Re-establish cursor position for content
  doc.x = getBodyContentX();
  doc.y = state.yPosition;

  return state;
}

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

  // Render cover page (uses the initial page created by PDFKit)
  const logoPath = path.join(process.cwd(), 'src/site/public/images/logos/main-logo.svg');
  doc.addNamedDestination('cover');
  renderCoverPage(doc, logoPath);
  state.currentPage = 1;

  // Add cover bookmark with destination
  doc.outline.addItem('Cover', { destination: 'cover' });

  // Render Table of Contents
  doc.addPage();
  doc.addNamedDestination('contents');
  state.currentPage++;
  const tocEntries = estimateChapterPages(chapters, state.currentPage + 1);
  renderTableOfContents(doc, tocEntries);
  doc.outline.addItem('Contents', { destination: 'contents' });

  // Part divider configuration: which chapters start each part
  const PART_STARTS: Record<number, { number: string; title: string }> = {
    1: { number: 'I', title: 'Foundations' },
    7: { number: 'II', title: 'Skills, Proficiencies, and Mechanical Reference' },
    18: { number: 'III', title: 'Game Master Section' },
    27: { number: 'IV', title: 'Reference Sheets, Glossary, and Index' },
  };

  // Render chapters (all chapters now add new pages)
  for (const chapter of chapters) {
    // Insert part divider if this chapter starts a new part
    const partInfo = PART_STARTS[chapter.number];
    if (partInfo) {
      renderPartDivider(doc, partInfo.number, partInfo.title);
      state.currentPage++;
      // Part bookmark links to named destination created in renderPartDivider
      doc.outline.addItem(`Part ${partInfo.number}: ${partInfo.title}`, { destination: `part-${partInfo.number}` });
    }

    state = await renderChapter(doc, chapter, state, options, false);
    // Add chapter bookmark linking to named destination created in renderChapterOpener
    doc.outline.addItem(`${chapter.number}. ${chapter.title}`, { destination: `chapter-${chapter.number}` });
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
  options: GeneratePDFOptions,
  isFirstChapter: boolean = false
): Promise<PageState> {
  // Chapter opener page
  if (!options.skipChapterOpeners) {
    // For first chapter, use the initial page created by PDFKit instead of adding a new one
    renderChapterOpener(doc, chapter.number, chapter.title, isFirstChapter);
    state.currentPage++;
  }

  // Start content page with footer
  state.currentChapter = chapter.title;
  state.pageType = 'content';
  state = addContentPageWithFooter(doc, state);

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
    state = addContentPageWithFooter(doc, state);
  }

  const x = getBodyContentX();
  const width = grid.bodyWidth;

  switch (block.type) {
    case 'paragraph':
      state.yPosition = renderParagraphAt(doc, block.content as string, state.yPosition, x, width);
      break;

    case 'example':
      state.yPosition = renderExampleBoxAt(doc, block.content as string, state.yPosition, x, width);
      break;

    case 'gm':
      state.yPosition = renderGMBoxAt(doc, block.content as string, state.yPosition, x, width);
      break;

    case 'table':
      state.yPosition = renderTableAt(doc, block.content as TableData, state.yPosition, x, width);
      break;

    case 'list':
      state.yPosition = renderListAt(doc, block.content as ListData, state.yPosition, x, width);
      break;

    case 'hr':
      state.yPosition = renderHorizontalRuleAt(doc, state.yPosition, x, width);
      break;

    case 'heading': {
      const headingData = block.content as HeadingData;
      state.yPosition = renderHeadingAt(doc, headingData.text, headingData.level, state.yPosition, x, width);
      break;
    }

    case 'sheet': {
      // Sheets get their own page for print-friendly output
      doc.addPage();
      state.currentPage++;
      state.pageType = 'sheet';

      const sheetData = block.content as SheetData;
      state.yPosition = renderSheet(doc, sheetData);

      // After sheet, prepare for next content page if more content follows
      state.pageType = 'content';
      break;
    }
  }

  return state;
}

/**
 * Calculate the actual height of a content block.
 * Uses real measurements for accurate page break decisions.
 */
function estimateBlockHeight(doc: PDFKit.PDFDocument, block: ContentBlock): number {
  switch (block.type) {
    case 'paragraph': {
      // Measure actual paragraph height
      doc.font('Inter-Regular').fontSize(11);
      const text = block.content as string;
      const height = doc.heightOfString(text, { width: grid.bodyWidth });
      return height + 16; // Add spacing
    }
    case 'example':
    case 'gm': {
      // Calculate actual callout height
      const content = block.content as string;
      return calculateCalloutHeight(doc, content);
    }
    case 'table': {
      // Estimate table height based on rows
      const tableData = block.content as TableData;
      const headerHeight = 28;
      const rowHeight = 40; // Generous estimate per row
      return headerHeight + (tableData.rows.length * rowHeight) + 20;
    }
    case 'list': {
      const listData = block.content as ListData;
      return listData.items.length * 24 + 24;
    }
    case 'hr':
      return 40;
    case 'heading': {
      const headingData = block.content as HeadingData;
      // Height includes heading + minimum content to prevent orphans
      // This ensures headings don't appear alone at bottom of page
      const headingHeight = headingData.level === 3 ? 40 : 32;
      const minContentAfter = 120; // Require at least 120pt (~2 paragraphs) after heading
      return headingHeight + minContentAfter;
    }
    case 'sheet':
      // Sheets always get their own page, return large value to force page break
      return 9999;
    default:
      return 50;
  }
}

/**
 * Render paragraph at specific position.
 */
function renderParagraphAt(
  doc: PDFKit.PDFDocument,
  text: string,
  y: number,
  x: number,
  width: number
): number {
  doc
    .font('Inter-Regular')
    .fontSize(11)
    .fillColor(colors.inkBlack)
    .text(text, x, y, {
      width,
      align: 'left',
      lineGap: 4,
    });

  return doc.y + 8; // tighter paragraph spacing
}

/**
 * Render heading at specific position.
 * Reduced margins for tighter vertical rhythm.
 */
function renderHeadingAt(
  doc: PDFKit.PDFDocument,
  text: string,
  level: 3 | 4,
  y: number,
  x: number,
  width: number
): number {
  const configs = {
    3: { font: 'SpaceGrotesk-SemiBold', size: 18, color: colors.hotPink, marginTop: 16 },
    4: { font: 'SpaceGrotesk-Medium', size: 14, color: colors.hotPink, marginTop: 12 },
  };

  const config = configs[level];
  const adjustedY = y + config.marginTop;

  doc
    .font(config.font)
    .fontSize(config.size)
    .fillColor(config.color)
    .text(text, x, adjustedY, { width });

  return doc.y + 6; // Tight spacing after heading
}

/**
 * Render example box at specific position.
 */
function renderExampleBoxAt(
  doc: PDFKit.PDFDocument,
  content: string,
  y: number,
  x: number,
  width: number
): number {
  const padding = 16;
  const borderWidth = 4;
  const titleHeight = 24;
  const topMargin = 12;
  const bottomMargin = 18;

  const textWidth = width - padding * 2 - borderWidth;
  doc.font('Inter-Regular').fontSize(10);
  const contentHeight = doc.heightOfString(content, { width: textWidth, lineGap: 4 });
  const totalHeight = padding * 2 + titleHeight + contentHeight;
  const startY = y + topMargin;

  // Background
  doc.rect(x, startY, width, totalHeight).fill(colors.lightBlue);
  // Left border
  doc.rect(x, startY, borderWidth, totalHeight).fill(colors.electricBlue);
  // Title
  doc.font('SpaceGrotesk-SemiBold').fontSize(12).fillColor(colors.electricBlue)
    .text('Example', x + padding + borderWidth, startY + padding, { width: textWidth, lineBreak: false });
  // Content
  doc.font('Inter-Regular').fontSize(10).fillColor(colors.inkBlack)
    .text(content, x + padding + borderWidth, startY + padding + titleHeight, { width: textWidth, lineGap: 4 });

  return startY + totalHeight + bottomMargin;
}

/**
 * Render GM box at specific position.
 */
function renderGMBoxAt(
  doc: PDFKit.PDFDocument,
  content: string,
  y: number,
  x: number,
  width: number
): number {
  const padding = 16;
  const borderWidth = 4;
  const titleHeight = 24;
  const topMargin = 12;
  const bottomMargin = 18;

  const textWidth = width - padding * 2 - borderWidth;
  doc.font('Inter-Regular').fontSize(10);
  const contentHeight = doc.heightOfString(content, { width: textWidth, lineGap: 4 });
  const totalHeight = padding * 2 + titleHeight + contentHeight;
  const startY = y + topMargin;

  // Dark background
  doc.rect(x, startY, width, totalHeight).fill(colors.darkPurple);
  // Left border
  doc.rect(x, startY, borderWidth, totalHeight).fill(colors.hotPink);
  // Title
  doc.font('SpaceGrotesk-SemiBold').fontSize(12).fillColor(colors.hotPink)
    .text('GM Guidance', x + padding + borderWidth, startY + padding, { width: textWidth, lineBreak: false });
  // Content (white on dark)
  doc.font('Inter-Regular').fontSize(10).fillColor(colors.white)
    .text(content, x + padding + borderWidth, startY + padding + titleHeight, { width: textWidth, lineGap: 4 });

  return startY + totalHeight + bottomMargin;
}

/**
 * Render table at specific position.
 */
function renderTableAt(
  doc: PDFKit.PDFDocument,
  data: TableData,
  y: number,
  x: number,
  width: number
): number {
  const rowHeight = 28;
  const cellPadding = 8;
  const colWidth = width / Math.max(data.headers.length, 1);
  let currentY = y + 12;

  // Header row
  doc.rect(x, currentY, width, rowHeight).fill(colors.electricBlue);
  data.headers.forEach((header, i) => {
    doc.font('SpaceGrotesk-SemiBold').fontSize(10).fillColor(colors.white)
      .text(header, x + i * colWidth + cellPadding, currentY + 8, {
        width: colWidth - cellPadding * 2,
        lineBreak: false,
      });
  });
  currentY += rowHeight;

  // Data rows
  data.rows.forEach((row, rowIndex) => {
    const bgColor = rowIndex % 2 === 0 ? colors.lightGray : colors.white;
    doc.rect(x, currentY, width, rowHeight).fill(bgColor);
    row.forEach((cell, i) => {
      doc.font('Inter-Regular').fontSize(10).fillColor(colors.inkBlack)
        .text(cell, x + i * colWidth + cellPadding, currentY + 8, {
          width: colWidth - cellPadding * 2,
          lineBreak: false,
        });
    });
    currentY += rowHeight;
  });

  return currentY + 12;
}

/**
 * Render list at specific position.
 */
function renderListAt(
  doc: PDFKit.PDFDocument,
  data: ListData,
  y: number,
  x: number,
  width: number
): number {
  let currentY = y + 8;
  const bulletWidth = 20;
  const textWidth = width - bulletWidth - 4;

  data.items.forEach((item, index) => {
    // Set font for measuring and rendering
    doc.font('Inter-Regular').fontSize(11);

    if (data.ordered) {
      // Numbered list - render number in accent color
      doc
        .fillColor(colors.electricBlue)
        .text(`${index + 1}.`, x, currentY, {
          width: bulletWidth,
          align: 'right',
          lineBreak: false,
        });
    } else {
      // Draw a small diamond bullet
      const diamondSize = 4;
      const diamondX = x + 8;
      const diamondY = currentY + 6;
      doc
        .save()
        .fillColor(colors.electricBlue)
        .moveTo(diamondX, diamondY - diamondSize)
        .lineTo(diamondX + diamondSize, diamondY)
        .lineTo(diamondX, diamondY + diamondSize)
        .lineTo(diamondX - diamondSize, diamondY)
        .closePath()
        .fill()
        .restore();
    }

    // Item text - render at fixed position after bullet
    doc
      .font('Inter-Regular')
      .fontSize(11)
      .fillColor(colors.inkBlack)
      .text(item, x + bulletWidth + 4, currentY, {
        width: textWidth,
        lineGap: 2,
      });

    currentY = doc.y + 6; // Space between items
  });

  return currentY + 8; // Bottom margin
}

/**
 * Render a horizontal rule at specific position.
 */
function renderHorizontalRuleAt(
  doc: PDFKit.PDFDocument,
  y: number,
  x: number,
  width: number
): number {
  const topMargin = 16;
  const bottomMargin = 16;
  const ruleY = y + topMargin;

  doc
    .save()
    .strokeColor(colors.hotPink)
    .opacity(0.5)
    .lineWidth(1.5)
    .moveTo(x, ruleY)
    .lineTo(x + width, ruleY)
    .stroke()
    .restore();

  return ruleY + bottomMargin;
}
