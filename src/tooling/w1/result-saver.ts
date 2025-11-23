// src/tooling/w1/result-saver.ts
import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type Database from 'better-sqlite3';
import { WorkflowRepository } from '../workflows/repository.js';
import { ArtifactRegistry } from '../workflows/artifact-registry.js';

export interface PlanningResult {
  plan: Record<string, unknown>;
  outputPath: string;
}

export interface ContentModifyResult {
  chapterPaths: string[];
  changelog: Array<{
    chapterId: string;
    changes: Array<{ type: string; target: string; summary: string }>;
  }>;
}

export interface ReviewResult {
  approved: boolean;
  feedback: Array<{ issue: string; location: string; suggestion: string; severity: string }>;
  summary: string;
}

export class W1ResultSaver {
  private runId: string;
  private workflowRepo: WorkflowRepository;
  private artifactRegistry: ArtifactRegistry;

  constructor(db: Database.Database, runId: string) {
    this.runId = runId;
    this.workflowRepo = new WorkflowRepository(db);
    this.artifactRegistry = new ArtifactRegistry(db);
  }

  savePlanningResult(result: PlanningResult): void {
    // Ensure directory exists
    mkdirSync(dirname(result.outputPath), { recursive: true });

    // Write plan JSON
    writeFileSync(result.outputPath, JSON.stringify(result.plan, null, 2), 'utf-8');

    // Register artifact (using 'design_plan' as closest existing type)
    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'design_plan',
      artifactPath: result.outputPath,
      metadata: {
        w1_type: 'improvement_plan',
        plan_id: result.plan.plan_id
      },
    });

    // Update workflow metadata
    const run = this.workflowRepo.getById(this.runId);
    if (run) {
      // Note: WorkflowRepository doesn't have updateMetadata, but we can update via status
      // For now, the artifact registration provides the linkage
    }
  }

  saveEditorResult(result: ReviewResult, outputPath: string): void {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'qa_report',
      artifactPath: outputPath,
      metadata: {
        w1_type: 'editor_review',
        approved: result.approved
      },
    });
  }

  saveDomainExpertResult(result: ReviewResult, outputPath: string): void {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

    this.artifactRegistry.register({
      workflowRunId: this.runId,
      artifactType: 'qa_report',
      artifactPath: outputPath,
      metadata: {
        w1_type: 'domain_expert_review',
        approved: result.approved
      },
    });
  }

  saveModifiedChapters(result: ContentModifyResult): void {
    // Register each chapter as artifact
    for (const chapterPath of result.chapterPaths) {
      this.artifactRegistry.register({
        workflowRunId: this.runId,
        artifactType: 'chapter',
        artifactPath: chapterPath,
        metadata: { w1_type: 'modified_chapter' },
      });
    }

    // Save changelog
    const changelogPath = `data/w1-artifacts/${this.runId}/changelog.json`;
    mkdirSync(dirname(changelogPath), { recursive: true });
    writeFileSync(changelogPath, JSON.stringify(result.changelog, null, 2), 'utf-8');
  }
}
