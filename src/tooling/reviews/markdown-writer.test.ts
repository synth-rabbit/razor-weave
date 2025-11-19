import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync, rmSync, existsSync } from 'fs';
import { writeReviewMarkdown, writeAnalysisMarkdown } from './markdown-writer.js';

describe('Markdown Writer', () => {
  const testOutputPath = 'data/test/reviews/test-review.md';

  afterEach(() => {
    if (existsSync('data/test')) {
      rmSync('data/test', { recursive: true, force: true });
    }
  });

  it('writes review markdown with all sections', () => {
    writeReviewMarkdown(
      {
        campaignId: 'campaign-test-123',
        personaName: 'Sarah',
        personaArchetype: 'Explorer',
        personaExperience: 'Newbie (0-1 years)',
        personaTraits: ['Curious', 'Visual Thinker'],
        contentTitle: 'Core Rulebook v1.2',
        reviewData: {
          ratings: {
            clarity_readability: 8,
            rules_accuracy: 9,
            persona_fit: 7,
            practical_usability: 8,
          },
          narrative_feedback: 'Great content overall!',
          issue_annotations: [
            {
              section: 'Combat',
              issue: 'Initiative unclear',
              impact: 'Confusion in first session',
              location: 'Page 42',
            },
          ],
          overall_assessment: 'Solid work with minor issues',
        },
      },
      testOutputPath
    );

    expect(existsSync(testOutputPath)).toBe(true);

    const content = readFileSync(testOutputPath, 'utf-8');
    expect(content).toContain('# Review: Sarah - Core Rulebook v1.2');
    expect(content).toContain('Explorer');
    expect(content).toContain('8/10');
    expect(content).toContain('Great content overall!');
    expect(content).toContain('Initiative unclear');
  });

  it('writes analysis markdown with all sections', () => {
    const testAnalysisPath = 'data/test/reviews/analysis/campaign-test-123.md';

    writeAnalysisMarkdown({
      campaignId: 'campaign-test-123',
      campaignName: 'Core Rulebook Review v1.2',
      contentType: 'book',
      contentTitle: 'Core Rulebook',
      personaCount: 5,
      outputPath: testAnalysisPath,
      analysisData: {
        executive_summary: 'This campaign identified several key areas for improvement across clarity and rules accuracy dimensions.',
        priority_rankings: [
          {
            category: 'Initiative Rules',
            severity: 8,
            frequency: 4,
            affected_personas: ['Sarah', 'Mike', 'Jennifer', 'Alex'],
            description: 'Initiative rules are unclear and caused confusion during first sessions',
          },
          {
            category: 'Spell Components',
            severity: 6,
            frequency: 2,
            affected_personas: ['Sarah', 'Mike'],
            description: 'Spell component requirements not clearly explained',
          },
        ],
        dimension_summaries: {
          clarity_readability: {
            average: 7.5,
            themes: ['Generally clear', 'Some technical jargon'],
          },
          rules_accuracy: {
            average: 8.2,
            themes: ['Accurate rules', 'Missing edge cases'],
          },
          persona_fit: {
            average: 7.0,
            themes: ['Good for veterans', 'Challenging for beginners'],
          },
          practical_usability: {
            average: 7.8,
            themes: ['Easy to reference', 'Index could be better'],
          },
        },
        persona_breakdowns: {
          'Beginners': {
            strengths: ['Visual aids helpful', 'Step-by-step examples clear'],
            struggles: ['Too much jargon', 'Missing quick start guide'],
          },
          'Veterans': {
            strengths: ['Comprehensive rules', 'Good edge case coverage'],
            struggles: ['Could be more concise', 'Some redundancy'],
          },
        },
        trend_analysis: 'Improvement over previous version in clarity (+0.5 average), but rules accuracy remained stable.',
      },
      createdAt: '2025-01-15T10:30:00.000Z',
    });

    expect(existsSync(testAnalysisPath)).toBe(true);

    const content = readFileSync(testAnalysisPath, 'utf-8');

    // Check header
    expect(content).toContain('# Campaign Analysis: Core Rulebook Review v1.2');
    expect(content).toContain('Date: 2025-01-15T10:30:00.000Z');
    expect(content).toContain('Personas: 5');
    expect(content).toContain('Content: Core Rulebook');

    // Check executive summary
    expect(content).toContain('## Executive Summary');
    expect(content).toContain('This campaign identified several key areas');

    // Check priority rankings
    expect(content).toContain('## Priority Rankings');
    expect(content).toContain('**Initiative Rules**');
    expect(content).toContain('Severity: 8');
    expect(content).toContain('Frequency: 4/5');
    expect(content).toContain('Affected personas: Sarah, Mike, Jennifer, Alex');

    // Check dimension summaries
    expect(content).toContain('## Dimension Summaries');
    expect(content).toContain('### Clarity & Readability');
    expect(content).toContain('Average: 7.5/10');
    expect(content).toContain('Common themes: Generally clear, Some technical jargon');
    expect(content).toContain('### Rules Accuracy');
    expect(content).toContain('Average: 8.2/10');

    // Check persona breakdowns
    expect(content).toContain('## Persona Breakdowns');
    expect(content).toContain('### Beginners (4 items)');
    expect(content).toContain('Strengths: Visual aids helpful, Step-by-step examples clear');
    expect(content).toContain('Struggles: Too much jargon, Missing quick start guide');

    // Check trend analysis
    expect(content).toContain('## Trend Analysis');
    expect(content).toContain('Improvement over previous version');
  });
});
