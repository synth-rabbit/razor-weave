// src/tooling/pdf-gen/renderers/page-furniture.ts
import { colors } from '../utils/colors';
import { defaultConfig } from '../utils/layout';

export interface PageFurnitureOptions {
  chapterTitle?: string;
  pageNumber: number;
  isLeftPage?: boolean;
}

/**
 * Render page header with chapter title.
 */
export function renderHeader(
  _doc: PDFKit.PDFDocument,
  _options: PageFurnitureOptions
): void {
  // Temporarily disabled for debugging
  return;
}

/**
 * Render page footer with page number.
 * Uses simple text placement to avoid triggering auto-pagination.
 */
export function renderFooter(
  doc: PDFKit.PDFDocument,
  options: PageFurnitureOptions
): void {
  const { pageNumber, isLeftPage = pageNumber % 2 === 0 } = options;
  const { pageWidth, pageHeight, margins } = defaultConfig;

  // Skip footer for page 1 (cover) and page 2 (TOC)
  if (pageNumber <= 2) return;

  // Save cursor position
  const savedX = doc.x;
  const savedY = doc.y;

  doc.save();

  const footerY = pageHeight - margins.bottom + 12;
  const pageStr = String(pageNumber);

  doc
    .font('Inter-Regular')
    .fontSize(9)
    .fillColor(colors.mediumGray);

  // Use simple text call with explicit positioning and no auto-pagination
  const textX = isLeftPage
    ? margins.left
    : pageWidth - margins.right - doc.widthOfString(pageStr);

  // Direct text placement at exact position
  doc.text(pageStr, textX, footerY, {
    lineBreak: false,
    continued: false,
  });

  doc.restore();

  // Explicitly restore cursor position
  doc.x = savedX;
  doc.y = savedY;
}

/**
 * Render both header and footer for a content page.
 * Saves and restores state to avoid affecting subsequent content.
 */
export function renderPageFurniture(
  doc: PDFKit.PDFDocument,
  options: PageFurnitureOptions
): void {
  // Save state before rendering furniture
  const savedX = doc.x;
  const savedY = doc.y;
  doc.save();

  renderHeader(doc, options);
  renderFooter(doc, options);

  // Restore state after rendering
  doc.restore();
  doc.x = savedX;
  doc.y = savedY;
}
