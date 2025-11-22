// src/tooling/pdf-gen/document.test.ts
import { describe, it, expect } from 'vitest';
import { createPDFDocument } from './document';
import { defaultConfig } from './utils/layout';

describe('createPDFDocument', () => {
  it('creates a PDF document with US Letter dimensions', () => {
    const doc = createPDFDocument();

    // PDFKit stores page size in options
    expect(doc.options.size).toEqual([defaultConfig.pageWidth, defaultConfig.pageHeight]);
  });

  it('creates a document with metadata', () => {
    const doc = createPDFDocument({
      title: 'Test PDF',
      author: 'Test Author',
    });

    // Metadata is set via info property
    expect(doc.info.Title).toBe('Test PDF');
    expect(doc.info.Author).toBe('Test Author');
  });
});
