// src/tooling/pdf-gen/document.ts
import PDFDocument from 'pdfkit';
import { defaultConfig } from './utils/layout';
import { registerFonts } from './utils/fonts';

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
}

/**
 * Create a new PDF document with standard configuration.
 */
export function createPDFDocument(metadata?: PDFMetadata): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: [defaultConfig.pageWidth, defaultConfig.pageHeight],
    margins: defaultConfig.margins,
    bufferPages: true, // Enable page buffering for TOC backfill
    info: {
      Title: metadata?.title ?? 'Razorweave Core Rulebook',
      Author: metadata?.author ?? 'Panda Edwards',
      Subject: metadata?.subject ?? 'Tabletop Roleplaying Game',
      Keywords: metadata?.keywords?.join(', ') ?? 'TTRPG, RPG, Razorweave',
      Creator: 'Razorweave PDF Generator',
      Producer: 'pdfkit',
    },
  });

  // Register custom fonts
  registerFonts(doc);

  return doc;
}
