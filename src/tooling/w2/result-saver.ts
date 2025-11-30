// src/tooling/w2/result-saver.ts

import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type Database from 'better-sqlite3';
import { ArtifactRegistry } from '../workflows/artifact-registry.js';
import type {
  PmReviewResult,
  LayoutPlan,
  DesignPlan,
  ImagePromptsResult,
  EditorReviewResult,
} from './types.js';

/**
 * Saves W2 workflow results and registers artifacts.
 */
export class W2ResultSaver {
  private runId: string;
  private artifactRegistry: ArtifactRegistry;

  constructor(db: Database.Database, runId: string) {
    this.runId = runId;
    this.artifactRegistry = new ArtifactRegistry(db);
  }

  savePmReviewResult(result: PmReviewResult, outputPath: string): void {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'qa_report',
      artifactPath: outputPath,
      metadata: {
        w2_type: 'pm_review',
        priority_sections_count: result.priority_sections.length,
      },
    });
  }

  saveLayoutPlan(plan: LayoutPlan, outputPath: string): void {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(plan, null, 2), 'utf-8');

    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'layout_plan',
      artifactPath: outputPath,
      metadata: {
        page_breaks_count: plan.page_breaks.length,
        table_strategy: plan.table_strategy,
      },
    });
  }

  saveDesignPlan(plan: DesignPlan, outputPath: string): void {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(plan, null, 2), 'utf-8');

    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'design_plan',
      artifactPath: outputPath,
      metadata: {
        typography_body: plan.typography.body,
        accent_color: plan.colors.accent,
      },
    });
  }

  saveImagePrompts(prompts: ImagePromptsResult, outputPath: string): void {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(prompts, null, 2), 'utf-8');

    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'qa_report',
      artifactPath: outputPath,
      metadata: {
        w2_type: 'image_prompts',
        prompts_count: prompts.prompts.length,
      },
    });
  }

  saveEditorReviewResult(result: EditorReviewResult, outputPath: string): void {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'qa_report',
      artifactPath: outputPath,
      metadata: {
        w2_type: 'editor_review',
        approved: result.approved,
        issues_count: result.issues.length,
      },
    });
  }

  savePrintPdf(pdfPath: string): void {
    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'pdf_print',
      artifactPath: pdfPath,
      metadata: {
        variant: 'print',
      },
    });
  }

  saveDigitalPdf(pdfPath: string): void {
    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'pdf_digital',
      artifactPath: pdfPath,
      metadata: {
        variant: 'digital',
      },
    });
  }

  saveDraftPdf(pdfPath: string): void {
    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'pdf_draft',
      artifactPath: pdfPath,
      metadata: {
        variant: 'draft',
      },
    });
  }
}
