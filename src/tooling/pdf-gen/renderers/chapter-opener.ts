// src/tooling/pdf-gen/renderers/chapter-opener.ts
import fs from 'fs';
import path from 'path';
import { colors } from '../utils/colors';
import { defaultConfig } from '../utils/layout';
import { drawPerspectiveGrid, drawGradientStripe } from '../graphics/grid-background';

// Corner image paths
const CORNER_IMAGES = {
  tl: path.join(process.cwd(), 'src/site/public/images/decorative/corner-tl.png'),
  tr: path.join(process.cwd(), 'src/site/public/images/decorative/corner-tr.png'),
  bl: path.join(process.cwd(), 'src/site/public/images/decorative/corner-bl.png'),
  br: path.join(process.cwd(), 'src/site/public/images/decorative/corner-br.png'),
};

// Part background images
const PART_BACKGROUNDS: Record<string, string> = {
  'I': path.join(process.cwd(), 'data/pdfs/assets/part-1-background.png'),
  'II': path.join(process.cwd(), 'data/pdfs/assets/part-2-background.png'),
  'III': path.join(process.cwd(), 'data/pdfs/assets/part-3-background.png'),
  'IV': path.join(process.cwd(), 'data/pdfs/assets/part-4-background.png'),
};

/**
 * Render a chapter opener page with typographic impact.
 * @param isFirstPage - If true, use current page instead of adding a new one
 */
export function renderChapterOpener(
  doc: PDFKit.PDFDocument,
  chapterNumber: number,
  title: string,
  isFirstPage: boolean = false
): void {
  // Start new page (unless this is the first page of the document)
  if (!isFirstPage) {
    doc.addPage();
  }

  // Add named destination for TOC linking
  const destinationName = `chapter-${chapterNumber}`;
  doc.addNamedDestination(destinationName);

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

  // Corner decorations
  drawCornerImages(doc);
}

/**
 * Draw corner decoration images on the current page.
 */
function drawCornerImages(doc: PDFKit.PDFDocument): void {
  const cornerSize = 60;
  const margin = 20;
  const { pageWidth, pageHeight } = defaultConfig;

  // Top-left
  if (fs.existsSync(CORNER_IMAGES.tl)) {
    doc.image(CORNER_IMAGES.tl, margin, margin, { width: cornerSize });
  }

  // Top-right
  if (fs.existsSync(CORNER_IMAGES.tr)) {
    doc.image(CORNER_IMAGES.tr, pageWidth - margin - cornerSize, margin, { width: cornerSize });
  }

  // Bottom-left
  if (fs.existsSync(CORNER_IMAGES.bl)) {
    doc.image(CORNER_IMAGES.bl, margin, pageHeight - margin - cornerSize, { width: cornerSize });
  }

  // Bottom-right
  if (fs.existsSync(CORNER_IMAGES.br)) {
    doc.image(CORNER_IMAGES.br, pageWidth - margin - cornerSize, pageHeight - margin - cornerSize, { width: cornerSize });
  }
}

/**
 * Render a part divider page (Parts I-IV).
 * Uses landscape images in top half, text in bottom half.
 */
export function renderPartDivider(
  doc: PDFKit.PDFDocument,
  partNumber: string, // "I", "II", "III", "IV"
  partTitle: string
): void {
  const { pageWidth, pageHeight } = defaultConfig;

  // Start new page
  doc.addPage();

  // Add named destination for bookmark/TOC linking
  const destinationName = `part-${partNumber}`;
  doc.addNamedDestination(destinationName);

  // Dark gradient background for entire page
  const gradient = doc.linearGradient(0, 0, 0, pageHeight);
  gradient.stop(0, colors.darkPurple);
  gradient.stop(1, colors.black);
  doc.rect(0, 0, pageWidth, pageHeight).fill(gradient);

  // Use part-specific background as half-page landscape image in top portion
  const bgPath = PART_BACKGROUNDS[partNumber];
  const imageHeight = pageHeight * 0.45; // Top 45% for landscape image

  if (bgPath && fs.existsSync(bgPath)) {
    // Draw the landscape image at top, scaled to fill width
    doc.image(bgPath, 0, 30, {
      width: pageWidth,
      height: imageHeight,
      fit: [pageWidth, imageHeight],
      align: 'center',
      valign: 'center',
    });
  } else {
    // Fallback: Perspective grid in top area
    drawPerspectiveGrid(doc, {
      horizonY: pageHeight * 0.25,
      lineOpacity: 0.35,
    });
  }

  // "PART" label - below the image
  const labelY = pageHeight * 0.52;
  doc
    .font('SpaceGrotesk-SemiBold')
    .fontSize(20)
    .fillColor(colors.electricBlue)
    .text('PART', 0, labelY, {
      width: pageWidth,
      align: 'center',
      characterSpacing: 8,
    });

  // Part number (Roman numeral)
  const numberY = labelY + 35;
  doc
    .font('SpaceGrotesk-Bold')
    .fontSize(100)
    .fillColor(colors.white)
    .text(partNumber, 0, numberY, {
      width: pageWidth,
      align: 'center',
    });

  // Part title
  const titleY = numberY + 110;
  doc
    .font('SpaceGrotesk-SemiBold')
    .fontSize(24)
    .fillColor(colors.hotPink)
    .text(partTitle, 40, titleY, {
      width: pageWidth - 80,
      align: 'center',
    });

  // Corner decorations
  drawCornerImages(doc);
}
