import { describe, it, expect } from 'vitest';
import { ReleaseNotesInvoker, ReleaseNotesOutput, ChapterChange } from './invoker-release-notes';

describe('ReleaseNotesInvoker', () => {
  it('should have correct interface structure', () => {
    const invoker = new ReleaseNotesInvoker();
    expect(invoker).toBeDefined();
    expect(typeof invoker.invoke).toBe('function');
  });

  it('should define ReleaseNotesOutput type correctly', () => {
    const output: ReleaseNotesOutput = {
      title: 'Version 1.0.0 Release Notes',
      version: '1.0.0',
      date: '2024-01-15',
      summary: 'Test summary of changes',
      highlights: ['First highlight', 'Second highlight'],
      changes: [
        { chapter: 'Chapter 1', description: 'Test change description' }
      ],
      metrics_improvement: 'Quality improved by 20%',
      known_issues: ['Issue 1'],
      markdown: '# Release Notes\n\nTest content'
    };

    expect(output.title).toBe('Version 1.0.0 Release Notes');
    expect(output.version).toBe('1.0.0');
    expect(output.date).toBe('2024-01-15');
    expect(output.summary).toBe('Test summary of changes');
    expect(output.highlights).toHaveLength(2);
    expect(output.changes).toHaveLength(1);
    expect(output.metrics_improvement).toBe('Quality improved by 20%');
    expect(output.known_issues).toHaveLength(1);
    expect(output.markdown).toContain('# Release Notes');
  });

  it('should define ChapterChange type correctly', () => {
    const change: ChapterChange = {
      chapter: 'Chapter 6: Character Creation',
      description: 'Made character creation easier to follow'
    };

    expect(change.chapter).toBe('Chapter 6: Character Creation');
    expect(change.description).toBe('Made character creation easier to follow');
  });

  it('should allow empty arrays for highlights and known_issues', () => {
    const output: ReleaseNotesOutput = {
      title: 'Version 1.0.1 Patch Notes',
      version: '1.0.1',
      date: '2024-01-20',
      summary: 'Minor fixes',
      highlights: [],
      changes: [],
      metrics_improvement: 'No significant change',
      known_issues: [],
      markdown: '# Patch Notes'
    };

    expect(output.highlights).toHaveLength(0);
    expect(output.changes).toHaveLength(0);
    expect(output.known_issues).toHaveLength(0);
  });

  it('should support multiple chapter changes', () => {
    const output: ReleaseNotesOutput = {
      title: 'Major Update',
      version: '2.0.0',
      date: '2024-02-01',
      summary: 'Comprehensive update across multiple chapters',
      highlights: ['New examples', 'Better organization', 'Clearer language'],
      changes: [
        { chapter: 'Chapter 1', description: 'Rewrote introduction' },
        { chapter: 'Chapter 2', description: 'Added quick-reference tables' },
        { chapter: 'Chapter 3', description: 'Expanded examples section' }
      ],
      metrics_improvement: 'Overall quality up 35%',
      known_issues: ['Appendix needs updating', 'Some cross-references incomplete'],
      markdown: '# Major Update\n\n## Summary\n\nComprehensive update'
    };

    expect(output.changes).toHaveLength(3);
    expect(output.changes[0].chapter).toBe('Chapter 1');
    expect(output.changes[1].chapter).toBe('Chapter 2');
    expect(output.changes[2].chapter).toBe('Chapter 3');
  });
});
