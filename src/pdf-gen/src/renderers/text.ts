// src/tooling/pdf-gen/renderers/text.ts
import { colors } from '../utils/colors';
import { typography, getBodyContentX, defaultConfig } from '../utils/layout';

export interface TextOptions {
  font?: string;
  fontSize?: number;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  lineGap?: number;
  width?: number;
}

/**
 * Render body paragraph text.
 */
export function renderParagraph(
  doc: PDFKit.PDFDocument,
  text: string,
  y: number,
  options: TextOptions = {}
): number {
  const {
    font = 'Inter-Regular',
    fontSize = typography.body,
    color = colors.inkBlack,
    align = 'left',
    lineGap = typography.leading.body - typography.body,
    width = 336, // body width
  } = options;

  const x = getBodyContentX();

  doc
    .font(font)
    .fontSize(fontSize)
    .fillColor(color)
    .text(text, x, y, {
      width,
      align,
      lineGap,
    });

  // Return new Y position after text
  return doc.y + typography.paragraphSpacing;
}

/**
 * Render a heading (h2, h3, h4).
 */
export function renderHeading(
  doc: PDFKit.PDFDocument,
  text: string,
  level: 2 | 3 | 4,
  y: number
): number {
  const configs: Record<2 | 3 | 4, { font: string; size: number; color: string; marginTop: number }> = {
    2: {
      font: 'SpaceGrotesk-SemiBold',
      size: typography.h2,
      color: colors.electricBlue,
      marginTop: 36,
    },
    3: {
      font: 'SpaceGrotesk-SemiBold',
      size: typography.h3,
      color: colors.hotPink,
      marginTop: 24,
    },
    4: {
      font: 'SpaceGrotesk-Medium',
      size: typography.h4,
      color: colors.hotPink,
      marginTop: 18,
    },
  };

  const config = configs[level];
  const x = getBodyContentX();

  // Add top margin
  const adjustedY = y + config.marginTop;

  doc
    .font(config.font)
    .fontSize(config.size)
    .fillColor(config.color)
    .text(text, x, adjustedY, {
      width: 336,
    });

  // Return Y position with bottom margin
  return doc.y + (level === 2 ? 12 : 8);
}

/**
 * Render large display text (for chapter numbers).
 */
export function renderDisplayText(
  doc: PDFKit.PDFDocument,
  text: string,
  y: number,
  options: {
    fontSize?: number;
    color?: string;
    align?: 'left' | 'center' | 'right';
  } = {}
): number {
  const {
    fontSize = typography.display.min,
    color = colors.electricBlue,
    align = 'center',
  } = options;

  doc
    .font('SpaceGrotesk-Bold')
    .fontSize(fontSize)
    .fillColor(color)
    .text(text, defaultConfig.margins.left, y, {
      width: defaultConfig.liveArea.width,
      align,
    });

  return doc.y;
}
