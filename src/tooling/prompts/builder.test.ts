// src/tooling/prompts/builder.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { PromptBuilder, interpolate, loadTemplate } from './builder.js';

describe('PromptBuilder', () => {
  describe('basic building', () => {
    it('should create prompt with title', () => {
      const prompt = new PromptBuilder('Test Prompt').build();
      expect(prompt).toBe('# Test Prompt\n');
    });

    it('should add context items', () => {
      const prompt = new PromptBuilder('Test')
        .context({ Book: 'Core Rules', Version: '1.0' })
        .build();

      expect(prompt).toContain('## Context');
      expect(prompt).toContain('**Book:** Core Rules');
      expect(prompt).toContain('**Version:** 1.0');
    });

    it('should add sections with different levels', () => {
      const prompt = new PromptBuilder('Test')
        .section('Level 2', 'Content 2', 2)
        .section('Level 3', 'Content 3', 3)
        .build();

      expect(prompt).toContain('### Level 2');
      expect(prompt).toContain('#### Level 3');
    });
  });

  describe('code blocks', () => {
    it('should add code block with section title', () => {
      const prompt = new PromptBuilder('Test')
        .codeBlock('bash', 'echo hello', 'Example')
        .build();

      expect(prompt).toContain('### Example');
      expect(prompt).toContain('```bash\necho hello\n```');
    });

    it('should append code block to last section', () => {
      const prompt = new PromptBuilder('Test')
        .section('Commands', 'Run these:')
        .codeBlock('bash', 'npm install')
        .build();

      expect(prompt).toContain('Run these:');
      expect(prompt).toContain('```bash\nnpm install\n```');
    });
  });

  describe('lists and tables', () => {
    it('should add list items', () => {
      const prompt = new PromptBuilder('Test')
        .list(['Item 1', 'Item 2', 'Item 3'], 'Todo')
        .build();

      expect(prompt).toContain('### Todo');
      expect(prompt).toContain('- Item 1');
      expect(prompt).toContain('- Item 2');
      expect(prompt).toContain('- Item 3');
    });

    it('should add key-value table', () => {
      const prompt = new PromptBuilder('Test')
        .table([
          { key: 'Name', value: 'Test Book' },
          { key: 'Version', value: '1.0.0' },
        ], 'Details')
        .build();

      expect(prompt).toContain('**Name:** Test Book');
      expect(prompt).toContain('**Version:** 1.0.0');
    });
  });

  describe('buildWithMeta', () => {
    it('should return prompt with metadata', () => {
      const result = new PromptBuilder('Test')
        .section('One', 'Content 1')
        .section('Two', 'Content 2')
        .buildWithMeta();

      expect(result.sectionCount).toBe(2);
      expect(result.charCount).toBeGreaterThan(0);
      expect(result.prompt).toContain('# Test');
    });
  });
});

describe('interpolate', () => {
  it('should replace variables', () => {
    const result = interpolate('Hello {{name}}, you have {{count}} messages', {
      name: 'Alice',
      count: 5,
    });
    expect(result).toBe('Hello Alice, you have 5 messages');
  });

  it('should preserve unknown variables', () => {
    const result = interpolate('Hello {{name}}, {{unknown}}', { name: 'Bob' });
    expect(result).toBe('Hello Bob, {{unknown}}');
  });

  it('should handle boolean values', () => {
    const result = interpolate('Active: {{active}}', { active: true });
    expect(result).toBe('Active: true');
  });
});

describe('loadTemplate', () => {
  const testDir = '/tmp/prompt-builder-test';

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    writeFileSync(
      join(testDir, 'template.md'),
      'Hello {{name}}, welcome to {{place}}!'
    );
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should load and interpolate template', () => {
    const result = loadTemplate(join(testDir, 'template.md'), {
      name: 'User',
      place: 'Razorweave',
    });
    expect(result).toBe('Hello User, welcome to Razorweave!');
  });

  it('should throw for missing template', () => {
    expect(() => loadTemplate('/nonexistent.md', {})).toThrow('Template not found');
  });

  it('should use basePath option', () => {
    const result = loadTemplate('template.md', { name: 'Test', place: 'Here' }, {
      basePath: testDir,
    });
    expect(result).toBe('Hello Test, welcome to Here!');
  });
});

describe('PromptBuilder file operations', () => {
  const testDir = '/tmp/prompt-builder-file-test';

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    writeFileSync(join(testDir, 'content.md'), 'File content here');
    writeFileSync(join(testDir, 'style.md'), 'Style guide content');
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should load section from file', () => {
    const prompt = new PromptBuilder('Test')
      .sectionFromFile('Content', join(testDir, 'content.md'))
      .build();

    expect(prompt).toContain('### Content');
    expect(prompt).toContain('File content here');
  });

  it('should skip optional missing file', () => {
    const prompt = new PromptBuilder('Test')
      .sectionFromFile('Missing', join(testDir, 'missing.md'), { optional: true })
      .build();

    expect(prompt).not.toContain('Missing');
  });

  it('should throw for required missing file', () => {
    expect(() => {
      new PromptBuilder('Test')
        .sectionFromFile('Missing', join(testDir, 'missing.md'))
        .build();
    }).toThrow('Prompt file not found');
  });

  it('should load multiple files from directory', () => {
    const prompt = new PromptBuilder('Test')
      .sectionsFromDir('Guides', testDir, [
        { name: 'Content Guide', filename: 'content.md' },
        { name: 'Style Guide', filename: 'style.md' },
      ])
      .build();

    expect(prompt).toContain('### Guides');
    expect(prompt).toContain('Content Guide');
    expect(prompt).toContain('Style Guide');
    expect(prompt).toContain('File content here');
    expect(prompt).toContain('Style guide content');
  });
});
