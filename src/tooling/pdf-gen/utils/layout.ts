// src/tooling/pdf-gen/utils/layout.ts
import type { PDFConfig, PageState } from '../types';

/**
 * Default PDF configuration for US Letter size.
 */
export const defaultConfig: PDFConfig = {
  pageWidth: 612,   // 8.5" at 72 DPI
  pageHeight: 792,  // 11" at 72 DPI
  margins: {
    top: 54,        // 0.75"
    right: 54,
    bottom: 54,
    left: 54,
  },
  liveArea: {
    width: 504,     // 612 - 54 - 54
    height: 684,    // 792 - 54 - 54
  },
};

/**
 * Grid system: 12 columns within live area.
 */
export const grid = {
  columns: 12,
  columnWidth: 42,  // 504 / 12
  gutter: 18,
  bodyColumns: 8,   // Body text spans 8 columns
  bodyWidth: 336,   // 8 * 42
} as const;

/**
 * Typography sizes in points.
 */
export const typography = {
  display: { min: 144, max: 200 },  // Chapter numbers
  chapterTitle: 36,
  h2: 24,
  h3: 18,
  h4: 14,
  body: 11,
  caption: 9,
  code: 10,
  leading: {
    body: 16,       // 11pt * 1.45
    heading: 1.1,   // multiplier
  },
  paragraphSpacing: 11,
} as const;

/**
 * Create initial page state.
 */
export function createPageState(): PageState {
  return {
    currentPage: 0,
    currentChapter: '',
    yPosition: defaultConfig.margins.top,
    pageType: 'content',
    columnWidth: grid.bodyWidth,
  };
}

/**
 * Check if content fits on current page.
 */
export function fitsOnPage(
  state: PageState,
  contentHeight: number,
  config: PDFConfig = defaultConfig
): boolean {
  const bottomLimit = config.pageHeight - config.margins.bottom;
  return state.yPosition + contentHeight <= bottomLimit;
}

/**
 * Get Y position for starting content on a new page.
 */
export function getContentStartY(config: PDFConfig = defaultConfig): number {
  return config.margins.top;
}

/**
 * Get X position for body content (centered).
 */
export function getBodyContentX(config: PDFConfig = defaultConfig): number {
  // Center the body content (336pt) within live area (504pt)
  const offset = (config.liveArea.width - grid.bodyWidth) / 2;
  return config.margins.left + offset;
}
