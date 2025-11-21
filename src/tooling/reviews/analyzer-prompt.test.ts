import { describe, it, expect } from 'vitest';
import { generateAnalyzerPrompt } from './analyzer-prompt.js';

describe('Analyzer Prompt Generator', () => {
  it('generates prompt with review summaries', () => {
    const reviews = [
      {
        id: 1,
        campaign_id: 'campaign-123',
        persona_id: 'core-sarah',
        review_data: JSON.stringify({
          ratings: {
            clarity_readability: 8,
            rules_accuracy: 9,
            persona_fit: 7,
            practical_usability: 8,
          },
          narrative_feedback: 'Great content!',
          issue_annotations: [
            {
              section: 'Combat',
              issue: 'Unclear',
              impact: 'Confusion',
              location: 'Page 1',
            },
          ],
          overall_assessment: 'Good',
        }),
        agent_execution_time: null,
        status: 'completed' as const,
        created_at: new Date().toISOString(),
      },
    ];

    const profiles = new Map([
      [
        'core-sarah',
        {
          name: 'Sarah',
          archetype: 'Explorer',
          experience_level: 'Newbie',
        },
      ],
    ]);

    const prompt = generateAnalyzerPrompt({
      campaignId: 'campaign-123',
      contentTitle: 'Test Book',
      reviews,
      personaProfiles: profiles,
    });

    expect(prompt).toContain('Sarah');
    expect(prompt).toContain('Explorer');
    expect(prompt).toContain('8/10');
    expect(prompt).toContain('priority_rankings');
    expect(prompt).toContain('dimension_summaries');
    expect(prompt).toContain('executive_summary');
  });

  it('includes all reviews in summary', () => {
    const reviews = [
      {
        id: 1,
        campaign_id: 'campaign-123',
        persona_id: 'core-sarah',
        review_data: JSON.stringify({
          ratings: {
            clarity_readability: 8,
            rules_accuracy: 9,
            persona_fit: 7,
            practical_usability: 8,
          },
          narrative_feedback: 'Feedback 1',
          issue_annotations: [
            {
              section: 'A',
              issue: 'B',
              impact: 'C',
              location: 'D',
            },
          ],
          overall_assessment: 'Good',
        }),
        agent_execution_time: null,
        status: 'completed' as const,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        campaign_id: 'campaign-123',
        persona_id: 'core-alex',
        review_data: JSON.stringify({
          ratings: {
            clarity_readability: 7,
            rules_accuracy: 8,
            persona_fit: 6,
            practical_usability: 7,
          },
          narrative_feedback: 'Feedback 2',
          issue_annotations: [
            {
              section: 'E',
              issue: 'F',
              impact: 'G',
              location: 'H',
            },
          ],
          overall_assessment: 'Decent',
        }),
        agent_execution_time: null,
        status: 'completed' as const,
        created_at: new Date().toISOString(),
      },
    ];

    const profiles = new Map([
      [
        'core-sarah',
        {
          name: 'Sarah',
          archetype: 'Explorer',
          experience_level: 'Newbie',
        },
      ],
      [
        'core-alex',
        {
          name: 'Alex',
          archetype: 'Tactician',
          experience_level: 'Veteran',
        },
      ],
    ]);

    const prompt = generateAnalyzerPrompt({
      campaignId: 'campaign-123',
      contentTitle: 'Test Book',
      reviews,
      personaProfiles: profiles,
    });

    expect(prompt).toContain('Sarah');
    expect(prompt).toContain('Alex');
    expect(prompt).toContain('Feedback 1');
    expect(prompt).toContain('Feedback 2');
  });
});
