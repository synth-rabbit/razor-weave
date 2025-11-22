// src/tooling/pdf-gen/renderers/callouts.ts
import { colors } from '../utils/colors';
import { getBodyContentX, defaultConfig, grid } from '../utils/layout';

export interface CalloutOptions {
  title?: string;
  width?: number;
}

// Use body width for consistent margins, with comfortable padding
const CALLOUT_PADDING = 16;
const CALLOUT_BORDER_WIDTH = 4;
const CALLOUT_TITLE_HEIGHT = 24;
const CALLOUT_WIDTH = grid.bodyWidth; // 336px - fits within body area
const CALLOUT_BOTTOM_MARGIN = 18;
const CALLOUT_TOP_MARGIN = 12;

/**
 * Calculate the total height of a callout box.
 * Includes top margin, padding, title, content, and bottom margin.
 */
export function calculateCalloutHeight(
  doc: PDFKit.PDFDocument,
  content: string,
  width: number = CALLOUT_WIDTH
): number {
  const textWidth = width - CALLOUT_PADDING * 2 - CALLOUT_BORDER_WIDTH;
  doc.font('Inter-Regular').fontSize(10);
  const contentHeight = doc.heightOfString(content, {
    width: textWidth,
    lineGap: 4,
  });
  return CALLOUT_TOP_MARGIN + CALLOUT_PADDING * 2 + CALLOUT_TITLE_HEIGHT + contentHeight + CALLOUT_BOTTOM_MARGIN;
}

/**
 * Get maximum content height that fits on a page.
 */
export function getMaxCalloutContentHeight(): number {
  const pageAvailable = defaultConfig.pageHeight - defaultConfig.margins.top - defaultConfig.margins.bottom;
  return pageAvailable - CALLOUT_PADDING * 2 - CALLOUT_TITLE_HEIGHT - CALLOUT_BOTTOM_MARGIN;
}

/**
 * Render an Example box (blue accent, light background).
 */
export function renderExampleBox(
  doc: PDFKit.PDFDocument,
  content: string,
  y: number,
  options: CalloutOptions = {}
): number {
  const { title = 'Example', width = CALLOUT_WIDTH } = options;
  const x = getBodyContentX();

  // Calculate text width (account for border and padding)
  const textWidth = width - CALLOUT_PADDING * 2 - CALLOUT_BORDER_WIDTH;

  // Measure content height with proper font
  doc.font('Inter-Regular').fontSize(10);
  const contentHeight = doc.heightOfString(content, {
    width: textWidth,
    lineGap: 4,
  });
  const totalHeight = CALLOUT_PADDING * 2 + CALLOUT_TITLE_HEIGHT + contentHeight;

  // Add top margin
  const startY = y + CALLOUT_TOP_MARGIN;

  // Background
  doc
    .rect(x, startY, width, totalHeight)
    .fill(colors.lightBlue);

  // Left border
  doc
    .rect(x, startY, CALLOUT_BORDER_WIDTH, totalHeight)
    .fill(colors.electricBlue);

  // Title
  doc
    .font('SpaceGrotesk-SemiBold')
    .fontSize(12)
    .fillColor(colors.electricBlue)
    .text(title, x + CALLOUT_PADDING + CALLOUT_BORDER_WIDTH, startY + CALLOUT_PADDING, {
      width: textWidth,
      lineBreak: false,
    });

  // Content
  doc
    .font('Inter-Regular')
    .fontSize(10)
    .fillColor(colors.inkBlack)
    .text(content, x + CALLOUT_PADDING + CALLOUT_BORDER_WIDTH, startY + CALLOUT_PADDING + CALLOUT_TITLE_HEIGHT, {
      width: textWidth,
      lineGap: 4,
    });

  return startY + totalHeight + CALLOUT_BOTTOM_MARGIN;
}

/**
 * Render a GM Guidance box (pink accent, dark background).
 */
export function renderGMBox(
  doc: PDFKit.PDFDocument,
  content: string,
  y: number,
  options: CalloutOptions = {}
): number {
  const { title = 'GM Guidance', width = CALLOUT_WIDTH } = options;
  const x = getBodyContentX();

  // Calculate text width (account for border and padding)
  const textWidth = width - CALLOUT_PADDING * 2 - CALLOUT_BORDER_WIDTH;

  // Measure content height with proper font
  doc.font('Inter-Regular').fontSize(10);
  const contentHeight = doc.heightOfString(content, {
    width: textWidth,
    lineGap: 4,
  });
  const totalHeight = CALLOUT_PADDING * 2 + CALLOUT_TITLE_HEIGHT + contentHeight;

  // Add top margin
  const startY = y + CALLOUT_TOP_MARGIN;

  // Dark background
  doc
    .rect(x, startY, width, totalHeight)
    .fill(colors.darkPurple);

  // Left border (hot pink)
  doc
    .rect(x, startY, CALLOUT_BORDER_WIDTH, totalHeight)
    .fill(colors.hotPink);

  // Title
  doc
    .font('SpaceGrotesk-SemiBold')
    .fontSize(12)
    .fillColor(colors.hotPink)
    .text(title, x + CALLOUT_PADDING + CALLOUT_BORDER_WIDTH, startY + CALLOUT_PADDING, {
      width: textWidth,
      lineBreak: false,
    });

  // Content (white text on dark background)
  doc
    .font('Inter-Regular')
    .fontSize(10)
    .fillColor(colors.white)
    .text(content, x + CALLOUT_PADDING + CALLOUT_BORDER_WIDTH, startY + CALLOUT_PADDING + CALLOUT_TITLE_HEIGHT, {
      width: textWidth,
      lineGap: 4,
    });

  return startY + totalHeight + CALLOUT_BOTTOM_MARGIN;
}
