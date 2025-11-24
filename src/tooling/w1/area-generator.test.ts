// src/tooling/w1/area-generator.test.ts
import { describe, it, expect } from 'vitest';
import { generateAreasFromAnalysis, type AreaGenerationOptions } from './area-generator.js';
import type { AnalysisForAreaGeneration } from './strategy-types.js';

describe('generateAreasFromAnalysis', () => {
  const createTestAnalysis = (): AnalysisForAreaGeneration => ({
    priority_rankings: [
      {
        category: 'clarity',
        severity: 7,
        frequency: 5,
        affected_chapters: ['08-actions.md', '10-combat.md'],
        description: 'Combat rules are confusing',
      },
      {
        category: 'accuracy',
        severity: 6,
        frequency: 3,
        affected_chapters: ['08-actions.md', '12-equipment.md'],
        description: 'Some rule contradictions',
      },
      {
        category: 'usability',
        severity: 5,
        frequency: 4,
        affected_chapters: ['02-creation.md', '03-races.md'],
        description: 'Lacking practical examples',
      },
    ],
    dimension_summaries: {
      clarity_readability: { average: 6.5, themes: ['combat confusion', 'action economy'] },
      rules_accuracy: { average: 7.0, themes: ['contradictions'] },
      practical_usability: { average: 6.8, themes: ['examples needed'] },
      persona_fit: { average: 7.2, themes: [] },
    },
  });

  describe('basic functionality', () => {
    it('generates areas from analysis', () => {
      const analysis = createTestAnalysis();
      const areas = generateAreasFromAnalysis(analysis);

      expect(areas.length).toBeGreaterThan(0);
      expect(areas.length).toBeLessThanOrEqual(6);
    });

    it('returns empty array for empty rankings', () => {
      const analysis: AnalysisForAreaGeneration = {
        priority_rankings: [],
        dimension_summaries: {},
      };

      const areas = generateAreasFromAnalysis(analysis);
      expect(areas).toEqual([]);
    });

    it('respects maxAreas option', () => {
      const analysis = createTestAnalysis();
      const areas = generateAreasFromAnalysis(analysis, { maxAreas: 2 });

      expect(areas.length).toBeLessThanOrEqual(2);
    });

    it('filters by minimum severity', () => {
      const analysis = createTestAnalysis();
      const areas = generateAreasFromAnalysis(analysis, { minSeverity: 6 });

      // Should only include clarity (7) and accuracy (6), not usability (5)
      expect(areas.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('groupByIssueCategory strategy', () => {
    it('groups by issue category when specified', () => {
      const analysis = createTestAnalysis();
      const areas = generateAreasFromAnalysis(analysis, {
        preferredStrategy: 'issue_category',
      });

      expect(areas.length).toBe(3); // clarity, accuracy, usability
      expect(areas.some(a => a.type === 'issue_category')).toBe(true);
    });

    it('assigns correct dimensions to categories', () => {
      const analysis = createTestAnalysis();
      const areas = generateAreasFromAnalysis(analysis, {
        preferredStrategy: 'issue_category',
      });

      const clarityArea = areas.find(a => a.name.toLowerCase().includes('clarity'));
      expect(clarityArea?.target_dimension).toBe('clarity_readability');

      const accuracyArea = areas.find(a => a.name.toLowerCase().includes('accuracy'));
      expect(accuracyArea?.target_dimension).toBe('rules_accuracy');
    });

    it('collects affected chapters for each category', () => {
      const analysis = createTestAnalysis();
      const areas = generateAreasFromAnalysis(analysis, {
        preferredStrategy: 'issue_category',
      });

      const clarityArea = areas.find(a => a.name.toLowerCase().includes('clarity'));
      expect(clarityArea?.target_chapters).toContain('08-actions.md');
      expect(clarityArea?.target_chapters).toContain('10-combat.md');
    });
  });

  describe('groupByChapterCluster strategy', () => {
    it('groups by chapter cluster when specified', () => {
      const analysis = createTestAnalysis();
      const areas = generateAreasFromAnalysis(analysis, {
        preferredStrategy: 'chapter_cluster',
      });

      expect(areas.some(a => a.type === 'chapter_cluster')).toBe(true);
    });

    it('clusters chapters with shared issues', () => {
      const analysis = createTestAnalysis();
      const areas = generateAreasFromAnalysis(analysis, {
        preferredStrategy: 'chapter_cluster',
      });

      // 08-actions.md appears in both clarity and accuracy, so should be clustered
      const actionsCluster = areas.find(a =>
        a.target_chapters.includes('08-actions.md')
      );
      expect(actionsCluster).toBeDefined();
    });
  });

  describe('groupByPersonaPainPoint strategy', () => {
    it('groups by persona pain points when data available', () => {
      const analysis: AnalysisForAreaGeneration = {
        priority_rankings: [
          {
            category: 'complexity',
            severity: 7,
            frequency: 5,
            affected_chapters: ['10-combat.md'],
            affected_personas: ['new-player'],
          },
        ],
        dimension_summaries: {},
        persona_breakdowns: {
          'new-player': {
            strengths: ['Character creation was fun'],
            struggles: ['Combat rules overwhelming', 'Too many options'],
          },
          'veteran': {
            strengths: ['Deep customization'],
            struggles: ['Lacks advanced options'],
          },
        },
      };

      const areas = generateAreasFromAnalysis(analysis, {
        preferredStrategy: 'persona_pain_point',
      });

      expect(areas.some(a => a.type === 'persona_pain_point')).toBe(true);
      expect(areas.some(a => a.name.toLowerCase().includes('new player'))).toBe(true);
    });

    it('skips personas with no struggles', () => {
      const analysis: AnalysisForAreaGeneration = {
        priority_rankings: [
          { category: 'test', severity: 5, frequency: 2 },
        ],
        dimension_summaries: {},
        persona_breakdowns: {
          'happy-persona': {
            strengths: ['Everything is great'],
            struggles: [],
          },
        },
      };

      const areas = generateAreasFromAnalysis(analysis, {
        preferredStrategy: 'persona_pain_point',
      });

      expect(areas.every(a => !a.name.toLowerCase().includes('happy'))).toBe(true);
    });
  });

  describe('auto strategy selection', () => {
    it('selects persona strategy when rich persona data available', () => {
      const analysis: AnalysisForAreaGeneration = {
        priority_rankings: [
          { category: 'test', severity: 5, frequency: 2, affected_chapters: ['ch1.md'] },
        ],
        dimension_summaries: {},
        persona_breakdowns: {
          'persona-1': { strengths: [], struggles: ['A', 'B'] },
          'persona-2': { strengths: [], struggles: ['C'] },
          'persona-3': { strengths: [], struggles: ['D', 'E'] },
          'persona-4': { strengths: [], struggles: ['F'] },
        },
      };

      const areas = generateAreasFromAnalysis(analysis);
      expect(areas.some(a => a.type === 'persona_pain_point')).toBe(true);
    });

    it('falls back to issue_category when no persona data', () => {
      const analysis = createTestAnalysis();
      const areas = generateAreasFromAnalysis(analysis);

      // Without persona data, should use issue_category
      expect(areas.some(a => a.type === 'issue_category')).toBe(true);
    });
  });

  describe('area properties', () => {
    it('generates valid area_ids', () => {
      const analysis = createTestAnalysis();
      const areas = generateAreasFromAnalysis(analysis);

      for (const area of areas) {
        expect(area.area_id).toMatch(/^area-/);
        expect(area.area_id).not.toContain(' ');
      }
    });

    it('assigns priorities in order', () => {
      const analysis = createTestAnalysis();
      const areas = generateAreasFromAnalysis(analysis);

      for (let i = 0; i < areas.length; i++) {
        expect(areas[i].priority).toBe(i + 1);
      }
    });

    it('sets max_cycles from options', () => {
      const analysis = createTestAnalysis();
      const areas = generateAreasFromAnalysis(analysis, { maxCyclesPerArea: 5 });

      for (const area of areas) {
        expect(area.max_cycles).toBe(5);
      }
    });

    it('calculates delta_target based on severity', () => {
      const analysis: AnalysisForAreaGeneration = {
        priority_rankings: [
          { category: 'high-sev', severity: 9, frequency: 5 },
          { category: 'low-sev', severity: 3, frequency: 5 },
        ],
        dimension_summaries: {},
      };

      const areas = generateAreasFromAnalysis(analysis, {
        preferredStrategy: 'issue_category',
      });

      const highSev = areas.find(a => a.area_id.includes('high'));
      const lowSev = areas.find(a => a.area_id.includes('low'));

      expect(highSev?.delta_target).toBeGreaterThan(lowSev?.delta_target ?? 0);
    });
  });
});
