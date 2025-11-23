import { describe, it, expect } from 'vitest';
import {
  DomainExpertInvoker,
  DomainExpertReviewResult,
  DomainExpertIssue,
  DomainExpertInvokerOptions
} from './invoker-domain-expert';

describe('DomainExpertInvoker', () => {
  it('should have correct interface structure', () => {
    const invoker = new DomainExpertInvoker();
    expect(invoker).toBeDefined();
    expect(typeof invoker.invoke).toBe('function');
  });

  it('should define DomainExpertReviewResult type correctly', () => {
    const result: DomainExpertReviewResult = {
      approved: true,
      issues: [],
      summary: 'Content reviewed with no issues found'
    };
    expect(result.approved).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.summary).toBe('Content reviewed with no issues found');
  });

  it('should define DomainExpertIssue type correctly', () => {
    const issue: DomainExpertIssue = {
      type: 'rules_contradiction',
      description: 'Test issue description',
      location: 'Chapter 1, Section 2',
      impact: 'major'
    };
    expect(issue.type).toBe('rules_contradiction');
    expect(issue.description).toBe('Test issue description');
    expect(issue.location).toBe('Chapter 1, Section 2');
    expect(issue.impact).toBe('major');
  });

  it('should accept all valid issue types', () => {
    const issueTypes: DomainExpertIssue['type'][] = [
      'rules_contradiction',
      'term_inconsistency',
      'balance_concern',
      'missing_reference'
    ];

    issueTypes.forEach(type => {
      const issue: DomainExpertIssue = {
        type,
        description: `Test ${type}`,
        location: 'test location',
        impact: 'minor'
      };
      expect(issue.type).toBe(type);
    });
  });

  it('should accept all valid impact levels', () => {
    const impactLevels: DomainExpertIssue['impact'][] = [
      'critical',
      'major',
      'minor'
    ];

    impactLevels.forEach(impact => {
      const issue: DomainExpertIssue = {
        type: 'rules_contradiction',
        description: `Test ${impact}`,
        location: 'test location',
        impact
      };
      expect(issue.impact).toBe(impact);
    });
  });

  it('should define DomainExpertInvokerOptions correctly', () => {
    const options: DomainExpertInvokerOptions = {
      chapterPaths: ['/path/to/chapter1.md', '/path/to/chapter2.md'],
      mechanicsGuide: 'Game mechanics guide content',
      rulesDocPath: '/path/to/rules.md'
    };

    expect(options.chapterPaths).toHaveLength(2);
    expect(options.mechanicsGuide).toBe('Game mechanics guide content');
    expect(options.rulesDocPath).toBe('/path/to/rules.md');
  });

  it('should allow optional rulesDocPath', () => {
    const options: DomainExpertInvokerOptions = {
      chapterPaths: ['/path/to/chapter.md'],
      mechanicsGuide: 'Mechanics guide'
    };

    expect(options.rulesDocPath).toBeUndefined();
  });

  it('should handle review result with multiple issues', () => {
    const result: DomainExpertReviewResult = {
      approved: false,
      issues: [
        {
          type: 'rules_contradiction',
          description: 'Ability X contradicts rule Y',
          location: 'Chapter 3, Abilities section',
          impact: 'critical'
        },
        {
          type: 'term_inconsistency',
          description: 'Term "mana" used instead of "essence"',
          location: 'Chapter 5, paragraph 2',
          impact: 'minor'
        },
        {
          type: 'balance_concern',
          description: 'Spell damage seems too high',
          location: 'Chapter 7, Spell List',
          impact: 'major'
        },
        {
          type: 'missing_reference',
          description: 'References undefined status effect "Dazed"',
          location: 'Chapter 2, Combat section',
          impact: 'major'
        }
      ],
      summary: 'Multiple issues found requiring attention before approval'
    };

    expect(result.approved).toBe(false);
    expect(result.issues).toHaveLength(4);
    expect(result.issues.filter(i => i.impact === 'critical')).toHaveLength(1);
    expect(result.issues.filter(i => i.impact === 'major')).toHaveLength(2);
    expect(result.issues.filter(i => i.impact === 'minor')).toHaveLength(1);
  });
});
