import { describe, it, expect } from 'vitest';
import { generateToc, type TocEntry, PARTS } from './toc-generator.js';

describe('toc-generator', () => {
  describe('PARTS', () => {
    it('defines 4 parts with chapter ranges', () => {
      expect(PARTS).toHaveLength(4);
      expect(PARTS[0].chapters).toEqual([1, 13]);
      expect(PARTS[1].chapters).toEqual([14, 20]);
      expect(PARTS[2].chapters).toEqual([21, 26]);
      expect(PARTS[3].chapters).toEqual([27, 30]);
    });
  });

  describe('generateToc', () => {
    const sampleChapters = [
      { number: 1, title: 'Welcome', slug: 'welcome-to-the-game' },
      { number: 2, title: 'Core Concepts', slug: 'core-concepts' },
      { number: 14, title: 'Skills Overview', slug: 'skills-system-overview' },
      { number: 21, title: 'Running Sessions', slug: 'running-sessions' },
      { number: 28, title: 'Glossary', slug: 'glossary' },
    ];

    it('generates nested TOC with parts', () => {
      const toc = generateToc(sampleChapters);

      expect(toc).toHaveLength(4); // 4 parts
      expect(toc[0].type).toBe('part');
      expect(toc[0].title).toBe('Part I: Foundations');
    });

    it('groups chapters under correct parts', () => {
      const toc = generateToc(sampleChapters);

      // Part I should have chapters 1, 2
      const partI = toc[0];
      expect(partI.children).toHaveLength(2);
      expect(partI.children![0].number).toBe(1);

      // Part II should have chapter 14
      const partII = toc[1];
      expect(partII.children).toHaveLength(1);
      expect(partII.children![0].number).toBe(14);
    });

    it('generates chapter IDs in correct format', () => {
      const toc = generateToc(sampleChapters);

      const chapter1 = toc[0].children![0];
      expect(chapter1.id).toBe('ch-01-welcome-to-the-game');
    });

    it('generates part IDs', () => {
      const toc = generateToc(sampleChapters);

      expect(toc[0].id).toBe('part-i-foundations');
      expect(toc[1].id).toBe('part-ii-skills-proficiencies');
    });
  });
});
