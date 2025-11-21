import { describe, it, expect } from 'vitest';
import { assembleContent, wrapChapter, wrapSheet } from './assembler.js';

describe('assembler', () => {
  describe('wrapChapter', () => {
    it('wraps content in section with chapter ID', () => {
      const html = wrapChapter(8, 'actions-checks-outcomes', '<h2>8. Actions</h2><p>Content</p>');

      expect(html).toContain('<section id="ch-08-actions-checks-outcomes">');
      expect(html).toContain('</section>');
      expect(html).toContain('<h2>8. Actions</h2>');
    });
  });

  describe('wrapSheet', () => {
    it('wraps sheet in div.sheet-block', () => {
      const html = wrapSheet('character-sheet', '<h3>Character Sheet</h3><p>Fields</p>');

      expect(html).toContain('<div class="sheet-block" id="character-sheet">');
      expect(html).toContain('</div>');
    });
  });

  describe('assembleContent', () => {
    it('combines chapters in order with part intros', () => {
      const parts = {
        chapters: [
          { number: 1, slug: 'welcome', html: '<h2>1. Welcome</h2>' },
          { number: 2, slug: 'concepts', html: '<h2>2. Concepts</h2>' },
        ],
        sheets: [],
        partIntros: new Map([
          ['part-i-foundations', '<p>Part I intro</p>'],
        ]),
      };

      const assembled = assembleContent(parts);

      // Check order - chapters appear in sequence
      const ch1Index = assembled.indexOf('ch-01-welcome');
      const ch2Index = assembled.indexOf('ch-02-concepts');

      expect(ch1Index).toBeLessThan(ch2Index);
      expect(assembled).toContain('Part I intro');
    });

    it('appends sheets to chapter 27 content', () => {
      const parts = {
        chapters: [
          { number: 27, slug: 'sheets-and-play-aids', html: '<h2>27. Sheets and Play Aids</h2><p>Intro text</p>' },
        ],
        sheets: [
          { slug: 'character-sheet', html: '<p>Character fields</p>' },
          { slug: 'session-log', html: '<p>Session fields</p>' },
        ],
        partIntros: new Map(),
      };

      const assembled = assembleContent(parts);

      // Sheets should be inside chapter 27 section
      expect(assembled).toContain('ch-27-sheets-and-play-aids');
      expect(assembled).toContain('<h2>27. Sheets and Play Aids</h2>');
      expect(assembled).toContain('Intro text');
      expect(assembled).toContain('character-sheet');
      expect(assembled).toContain('session-log');

      // Sheet blocks should appear AFTER chapter intro
      const introIndex = assembled.indexOf('Intro text');
      const sheetIndex = assembled.indexOf('character-sheet');
      expect(introIndex).toBeLessThan(sheetIndex);
    });
  });
});
