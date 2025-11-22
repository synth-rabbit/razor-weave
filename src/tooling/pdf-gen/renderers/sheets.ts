// src/tooling/pdf-gen/renderers/sheets.ts
import fs from 'fs';
import path from 'path';
import { colors } from '../utils/colors';
import { grid, defaultConfig } from '../utils/layout';
import type { SheetData, ContentBlock, TableData, ListData, HeadingData } from '../types';

// Corner image paths
const CORNER_IMAGES = {
  tl: path.join(process.cwd(), 'src/site/public/images/decorative/corner-tl.png'),
  tr: path.join(process.cwd(), 'src/site/public/images/decorative/corner-tr.png'),
  bl: path.join(process.cwd(), 'src/site/public/images/decorative/corner-bl.png'),
  br: path.join(process.cwd(), 'src/site/public/images/decorative/corner-br.png'),
};

const { pageWidth, pageHeight, margins } = defaultConfig;

/**
 * Render a print-friendly sheet page.
 * Each sheet gets its own page with a styled border and header.
 * Multi-page sheets are supported with continued framing.
 */
export function renderSheet(
  doc: PDFKit.PDFDocument,
  sheet: SheetData
): number {
  const contentX = margins.left + 30;
  const contentWidth = pageWidth - margins.left - margins.right - 60;
  const bottomLimit = pageHeight - margins.bottom - 50;
  let y = margins.top + 25;
  let isFirstPage = true;

  // Draw sheet border/frame
  drawSheetFrame(doc);

  // Render sheet title
  y = renderSheetTitle(doc, sheet.title, y, contentX, contentWidth);

  // Render sheet content blocks
  for (const block of sheet.blocks) {
    // Estimate height needed for this block
    const estimatedHeight = estimateSheetBlockHeight(doc, block, contentWidth);

    // Check if we need a new page
    if (y + estimatedHeight > bottomLimit) {
      // Draw corners on current page before moving to next
      drawSheetCorners(doc);

      doc.addPage();
      drawSheetFrame(doc);
      y = margins.top + 55; // Extra space to clear corner images

      // Add continuation header on subsequent pages
      if (!isFirstPage || true) {
        doc.font('SpaceGrotesk-SemiBold')
          .fontSize(10)
          .fillColor(colors.hotPink)
          .text(`${sheet.title} (continued)`, contentX + 40, y, { width: contentWidth - 80 }); // Inset from corners
        y += 24;
      }
      isFirstPage = false;
    }

    y = renderSheetBlock(doc, block, y, contentX, contentWidth);
  }

  // Draw corners on final page (on top of all content)
  drawSheetCorners(doc);

  return y;
}

/**
 * Estimate the height of a sheet block for page break decisions.
 */
function estimateSheetBlockHeight(
  doc: PDFKit.PDFDocument,
  block: ContentBlock,
  width: number
): number {
  switch (block.type) {
    case 'heading':
      return 30;
    case 'paragraph': {
      doc.font('Inter-Regular').fontSize(10);
      return doc.heightOfString(block.content as string, { width }) + 12;
    }
    case 'table': {
      const table = block.content as TableData;
      return 24 + (table.rows.length * 26) + 12;
    }
    case 'list': {
      const list = block.content as ListData;
      return list.items.length * 18 + 12;
    }
    case 'hr':
      return 24;
    default:
      return 30;
  }
}

/**
 * Draw the sheet frame/border for print-friendly appearance.
 * Corner images are drawn separately at the end via drawSheetCorners().
 */
function drawSheetFrame(doc: PDFKit.PDFDocument): void {
  const frameMargin = 15;
  const frameX = margins.left + frameMargin;
  const frameY = margins.top + frameMargin;
  const frameWidth = pageWidth - margins.left - margins.right - (frameMargin * 2);
  const frameHeight = pageHeight - margins.top - margins.bottom - (frameMargin * 2);

  // Light background for print
  doc.rect(frameX, frameY, frameWidth, frameHeight)
    .fillColor('#fafafa')
    .fill();

  // Border
  doc.rect(frameX, frameY, frameWidth, frameHeight)
    .strokeColor(colors.darkPurple)
    .lineWidth(2)
    .stroke();

  // Inner decorative line
  doc.rect(frameX + 4, frameY + 4, frameWidth - 8, frameHeight - 8)
    .strokeColor(colors.hotPink)
    .lineWidth(0.5)
    .stroke();
}

