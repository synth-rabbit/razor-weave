// src/tooling/pdf-gen/renderers/cover.ts
import { colors } from '../utils/colors';
import { defaultConfig } from '../utils/layout';
import { drawPerspectiveGrid, drawGradientStripe } from '../graphics/grid-background';
import fs from 'fs';
import path from 'path';
import SVGtoPDF from 'svg-to-pdfkit';

// Cover artwork path
const COVER_ARTWORK = path.join(process.cwd(), 'data/pdfs/assets/cover-artwork.png');

/**
 * Render a cover page for the rulebook.
 * Layout: Logo + Title between gradient stripes, subtitle below bottom stripe.
 */
export function renderCoverPage(
  doc: PDFKit.PDFDocument,
  logoPath?: string
): void {
  const { pageWidth, pageHeight } = defaultConfig;

  // Use cover artwork if available, otherwise fall back to generated background
  if (fs.existsSync(COVER_ARTWORK)) {
    // Cover artwork as full-page background
    doc.image(COVER_ARTWORK, 0, 0, { width: pageWidth, height: pageHeight });
  } else {
    // Fallback: Dark gradient background
    const gradient = doc.linearGradient(0, 0, 0, pageHeight);
    gradient.stop(0, colors.black);
    gradient.stop(0.5, colors.darkPurple);
    gradient.stop(1, colors.black);

    doc.rect(0, 0, pageWidth, pageHeight).fill(gradient);

    // Perspective grid (prominent for cover)
    drawPerspectiveGrid(doc, {
      horizonY: pageHeight * 0.4,
      lineOpacity: 0.4,
    });
  }

  // Gradient stripes - frame the title area
  const topStripeY = pageHeight * 0.28;
  const bottomStripeY = pageHeight * 0.58;
  drawGradientStripe(doc, topStripeY, 6);
  drawGradientStripe(doc, bottomStripeY, 4);

  // === BETWEEN THE STRIPES: Logo + Title ===

  // SVG Logo - positioned between stripes
  // Note: SVG has viewBox "100 270 1070 280" so we need to account for its aspect ratio
  // Width: 1070, Height: 280 → aspect ~3.8:1
  const logoWidth = 320;
  const logoHeight = logoWidth * (280 / 1070); // ~84pt
  const logoX = (pageWidth - logoWidth) / 2;
  const logoY = topStripeY + 14; // Just below top stripe

  if (logoPath && fs.existsSync(logoPath)) {
    try {
      const logoSvg = fs.readFileSync(logoPath, 'utf-8');

      doc.save();
      SVGtoPDF(doc, logoSvg, logoX, logoY, { width: logoWidth, height: logoHeight });
      doc.restore();
    } catch {
      // If SVG rendering fails, fall back to text logo
      renderTextLogo(doc, logoY);
    }
  } else {
    renderTextLogo(doc, logoY);
  }

  // CORE RULEBOOK title - below logo, still between stripes
  const coreY = pageHeight * 0.42;
  doc
    .font('SpaceGrotesk-Bold')
    .fontSize(56)
    .fillColor(colors.white)
    .text('CORE', 0, coreY, {
      width: pageWidth,
      align: 'center',
      characterSpacing: 8,
      lineBreak: false,
    });

  doc
    .font('SpaceGrotesk-Bold')
    .fontSize(56)
    .fillColor(colors.electricBlue)
    .text('RULEBOOK', 0, coreY + 60, {
      width: pageWidth,
      align: 'center',
      characterSpacing: 8,
      lineBreak: false,
    });

  // === BELOW BOTTOM STRIPE: Subtitle ===
  const subtitleY = pageHeight * 0.62;
  doc
    .font('SpaceGrotesk-SemiBold')
    .fontSize(14)
    .fillColor(colors.hotPink)
    .text('A UNIVERSAL TABLETOP ROLEPLAYING SYSTEM', 0, subtitleY, {
      width: pageWidth,
      align: 'center',
      characterSpacing: 2,
      lineBreak: false,
    });

  // Version/draft indicator
  const versionY = pageHeight * 0.88;
  doc
    .font('Inter-Regular')
    .fontSize(10)
    .fillColor(colors.white)
    .opacity(0.6)
    .text('PREVIEW DRAFT', 0, versionY, {
      width: pageWidth,
      align: 'center',
    })
    .opacity(1);
}

/**
 * Render a text-based logo fallback.
 */
function renderTextLogo(doc: PDFKit.PDFDocument, logoY: number): void {
  const { pageWidth } = defaultConfig;

  // "RAZORWEAVE" in bold chrome style
  doc
    .font('SpaceGrotesk-Bold')
    .fontSize(42)
    .fillColor(colors.electricBlue)
    .text('RAZORWEAVE', 0, logoY + 2, {
      width: pageWidth,
      align: 'center',
      characterSpacing: 6,
      lineBreak: false,
    });

  doc
    .fillColor(colors.white)
    .text('RAZORWEAVE', 0, logoY, {
      width: pageWidth,
      align: 'center',
      characterSpacing: 6,
      lineBreak: false,
    });
}
