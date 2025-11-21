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
    it('combines chapters and sheets in order', () => {
      const parts = {
        chapters: [
          { number: 1, slug: 'welcome', html: '<h2>1. Welcome</h2>' },
          { number: 2, slug: 'concepts', html: '<h2>2. Concepts</h2>' },
        ],
        sheets: [
          { slug: 'character-sheet', html: '<h3>Character Sheet</h3>' },
        ],
        partIntros: new Map([
          ['part-i-foundations', '<p>Part I intro</p>'],
        ]),
      };

      const assembled = assembleContent(parts);

      // Check order
      const ch1Index = assembled.indexOf('ch-01-welcome');
      const ch2Index = assembled.indexOf('ch-02-concepts');
      const sheetIndex = assembled.indexOf('character-sheet');

      expect(ch1Index).toBeLessThan(ch2Index);
      expect(ch2Index).toBeLessThan(sheetIndex);
    });
  });
});