/**
 * Draw corner images on top of all other sheet content.
 */
function drawSheetCorners(doc: PDFKit.PDFDocument): void {
  const frameMargin = 15;
  const frameX = margins.left + frameMargin;
  const frameY = margins.top + frameMargin;
  const frameWidth = pageWidth - margins.left - margins.right - (frameMargin * 2);
  const frameHeight = pageHeight - margins.top - margins.bottom - (frameMargin * 2);
  const cornerSize = 55;

  // Top-left corner
  if (fs.existsSync(CORNER_IMAGES.tl)) {
    doc.image(CORNER_IMAGES.tl, frameX - 8, frameY - 8, { width: cornerSize });
  }

  // Top-right corner
  if (fs.existsSync(CORNER_IMAGES.tr)) {
    doc.image(CORNER_IMAGES.tr, frameX + frameWidth - cornerSize + 8, frameY - 8, { width: cornerSize });
  }

  // Bottom-left corner
  if (fs.existsSync(CORNER_IMAGES.bl)) {
    doc.image(CORNER_IMAGES.bl, frameX - 8, frameY + frameHeight - cornerSize + 8, { width: cornerSize });
  }

  // Bottom-right corner
  if (fs.existsSync(CORNER_IMAGES.br)) {
    doc.image(CORNER_IMAGES.br, frameX + frameWidth - cornerSize + 8, frameY + frameHeight - cornerSize + 8, { width: cornerSize });
  }
}

/**
 * Render the sheet title.
 */
function renderSheetTitle(
  doc: PDFKit.PDFDocument,
  title: string,
  y: number,
  x: number,
  width: number
): number {
  // Title background bar
  doc.rect(x - 10, y - 5, width + 20, 35)
    .fillColor(colors.darkPurple)
    .fill();

  // Title text
  doc.font('SpaceGrotesk-Bold')
    .fontSize(18)
    .fillColor('#ffffff')
    .text(title.toUpperCase(), x, y + 5, {
      width,
      align: 'center',
    });

  return y + 50;
}

/**
 * Render a content block within a sheet.
 */
function renderSheetBlock(
  doc: PDFKit.PDFDocument,
  block: ContentBlock,
  y: number,
  x: number,
  width: number
): number {
  switch (block.type) {
    case 'heading':
      return renderSheetHeading(doc, block.content as HeadingData, y, x, width);
    case 'paragraph':
      return renderSheetParagraph(doc, block.content as string, y, x, width);
    case 'table':
      return renderSheetTable(doc, block.content as TableData, y, x, width);
    case 'list':
      return renderSheetList(doc, block.content as ListData, y, x, width);
    case 'hr':
      return renderSheetDivider(doc, y, x, width);
    default:
      return y;
  }
}

/**
 * Render a heading within a sheet.
 */
function renderSheetHeading(
  doc: PDFKit.PDFDocument,
  heading: HeadingData,
  y: number,
  x: number,
  width: number
): number {
  const fontSize = heading.level === 3 ? 14 : 12;

  doc.font('SpaceGrotesk-SemiBold')
    .fontSize(fontSize)
    .fillColor(colors.hotPink)
    .text(heading.text, x, y, { width });

  return doc.y + 8;
}

/**
 * Render a paragraph within a sheet.
 */
function renderSheetParagraph(
  doc: PDFKit.PDFDocument,
  text: string,
  y: number,
  x: number,
  width: number
): number {
  doc.font('Inter-Regular')
    .fontSize(10)
    .fillColor('#333333')
    .text(text, x, y, { width });

  return doc.y + 8;
}

