// src/tooling/w2/prompt-writer.ts

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface W2PromptWriterOptions {
  runId: string;
  baseDir?: string;
}

/**
 * Writes prompt files for W2 workflow steps.
 * Claude Code reads these prompts to execute each step.
 */
export class W2PromptWriter {
  private promptsDir: string;

  constructor(options: W2PromptWriterOptions) {
    const baseDir = options.baseDir || 'data/w2-prompts';
    this.promptsDir = join(baseDir, options.runId);
    mkdirSync(this.promptsDir, { recursive: true });
  }

  writePmReviewPrompt(content: string): string {
    const path = join(this.promptsDir, 'pm-review.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeLayoutPrompt(content: string): string {
    const path = join(this.promptsDir, 'layout.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeDesignPrompt(content: string): string {
    const path = join(this.promptsDir, 'design.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeCreatePdfPrompt(content: string): string {
    const path = join(this.promptsDir, 'create-pdf.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeEditorReviewPrompt(content: string): string {
    const path = join(this.promptsDir, 'editor-review.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  writeDeriveDigitalPrompt(content: string): string {
    const path = join(this.promptsDir, 'derive-digital.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }

  getPromptsDir(): string {
    return this.promptsDir;
  }
}
