// src/tooling/pdf-gen/utils/fonts.ts
import { join } from 'path';
import { existsSync } from 'fs';

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
 */
export function registerFonts(doc: PDFKit.PDFDocument): void {
  // Space Grotesk
  if (fontExists(fontPaths.spaceGrotesk.medium)) {
    doc.registerFont('SpaceGrotesk-Medium', fontPaths.spaceGrotesk.medium);
  }
  if (fontExists(fontPaths.spaceGrotesk.semiBold)) {
    doc.registerFont('SpaceGrotesk-SemiBold', fontPaths.spaceGrotesk.semiBold);
  }
  if (fontExists(fontPaths.spaceGrotesk.bold)) {
    doc.registerFont('SpaceGrotesk-Bold', fontPaths.spaceGrotesk.bold);
  }

  // Inter
  if (fontExists(fontPaths.inter.regular)) {
    doc.registerFont('Inter-Regular', fontPaths.inter.regular);
  }
  if (fontExists(fontPaths.inter.medium)) {
    doc.registerFont('Inter-Medium', fontPaths.inter.medium);
  }
  if (fontExists(fontPaths.inter.semiBold)) {
    doc.registerFont('Inter-SemiBold', fontPaths.inter.semiBold);
  }

  // JetBrains Mono
  if (fontExists(fontPaths.jetBrainsMono.regular)) {
    doc.registerFont('JetBrainsMono-Regular', fontPaths.jetBrainsMono.regular);
  }
  if (fontExists(fontPaths.jetBrainsMono.medium)) {
    doc.registerFont('JetBrainsMono-Medium', fontPaths.jetBrainsMono.medium);
  }
}
