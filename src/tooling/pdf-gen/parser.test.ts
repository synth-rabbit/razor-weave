// src/tooling/pdf-gen/parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseHTML, extractChapters } from './parser';

const sampleHTML = `
<!DOCTYPE html>
<html>
<body>
  <main>
    <section id="ch-01-welcome">
      <h2>1. Welcome to Razorweave</h2>
      <p>This is the introduction.</p>
      <div class="example">
        <strong>Example</strong>
        <p>An example block.</p>
      </div>
    </section>
    <section id="ch-02-core-concepts">
      <h2>2. Core Concepts</h2>
      <p>Core concepts content.</p>
      <div class="gm">
        <strong>GM Guidance</strong>
        <p>A GM box.</p>
      </div>
    </section>
  </main>
</body>
</html>
`;

describe('parseHTML', () => {
  it('loads and parses HTML content', () => {
    const $ = parseHTML(sampleHTML);
    expect($('section').length).toBe(2);
  });
});

describe('extractChapters', () => {
  it('extracts chapter data from HTML', () => {
    const $ = parseHTML(sampleHTML);
    const chapters = extractChapters($);

    expect(chapters).toHaveLength(2);
    expect(chapters[0].number).toBe(1);
    expect(chapters[0].title).toBe('Welcome to Razorweave');
    expect(chapters[0].slug).toBe('ch-01-welcome');
  });

  it('extracts content blocks from chapters', () => {
    const $ = parseHTML(sampleHTML);
    const chapters = extractChapters($);

    // First chapter has a paragraph and an example
    const ch1Content = chapters[0].sections[0].content;
    expect(ch1Content.some(b => b.type === 'paragraph')).toBe(true);
    expect(ch1Content.some(b => b.type === 'example')).toBe(true);
  });
});
