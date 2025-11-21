/**
 * HTML Generation Module
 *
 * Shared infrastructure for generating HTML from markdown.
 * Used by both print-design and web-reader workflows.
 */

// Utilities
export * from './hasher.js';
export * from './build-client.js';
export * from './pipeline.js';

// Assembly
export * from './chapter-reader.js';
export * from './toc-generator.js';
