// src/tooling/pdf-gen/utils/fonts.ts
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FONTS_DIR = join(__dirname, '../fonts');

export interface FontDefinition {
  family: string;
  weight: number;
  style: 'normal' | 'italic';
  path: string;
}

/**
 * Font file paths - assumes fonts are downloaded to fonts/ directory.
 * If fonts are missing, the pipeline will fall back to system fonts.
 */
export const fontPaths = {
  spaceGrotesk: {
    medium: join(FONTS_DIR, 'SpaceGrotesk-Medium.ttf'),
    semiBold: join(FONTS_DIR, 'SpaceGrotesk-SemiBold.ttf'),
    bold: join(FONTS_DIR, 'SpaceGrotesk-Bold.ttf'),
  },
  inter: {
    regular: join(FONTS_DIR, 'Inter-Regular.ttf'),
    medium: join(FONTS_DIR, 'Inter-Medium.ttf'),
    semiBold: join(FONTS_DIR, 'Inter-SemiBold.ttf'),
  },
  jetBrainsMono: {
    regular: join(FONTS_DIR, 'JetBrainsMono-Regular.ttf'),
    medium: join(FONTS_DIR, 'JetBrainsMono-Medium.ttf'),
  },
} as const;

/**
 * Check if a font file exists.
 */
export function fontExists(fontPath: string): boolean {
  return existsSync(fontPath);
}

/**
 * Get available fonts, falling back to system fonts if custom fonts missing.
 */
export function getAvailableFonts(): {
  heading: string;
  body: string;
  mono: string;
} {
  const hasSpaceGrotesk = fontExists(fontPaths.spaceGrotesk.bold);
  const hasInter = fontExists(fontPaths.inter.regular);
  const hasJetBrains = fontExists(fontPaths.jetBrainsMono.regular);

  return {
    heading: hasSpaceGrotesk ? fontPaths.spaceGrotesk.bold : 'Helvetica-Bold',
    body: hasInter ? fontPaths.inter.regular : 'Helvetica',
    mono: hasJetBrains ? fontPaths.jetBrainsMono.regular : 'Courier',
  };
}

/**
 * Register custom fonts with a PDFKit document.
 * Falls back to system fonts when custom fonts aren't available.
 */
export function registerFonts(doc: PDFKit.PDFDocument): void {
  // Space Grotesk - fallback to Helvetica variants
  if (fontExists(fontPaths.spaceGrotesk.medium)) {
    doc.registerFont('SpaceGrotesk-Medium', fontPaths.spaceGrotesk.medium);
  } else {
    doc.registerFont('SpaceGrotesk-Medium', 'Helvetica');
  }
  if (fontExists(fontPaths.spaceGrotesk.semiBold)) {
    doc.registerFont('SpaceGrotesk-SemiBold', fontPaths.spaceGrotesk.semiBold);
  } else {
    doc.registerFont('SpaceGrotesk-SemiBold', 'Helvetica-Bold');
  }
  if (fontExists(fontPaths.spaceGrotesk.bold)) {
    doc.registerFont('SpaceGrotesk-Bold', fontPaths.spaceGrotesk.bold);
  } else {
    doc.registerFont('SpaceGrotesk-Bold', 'Helvetica-Bold');
  }

  // Inter - fallback to Helvetica variants
  if (fontExists(fontPaths.inter.regular)) {
    doc.registerFont('Inter-Regular', fontPaths.inter.regular);
  } else {
    doc.registerFont('Inter-Regular', 'Helvetica');
  }
  if (fontExists(fontPaths.inter.medium)) {
    doc.registerFont('Inter-Medium', fontPaths.inter.medium);
  } else {
    doc.registerFont('Inter-Medium', 'Helvetica');
  }
  if (fontExists(fontPaths.inter.semiBold)) {
    doc.registerFont('Inter-SemiBold', fontPaths.inter.semiBold);
  } else {
    doc.registerFont('Inter-SemiBold', 'Helvetica-Bold');
  }

  // JetBrains Mono - fallback to Courier
  if (fontExists(fontPaths.jetBrainsMono.regular)) {
    doc.registerFont('JetBrainsMono-Regular', fontPaths.jetBrainsMono.regular);
  } else {
    doc.registerFont('JetBrainsMono-Regular', 'Courier');
  }
  if (fontExists(fontPaths.jetBrainsMono.medium)) {
    doc.registerFont('JetBrainsMono-Medium', fontPaths.jetBrainsMono.medium);
  } else {
    doc.registerFont('JetBrainsMono-Medium', 'Courier');
  }
}
