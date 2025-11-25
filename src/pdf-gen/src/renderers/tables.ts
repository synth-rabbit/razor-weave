// src/tooling/pdf-gen/renderers/tables.ts
import { colors } from '../utils/colors';
import { getBodyContentX } from '../utils/layout';
import type { TableData } from '../types';

export interface TableOptions {
  width?: number;
  cellPadding?: { x: number; y: number };
}

/**
 * Render a table with alternating header colors.
 */
export function renderTable(
  doc: PDFKit.PDFDocument,
  data: TableData,
  y: number,
  options: TableOptions = {}
): number {
  const { width = 400, cellPadding = { x: 12, y: 8 } } = options;
  const x = getBodyContentX();

  const columnCount = data.headers.length || (data.rows[0]?.length ?? 0);
  if (columnCount === 0) return y;

  const columnWidth = width / columnCount;
  const headerColors = [colors.electricBlue, colors.hotPink];
  let currentY = y;

  // Render header row
  if (data.headers.length > 0) {
    const headerHeight = 28;

    data.headers.forEach((header, i) => {
      const cellX = x + i * columnWidth;
      const bgColor = headerColors[i % headerColors.length];

      // Header cell background
      doc
        .rect(cellX, currentY, columnWidth, headerHeight)
        .fill(bgColor);

      // Header text
      doc
        .font('SpaceGrotesk-SemiBold')
        .fontSize(10)
        .fillColor(colors.white)
        .text(header, cellX + cellPadding.x, currentY + cellPadding.y, {
          width: columnWidth - cellPadding.x * 2,
          height: headerHeight - cellPadding.y * 2,
        });
    });

    currentY += headerHeight;
  }

  // Render data rows
  data.rows.forEach((row, rowIndex) => {
    // Calculate row height based on content
    doc.font('Inter-Regular').fontSize(10);
    let maxHeight = 24;

    row.forEach((cell) => {
      const cellHeight = doc.heightOfString(cell, {
        width: columnWidth - cellPadding.x * 2,
      }) + cellPadding.y * 2;
      maxHeight = Math.max(maxHeight, cellHeight);
    });

    // Alternating row background
    const rowBg = rowIndex % 2 === 0 ? colors.white : colors.lightGray;
    doc
      .rect(x, currentY, width, maxHeight)
      .fill(rowBg);

    // Cell borders
    doc
      .rect(x, currentY, width, maxHeight)
      .stroke(colors.borderGray);

    // Cell content
    row.forEach((cell, i) => {
      const cellX = x + i * columnWidth;

      doc
        .font('Inter-Regular')
        .fontSize(10)
        .fillColor(colors.inkBlack)
        .text(cell, cellX + cellPadding.x, currentY + cellPadding.y, {
          width: columnWidth - cellPadding.x * 2,
        });
    });

    currentY += maxHeight;
  });

  return currentY + 18; // Add bottom margin
}
