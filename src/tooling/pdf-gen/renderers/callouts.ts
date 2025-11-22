// src/tooling/pdf-gen/renderers/callouts.ts
import { colors } from '../utils/colors';
import { getBodyContentX } from '../utils/layout';

export interface CalloutOptions {
  title?: string;
  width?: number;
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
  const { title = 'Example', width = 400 } = options;
  const x = getBodyContentX();
  const padding = 18;
  const borderWidth = 4;

  // Measure content height
  doc.font('Inter-Regular').fontSize(10);
  const contentHeight = doc.heightOfString(content, { width: width - padding * 2 - borderWidth });
  const titleHeight = 18;
  const totalHeight = padding * 2 + titleHeight + contentHeight;

  // Background
  doc
    .rect(x, y, width, totalHeight)
    .fill(colors.lightBlue);

  // Left border
  doc
    .rect(x, y, borderWidth, totalHeight)
    .fill(colors.electricBlue);

  // Title
  doc
    .font('SpaceGrotesk-SemiBold')
    .fontSize(12)
    .fillColor(colors.electricBlue)
    .text(title, x + padding + borderWidth, y + padding, {
      width: width - padding * 2 - borderWidth,
    });

  // Content
  doc
    .font('Inter-Regular')
    .fontSize(10)
    .fillColor(colors.inkBlack)
    .text(content, x + padding + borderWidth, y + padding + titleHeight, {
      width: width - padding * 2 - borderWidth,
      lineGap: 4,
    });

  return y + totalHeight + 24; // Add bottom margin
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
  const { title = 'GM Guidance', width = 400 } = options;
  const x = getBodyContentX();
  const padding = 18;
  const borderWidth = 4;

  // Measure content height
  doc.font('Inter-Regular').fontSize(10);
  const contentHeight = doc.heightOfString(content, { width: width - padding * 2 - borderWidth });
  const titleHeight = 18;
  const totalHeight = padding * 2 + titleHeight + contentHeight;

  // Dark background
  doc
    .rect(x, y, width, totalHeight)
    .fill(colors.darkPurple);

  // Left border (hot pink)
  doc
    .rect(x, y, borderWidth, totalHeight)
    .fill(colors.hotPink);

  // Title
  doc
    .font('SpaceGrotesk-SemiBold')
    .fontSize(12)
    .fillColor(colors.hotPink)
    .text(title, x + padding + borderWidth, y + padding, {
      width: width - padding * 2 - borderWidth,
    });

  // Content (white text on dark background)
  doc
    .font('Inter-Regular')
    .fontSize(10)
    .fillColor(colors.white)
    .text(content, x + padding + borderWidth, y + padding + titleHeight, {
      width: width - padding * 2 - borderWidth,
      lineGap: 4,
    });

  return y + totalHeight + 24; // Add bottom margin
}
