// src/tooling/pdf-gen/graphics/grid-background.ts
import { colors } from '../utils/colors';
import { defaultConfig } from '../utils/layout';

/**
 * Draw a perspective grid background for chapter openers.
 */
export function drawPerspectiveGrid(
  doc: PDFKit.PDFDocument,
  options: {
    horizonY?: number;
    lineColor?: string;
    lineOpacity?: number;
  } = {}
): void {
  const {
    horizonY = defaultConfig.pageHeight * 0.4,
    lineColor = colors.electricBlue,
    lineOpacity = 0.3,
  } = options;

  const centerX = defaultConfig.pageWidth / 2;
  const bottomY = defaultConfig.pageHeight;

  doc.save();
  doc.opacity(lineOpacity);
  doc.strokeColor(lineColor);
  doc.lineWidth(0.5);

  // Vertical lines converging to horizon
  const lineCount = 20;
  const spread = defaultConfig.pageWidth * 1.5;

  for (let i = 0; i <= lineCount; i++) {
    const t = i / lineCount;
    const bottomX = centerX - spread / 2 + spread * t;

    doc
      .moveTo(centerX, horizonY)
      .lineTo(bottomX, bottomY)
      .stroke();
  }

  // Horizontal lines (perspective scaled)
  const horizontalLineCount = 15;
  for (let i = 1; i <= horizontalLineCount; i++) {
    const t = i / horizontalLineCount;
    const y = horizonY + (bottomY - horizonY) * t * t; // Exponential spacing
    const width = spread * t;
    const startX = centerX - width / 2;
    const endX = centerX + width / 2;

    doc
      .moveTo(startX, y)
      .lineTo(endX, y)
      .stroke();
  }

  doc.restore();
}

/**
 * Draw horizontal gradient stripe accent.
 */
export function drawGradientStripe(
  doc: PDFKit.PDFDocument,
  y: number,
  height: number = 4
): void {
  const gradient = doc.linearGradient(
    0, y,
    defaultConfig.pageWidth, y
  );

  gradient.stop(0, colors.electricBlue);
  gradient.stop(0.5, colors.hotPink);
  gradient.stop(1, colors.deepPurple);

  doc
    .rect(0, y, defaultConfig.pageWidth, height)
    .fill(gradient);
}
