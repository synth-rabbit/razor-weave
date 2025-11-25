// src/tooling/pdf-gen/renderers/toc.ts
import { colors } from '../utils/colors';
import { defaultConfig } from '../utils/layout';
import type { ChapterContent } from '../types';

export interface TOCEntry {
  number: number;
  title: string;
  pageNumber: number;
}

/**
 * Render a Table of Contents page.
 */
export function renderTableOfContents(
  doc: PDFKit.PDFDocument,
  entries: TOCEntry[]
): void {
  const { pageWidth, pageHeight, margins } = defaultConfig;
  const contentWidth = pageWidth - margins.left - margins.right;

  // Dark background like chapter openers
  const gradient = doc.linearGradient(0, 0, 0, pageHeight);
  gradient.stop(0, colors.darkPurple);
  gradient.stop(1, colors.black);
  doc.rect(0, 0, pageWidth, pageHeight).fill(gradient);

  // Title
  let y = margins.top + 40;
  doc
    .font('SpaceGrotesk-Bold')
    .fontSize(36)
    .fillColor(colors.white)
    .text('CONTENTS', margins.left, y, {
      width: contentWidth,
      align: 'center',
    });

  // Gradient line under title
  y = doc.y + 20;
  const lineGradient = doc.linearGradient(margins.left, y, margins.left + contentWidth, y);
  lineGradient.stop(0, colors.electricBlue);
  lineGradient.stop(0.5, colors.hotPink);
  lineGradient.stop(1, colors.deepPurple);
  doc
    .rect(margins.left, y, contentWidth, 3)
    .fill(lineGradient);

  // TOC entries
  y += 40;
  const entryHeight = 28;
  const numberWidth = 40;
  const dotWidth = 20;

  for (const entry of entries) {
    // Check if we need a new page
    if (y + entryHeight > pageHeight - margins.bottom) {
      doc.addPage();
      // Create fresh gradient for new page (gradients can't be reused across pages)
      const newPageGradient = doc.linearGradient(0, 0, 0, pageHeight);
      newPageGradient.stop(0, colors.darkPurple);
      newPageGradient.stop(1, colors.black);
      doc.rect(0, 0, pageWidth, pageHeight).fill(newPageGradient);
      y = margins.top;
    }

    // Destination name for this chapter
    const destinationName = `chapter-${entry.number}`;

    // Chapter number (clickable)
    doc
      .font('SpaceGrotesk-Bold')
      .fontSize(14)
      .fillColor(colors.electricBlue)
      .text(`${entry.number}.`, margins.left, y, {
        width: numberWidth,
        align: 'left',
        goTo: destinationName,
      });

    // Chapter title (clickable)
    const titleX = margins.left + numberWidth;
    const pageNumWidth = 50;
    const titleWidth = contentWidth - numberWidth - pageNumWidth - dotWidth;

    doc
      .font('SpaceGrotesk-SemiBold')
      .fontSize(14)
      .fillColor(colors.white)
      .text(entry.title, titleX, y, {
        width: titleWidth,
        align: 'left',
        lineBreak: false,
        goTo: destinationName,
      });

    // Dotted leader
    const titleEndX = titleX + titleWidth;
    const dotsY = y + 10;
    doc
      .strokeColor(colors.mediumGray)
      .opacity(0.5)
      .lineWidth(0.5);

    for (let dotX = titleEndX + 5; dotX < margins.left + contentWidth - pageNumWidth - 10; dotX += 8) {
      doc.circle(dotX, dotsY, 1).fill(colors.mediumGray);
    }
    doc.opacity(1);

    // Page number (clickable)
    doc
      .font('Inter-Regular')
      .fontSize(12)
      .fillColor(colors.hotPink)
      .text(String(entry.pageNumber), margins.left + contentWidth - pageNumWidth, y + 1, {
        width: pageNumWidth,
        align: 'right',
        goTo: destinationName,
      });

    y += entryHeight;
  }
}

/**
 * Calculate estimated page numbers for chapters.
 * This is called before rendering to estimate where chapters will land.
 */
export function estimateChapterPages(
  chapters: ChapterContent[],
  startPage: number = 3  // After cover and TOC
): TOCEntry[] {
  // Each chapter has:
  // - 1 chapter opener page
  // - Estimated content pages based on section count

  // Estimate TOC pages needed (27 entries at ~28px each, ~680px content area = ~24 entries per page)
  const tocEntriesPerPage = 24;
  const tocPagesNeeded = Math.ceil(chapters.length / tocEntriesPerPage);

  const entries: TOCEntry[] = [];
  // Start page accounts for cover (1) + TOC pages
  let currentPage = 1 + tocPagesNeeded;

  for (const chapter of chapters) {
    // Chapter opener page
    currentPage += 1;

    entries.push({
      number: chapter.number,
      title: chapter.title,
      pageNumber: currentPage,
    });

    // Estimate content pages (rough: ~8 content blocks per page, minimum 1)
    const contentBlocks = chapter.sections.reduce((sum, s) => sum + s.content.length, 0);
    const estimatedContentPages = Math.max(1, Math.ceil(contentBlocks / 8));
    currentPage += estimatedContentPages;
  }

  return entries;
}
