// src/tooling/w1/prompt-writer.ts
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface PromptWriterOptions {
  runId: string;
  baseDir?: string;
}

export class W1PromptWriter {
  private promptsDir: string;

  constructor(options: PromptWriterOptions) {
    const baseDir = options.baseDir || 'data/w1-prompts';
    this.promptsDir = join(baseDir, options.runId);
    mkdirSync(this.promptsDir, { recursive: true });
  }

  writePlanningPrompt(content: string): string {
    const path = join(this.promptsDir, 'pm-planning.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeWriterPrompt(content: string, chapterId?: string): string {
    const filename = chapterId ? `writer-${chapterId}.txt` : 'writer.txt';
    const path = join(this.promptsDir, filename);
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeEditorPrompt(content: string): string {
    const path = join(this.promptsDir, 'editor-review.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeDomainExpertPrompt(content: string): string {
    const path = join(this.promptsDir, 'domain-expert.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeMetricsPrompt(content: string): string {
    const path = join(this.promptsDir, 'pm-metrics.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeReleaseNotesPrompt(content: string): string {
    const path = join(this.promptsDir, 'release-notes.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  getPromptsDir(): string {
    return this.promptsDir;
  }
}
