// src/tooling/pdf-gen/renderers/chapter-opener.ts
import { colors } from '../utils/colors';
import { defaultConfig } from '../utils/layout';
import { drawPerspectiveGrid, drawGradientStripe } from '../graphics/grid-background';

/**
 * Render a chapter opener page with typographic impact.
 */
export function renderChapterOpener(
  doc: PDFKit.PDFDocument,
  chapterNumber: number,
  title: string
): void {
  // Start new page
  doc.addPage();

  // Dark gradient background
  const gradient = doc.linearGradient(
    0, 0,
    0, defaultConfig.pageHeight
  );
  gradient.stop(0, colors.darkPurple);
  gradient.stop(1, colors.black);

  doc
    .rect(0, 0, defaultConfig.pageWidth, defaultConfig.pageHeight)
    .fill(gradient);

  // Perspective grid
  drawPerspectiveGrid(doc, {
    horizonY: defaultConfig.pageHeight * 0.35,
    lineOpacity: 0.2,
  });

  // Gradient stripe at 60% height
  const stripeY = defaultConfig.pageHeight * 0.6;
  drawGradientStripe(doc, stripeY, 4);

  // Chapter number - massive chrome text
  const numberStr = chapterNumber.toString();
  const fontSize = numberStr.length === 1 ? 200 : numberStr.length === 2 ? 160 : 120;
  const numberY = defaultConfig.pageHeight * 0.25;

  // Chrome gradient effect (simulate with layered text)
  // Layer 1: cyan shadow
  doc
    .font('SpaceGrotesk-Bold')
    .fontSize(fontSize)
    .fillColor(colors.electricBlue)
    .text(numberStr, 0, numberY + 2, {
      width: defaultConfig.pageWidth,
      align: 'center',
    });

  // Layer 2: white highlight
  doc
    .fillColor(colors.white)
    .text(numberStr, 0, numberY, {
      width: defaultConfig.pageWidth,
      align: 'center',
    });

  // Chapter title
  const titleY = stripeY + 40;
  doc
    .font('SpaceGrotesk-Bold')
    .fontSize(36)
    .fillColor(colors.white)
    .text(title.toUpperCase(), 0, titleY, {
      width: defaultConfig.pageWidth,
      align: 'center',
      characterSpacing: 2,
    });
}

/**
 * Render a part divider page (Parts I-IV).
 */
export function renderPartDivider(
  doc: PDFKit.PDFDocument,
  partNumber: string, // "I", "II", "III", "IV"
  partTitle: string
): void {
  // Start new page
  doc.addPage();

  // Dark gradient background
  const gradient = doc.linearGradient(
    0, 0,
    0, defaultConfig.pageHeight
  );
  gradient.stop(0, colors.darkPurple);
  gradient.stop(1, colors.black);

  doc
    .rect(0, 0, defaultConfig.pageWidth, defaultConfig.pageHeight)
    .fill(gradient);

  // Perspective grid (more prominent for part dividers)
  drawPerspectiveGrid(doc, {
    horizonY: defaultConfig.pageHeight * 0.3,
    lineOpacity: 0.35,
  });

  // "PART" label
  const labelY = defaultConfig.pageHeight * 0.3;
  doc
    .font('SpaceGrotesk-SemiBold')
    .fontSize(24)
    .fillColor(colors.electricBlue)
    .text('PART', 0, labelY, {
      width: defaultConfig.pageWidth,
      align: 'center',
      characterSpacing: 8,
    });

  // Part number (Roman numeral)
  const numberY = labelY + 50;
  doc
    .font('SpaceGrotesk-Bold')
    .fontSize(120)
    .fillColor(colors.white)
    .text(partNumber, 0, numberY, {
      width: defaultConfig.pageWidth,
      align: 'center',
    });

  // Part title
  const titleY = numberY + 140;
  doc
    .font('SpaceGrotesk-SemiBold')
    .fontSize(28)
    .fillColor(colors.hotPink)
    .text(partTitle, 0, titleY, {
      width: defaultConfig.pageWidth,
      align: 'center',
    });
}
