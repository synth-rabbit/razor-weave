import { describe, it, expect } from 'vitest';
import { generateIndex, type IndexEntry } from './index-generator.js';

describe('index-generator', () => {
  describe('generateIndex', () => {
    it('extracts terms from headings', () => {
      const headings = [
        { text: 'Actions, Checks, and Outcomes', id: 'actions-checks-outcomes', level: 2 },
        { text: 'When to Roll', id: 'when-to-roll', level: 3 },
      ];

      const index = generateIndex(headings);

      expect(index.find(e => e.term === 'Actions, Checks, and Outcomes')).toBeDefined();
      expect(index.find(e => e.term === 'When to Roll')).toBeDefined();
    });

    it('sorts entries alphabetically', () => {
      const headings = [
        { text: 'Zebra', id: 'zebra', level: 2 },
        { text: 'Apple', id: 'apple', level: 2 },
        { text: 'Middle', id: 'middle', level: 2 },
      ];

      const index = generateIndex(headings);

      expect(index[0].term).toBe('Apple');
      expect(index[1].term).toBe('Middle');
      expect(index[2].term).toBe('Zebra');
    });

    it('includes link to heading id', () => {
      const headings = [
        { text: 'Combat Basics', id: 'combat-basics', level: 2 },
      ];

      const index = generateIndex(headings);

      expect(index[0].anchor).toBe('#combat-basics');
    });
  });
});
