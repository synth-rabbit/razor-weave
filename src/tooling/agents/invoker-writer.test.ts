import { describe, it, expect } from 'vitest';
import {
  WriterInvoker,
  WriterOutput,
  WriterInvokerOptions,
  UpdatedChapter,
  ChapterChangelog,
  ChapterChange,
} from './invoker-writer';

describe('WriterInvoker', () => {
  it('should have correct interface structure', () => {
    const invoker = new WriterInvoker();
    expect(invoker).toBeDefined();
    expect(typeof invoker.invoke).toBe('function');
  });

  it('should define WriterOutput type correctly', () => {
    const output: WriterOutput = {
      updated_chapters: [
        {
          chapter_id: '06-character-creation',
          chapter_path: 'chapters/06-character-creation.md',
          content: '# Character Creation\n\nUpdated content here...',
        },
      ],
      changelog: [
        {
          chapter_id: '06-character-creation',
          changes: [
            {
              type: 'clarify',
              target: 'Opening paragraphs',
              before_summary: 'Dense TTRPG jargon',
              after_summary: 'Plain language introduction',
            },
          ],
        },
      ],
    };

    expect(output.updated_chapters).toHaveLength(1);
    expect(output.updated_chapters[0].chapter_id).toBe('06-character-creation');
    expect(output.changelog).toHaveLength(1);
    expect(output.changelog[0].changes).toHaveLength(1);
  });

  it('should define UpdatedChapter type correctly', () => {
    const chapter: UpdatedChapter = {
      chapter_id: 'test-chapter',
      chapter_path: '/path/to/chapter.md',
      content: '# Test Chapter\n\nContent here.',
    };

    expect(chapter.chapter_id).toBe('test-chapter');
    expect(chapter.chapter_path).toBe('/path/to/chapter.md');
    expect(chapter.content).toContain('# Test Chapter');
  });

  it('should define ChapterChangelog type correctly', () => {
    const changelog: ChapterChangelog = {
      chapter_id: 'test-chapter',
      changes: [
        {
          type: 'expand',
          target: 'Examples section',
          before_summary: 'One example',
          after_summary: 'Three examples added',
        },
        {
          type: 'fix_mechanics',
          target: 'Dice roll formula',
          before_summary: 'Incorrect modifier',
          after_summary: 'Corrected to +2',
        },
      ],
    };

    expect(changelog.chapter_id).toBe('test-chapter');
    expect(changelog.changes).toHaveLength(2);
  });

  it('should define ChapterChange type correctly', () => {
    const change: ChapterChange = {
      type: 'restructure',
      target: 'Combat section',
      before_summary: 'Single long section',
      after_summary: 'Split into subsections for clarity',
    };

    expect(change.type).toBe('restructure');
    expect(change.target).toBe('Combat section');
    expect(change.before_summary).toBeDefined();
    expect(change.after_summary).toBeDefined();
  });

  it('should define WriterInvokerOptions type correctly', () => {
    const options: WriterInvokerOptions = {
      planPath: '/path/to/plan.json',
      chapterPaths: ['/path/to/chapter1.md', '/path/to/chapter2.md'],
      styleGuidesDir: '/path/to/style-guides',
    };

    expect(options.planPath).toBe('/path/to/plan.json');
    expect(options.chapterPaths).toHaveLength(2);
    expect(options.styleGuidesDir).toBe('/path/to/style-guides');
  });

  it('should allow optional styleGuidesDir', () => {
    const options: WriterInvokerOptions = {
      planPath: '/path/to/plan.json',
      chapterPaths: ['/path/to/chapter.md'],
    };

    expect(options.planPath).toBeDefined();
    expect(options.chapterPaths).toBeDefined();
    expect(options.styleGuidesDir).toBeUndefined();
  });
});