/**
 * Render a table within a sheet with print-friendly styling.
 */
function renderSheetTable(
  doc: PDFKit.PDFDocument,
  table: TableData,
  y: number,
  x: number,
  width: number
): number {
  const { headers, rows } = table;
  if (headers.length === 0) return y;

  const colCount = headers.length;
  // Allocate column widths based on content type
  const colWidths = calculateColumnWidths(headers, width);
  const headerHeight = 20;
  const rowHeight = 22;

  // Header row with background
  doc.rect(x, y, width, headerHeight)
    .fillColor(colors.cyan)
    .fill();

  // Header text
  doc.font('SpaceGrotesk-SemiBold')
    .fontSize(8)
    .fillColor('#ffffff');

  let colX = x;
  headers.forEach((header, i) => {
    doc.text(header, colX + 3, y + 5, {
      width: colWidths[i] - 6,
      align: 'left',
      lineBreak: false,
    });
    colX += colWidths[i];
  });

  y += headerHeight;

  // Data rows with alternating backgrounds
  rows.forEach((row, rowIndex) => {
    // Alternating row background
    if (rowIndex % 2 === 0) {
      doc.rect(x, y, width, rowHeight)
        .fillColor('#f5f5f5')
        .fill();
    }

    // Row border
    doc.rect(x, y, width, rowHeight)
      .strokeColor('#dddddd')
      .lineWidth(0.5)
      .stroke();

    // Cell text
    doc.font('Inter-Regular')
      .fontSize(8)
      .fillColor('#333333');

    colX = x;
    row.forEach((cell, colIndex) => {
      // Handle checkbox rendering - keep as brackets for print clarity
      const displayText = cell.replace(/☐/g, '[ ]').replace(/☑/g, '[x]');

      doc.text(displayText, colX + 3, y + 6, {
        width: colWidths[colIndex] - 6,
        align: 'left',
        lineBreak: false,
      });
      colX += colWidths[colIndex];
    });

    y += rowHeight;
  });

  return y + 8;
}

/**
 * Calculate column widths based on header content.
 */
function calculateColumnWidths(headers: string[], totalWidth: number): number[] {
  // Simple heuristic: first column gets more space, rest are equal
  if (headers.length === 1) return [totalWidth];
  if (headers.length === 2) return [totalWidth * 0.4, totalWidth * 0.6];
  if (headers.length === 3) return [totalWidth * 0.15, totalWidth * 0.35, totalWidth * 0.5];
  if (headers.length === 4) return [totalWidth * 0.1, totalWidth * 0.25, totalWidth * 0.3, totalWidth * 0.35];

  // Default: equal widths
  const equalWidth = totalWidth / headers.length;
  return headers.map(() => equalWidth);
}

/**
 * Render a list within a sheet.
 */
function renderSheetList(
  doc: PDFKit.PDFDocument,
  list: ListData,
  y: number,
  x: number,
  width: number
): number {
  doc.font('Inter-Regular')
    .fontSize(9)
    .fillColor('#333333');

  list.items.forEach((item, index) => {
    const bullet = list.ordered ? `${index + 1}.` : '-';
    // Clean any problematic characters from the item text
    const cleanItem = item
      .replace(/◆/g, '-')
      .replace(/%Æ/g, '-')
      .replace(/[^\x20-\x7E\s]/g, ''); // Remove non-ASCII except whitespace
    doc.text(`${bullet} ${cleanItem}`, x + 10, y, { width: width - 20 });
    y = doc.y + 3;
  });

  return y + 6;
}

/**
 * Render a divider line within a sheet.
 */
function renderSheetDivider(
  doc: PDFKit.PDFDocument,
  y: number,
  x: number,
  width: number
): number {
  y += 8;
  doc.moveTo(x, y)
    .lineTo(x + width, y)
    .strokeColor(colors.hotPink)
    .lineWidth(1)
    .stroke();
  return y + 16;
}
