// src/tooling/pdf-gen/utils/colors.ts

/**
 * Synthwave color system for PDF generation.
 * All colors in hex format for pdfkit compatibility.
 */
export const colors = {
  // Core Synthwave Colors
  electricBlue: '#00D9FF',
  hotPink: '#FF006E',
  deepPurple: '#7B2CBF',

  // Neutrals
  inkBlack: '#1A1A1A',
  mediumGray: '#6B6B6B',
  borderGray: '#E0E0E0',
  lightGray: '#F5F5F5',
  white: '#FFFFFF',
  offWhite: '#FAFAFA',

  // Tinted Backgrounds
  lightBlue: '#E5FAFF',
  lightPink: '#FFE5F3',
  lightPurple: '#F3E5FF',

  // Dark Backgrounds
  darkPurple: '#1A0A2E',
  black: '#000000',

  // Semantic
  success: '#2D7A4F',
  caution: '#B88A2E',
} as const;

export type ColorName = keyof typeof colors;

/**
 * Get a color value by name.
 */
export function getColor(name: ColorName): string {
  return colors[name];
}

/**
 * Create a gradient stop array for chrome text effect.
 * Returns stops for cyan → white → magenta.
 */
export function chromeGradientStops(): Array<{ offset: number; color: string }> {
  return [
    { offset: 0, color: colors.electricBlue },
    { offset: 0.5, color: colors.white },
    { offset: 1, color: colors.hotPink },
  ];
}
