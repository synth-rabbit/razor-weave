// src/tooling/w2/w2.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { mkdirSync, writeFileSync, existsSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  generatePmReviewPrompt,
  generateLayoutPrompt,
  generateDesignPrompt,
  generateCreatePdfPrompt,
  generateEditorReviewPrompt,
  generateDeriveDigitalPrompt,
  generateStrategicPrompt,
} from './prompt-generator.js';
import { W2ResultSaver } from './result-saver.js';
import { w2PdfWorkflow } from '../workflows/w2-workflow.js';
import type {
  PmReviewResult,
  LayoutPlan,
  DesignPlan,
  ImagePromptsResult,
  EditorReviewResult,
} from './types.js';

describe('W2 Integration Tests', () => {
  let db: Database.Database;
  let testDir: string;

  beforeEach(() => {
    // Create in-memory database
    db = new Database(':memory:');

    // Create workflow_artifacts table
    db.exec(`
      CREATE TABLE workflow_artifacts (
        id TEXT PRIMARY KEY,
        workflow_run_id TEXT NOT NULL,
        artifact_type TEXT NOT NULL CHECK(
          artifact_type IN (
            'chapter', 'release_notes', 'print_html', 'web_html',
            'pdf_draft', 'pdf_digital', 'pdf_print',
            'layout_plan', 'design_plan', 'deployment',
            'qa_report', 'marketing_copy', 'announcement',
            'playtest_session', 'playtest_analysis', 'playtest_feedback'
          )
        ),
        artifact_path TEXT NOT NULL,
        metadata TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create test directory
    testDir = join(process.cwd(), 'data', 'test-w2', `test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    db.close();

    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Prompt Generators', () => {
    describe('generatePmReviewPrompt', () => {
      it('returns a valid prompt with all required sections', () => {
        const prompt = generatePmReviewPrompt({
          runId: 'test-run-123',
          bookSlug: 'core-v1.3.0',
          bookTitle: 'Razorweave Core',
          htmlPath: '/path/to/book.html',
          releaseNotesPath: '/non-existent/notes.json',
        });

        expect(prompt).toContain('W2 PM Review Task');
        expect(prompt).toContain('test-run-123');
        expect(prompt).toContain('Razorweave Core');
        expect(prompt).toContain('core-v1.3.0');
        expect(prompt).toContain('/path/to/book.html');
        expect(prompt).toContain('Content is FROZEN');
        expect(prompt).toContain('priority_sections');
        expect(prompt).toContain('focus_areas');
        expect(prompt).toContain('constraints');
      });

      it('includes release notes content when file exists', () => {
        const notesPath = join(testDir, 'release-notes.json');
        const notesContent = JSON.stringify({ changes: ['test change'] });
        writeFileSync(notesPath, notesContent, 'utf-8');

        const prompt = generatePmReviewPrompt({
          runId: 'test-run-123',
          bookSlug: 'core-v1.3.0',
          bookTitle: 'Razorweave Core',
          htmlPath: '/path/to/book.html',
          releaseNotesPath: notesPath,
        });

        expect(prompt).toContain(notesContent);
        expect(prompt).not.toContain('No release notes available');
      });

      it('shows fallback message when release notes do not exist', () => {
        const prompt = generatePmReviewPrompt({
          runId: 'test-run-123',
          bookSlug: 'core-v1.3.0',
          bookTitle: 'Razorweave Core',
          htmlPath: '/path/to/book.html',
          releaseNotesPath: '/non-existent/notes.json',
        });

        expect(prompt).toContain('_No release notes available_');
      });
    });

    describe('generateLayoutPrompt', () => {
      it('returns a valid prompt with all required sections', () => {
        const prompt = generateLayoutPrompt({
          runId: 'test-run-123',
          bookSlug: 'core-v1.3.0',
          htmlPath: '/path/to/book.html',
          pmReviewPath: '/non-existent/pm-review.json',
        });

        expect(prompt).toContain('W2 Layout Planning Task');
        expect(prompt).toContain('test-run-123');
        expect(prompt).toContain('core-v1.3.0');
        expect(prompt).toContain('Content is FROZEN');
        expect(prompt).toContain('page_breaks');
        expect(prompt).toContain('margins');
        expect(prompt).toContain('table_strategy');
        expect(prompt).toContain('column_layouts');
      });

      it('includes PM review context when file exists', () => {
        const pmReviewPath = join(testDir, 'pm-review.json');
        const pmReview = JSON.stringify({
          priority_sections: ['chapter-06'],
          focus_areas: ['tables'],
        });
        writeFileSync(pmReviewPath, pmReview, 'utf-8');

        const prompt = generateLayoutPrompt({
          runId: 'test-run-123',
          bookSlug: 'core-v1.3.0',
          htmlPath: '/path/to/book.html',
          pmReviewPath,
        });

        expect(prompt).toContain(pmReview);
        expect(prompt).not.toContain('No PM review available');
      });
    });

    describe('generateDesignPrompt', () => {
      it('returns a valid prompt with all required sections', () => {
        const prompt = generateDesignPrompt({
          runId: 'test-run-123',
          bookSlug: 'core-v1.3.0',
          layoutPlanPath: '/non-existent/layout.json',
          pmReviewPath: '/non-existent/pm-review.json',
        });

        expect(prompt).toContain('W2 Design Planning Task');
        expect(prompt).toContain('test-run-123');
        expect(prompt).toContain('Content is FROZEN');
        expect(prompt).toContain('typography');
        expect(prompt).toContain('colors');
        expect(prompt).toContain('spacing');
        expect(prompt).toContain('image-prompts.json');
      });

      it('includes both layout plan and PM review when they exist', () => {
        const layoutPath = join(testDir, 'layout.json');
        const pmReviewPath = join(testDir, 'pm-review.json');

        writeFileSync(layoutPath, JSON.stringify({ margins: { inner: '1in' } }), 'utf-8');
        writeFileSync(pmReviewPath, JSON.stringify({ focus_areas: ['spacing'] }), 'utf-8');

        const prompt = generateDesignPrompt({
          runId: 'test-run-123',
          bookSlug: 'core-v1.3.0',
          layoutPlanPath: layoutPath,
          pmReviewPath: pmReviewPath,
        });

        expect(prompt).toContain('inner');
        expect(prompt).toContain('spacing');
      });
    });

    describe('generateCreatePdfPrompt', () => {
      it('returns a valid prompt with all required sections', () => {
        const prompt = generateCreatePdfPrompt({
          runId: 'test-run-123',
          bookSlug: 'core-v1.3.0',
          htmlPath: '/path/to/book.html',
          layoutPlanPath: '/path/to/layout.json',
          designPlanPath: '/path/to/design.json',
          assetsPath: null,
          outputPath: '/path/to/output.pdf',
        });

        expect(prompt).toContain('W2 PDF Creation Task');
        expect(prompt).toContain('test-run-123');
        expect(prompt).toContain('Content is FROZEN');
        expect(prompt).toContain('Apply Layout Plan');
        expect(prompt).toContain('Apply Design Plan');
        expect(prompt).toContain('No assets provided yet');
      });

      it('includes assets section when assetsPath is provided', () => {
        const prompt = generateCreatePdfPrompt({
          runId: 'test-run-123',
          bookSlug: 'core-v1.3.0',
          htmlPath: '/path/to/book.html',
          layoutPlanPath: '/path/to/layout.json',
          designPlanPath: '/path/to/design.json',
          assetsPath: '/path/to/assets',
          outputPath: '/path/to/output.pdf',
        });

        expect(prompt).toContain('Assets folder: `/path/to/assets`');
        expect(prompt).not.toContain('No assets provided yet');
      });
    });

    describe('generateEditorReviewPrompt', () => {
      it('returns a valid prompt with all required sections', () => {
        const prompt = generateEditorReviewPrompt({
          runId: 'test-run-123',
          bookSlug: 'core-v1.3.0',
          pdfPath: '/path/to/draft.pdf',
          iteration: 2,
        });

        expect(prompt).toContain('W2 Editor Review Task');
        expect(prompt).toContain('test-run-123');
        expect(prompt).toContain('**Iteration:** 2');
        expect(prompt).toContain('Content is FROZEN');
        expect(prompt).toContain('Page Breaks');
        expect(prompt).toContain('Typography');
        expect(prompt).toContain('Visual Hierarchy');
        expect(prompt).toContain('Print-Readiness');
        expect(prompt).toContain('"approved"');
        expect(prompt).toContain('"issues"');
      });
    });

    describe('generateDeriveDigitalPrompt', () => {
      it('returns a valid prompt with all required sections', () => {
        const prompt = generateDeriveDigitalPrompt({
          runId: 'test-run-123',
          bookSlug: 'core-v1.3.0',
          printPdfPath: '/path/to/print.pdf',
          digitalPdfPath: '/path/to/digital.pdf',
        });

        expect(prompt).toContain('W2 Digital PDF Derivation Task');
        expect(prompt).toContain('test-run-123');
        expect(prompt).toContain('/path/to/print.pdf');
        expect(prompt).toContain('/path/to/digital.pdf');
        expect(prompt).toContain('Remove Print Elements');
        expect(prompt).toContain('Add Digital Features');
        expect(prompt).toContain('Optimize for Screen');
      });
    });

    describe('generateStrategicPrompt', () => {
      it('returns a valid prompt for new workflow', () => {
        const prompt = generateStrategicPrompt({
          planId: 'plan-123',
          workflowRunId: 'run-456',
          bookSlug: 'core-v1.3.0',
          bookTitle: 'Razorweave Core',
          artifactsDir: '/path/to/artifacts',
          htmlPath: '/path/to/book.html',
          releaseNotesPath: '/path/to/notes.json',
          isResume: false,
        });

        expect(prompt).toContain('W2 Strategic Workflow: plan-123');
        expect(prompt).toContain('Razorweave Core');
        expect(prompt).toContain('Content is FROZEN');
        expect(prompt).toContain('Step 1: PM Review');
        expect(prompt).toContain('Step 2: Layout Planning');
        expect(prompt).toContain('Step 6: Human Gate');
        expect(prompt).not.toContain('RESUMING');
      });

      it('includes resume note when isResume is true', () => {
        const prompt = generateStrategicPrompt({
          planId: 'plan-123',
          workflowRunId: 'run-456',
          bookSlug: 'core-v1.3.0',
          bookTitle: 'Razorweave Core',
          artifactsDir: '/path/to/artifacts',
          htmlPath: '/path/to/book.html',
          releaseNotesPath: '/path/to/notes.json',
          isResume: true,
        });

        expect(prompt).toContain('RESUMING');
        expect(prompt).toContain('Check state.json for current progress');
      });
    });
  });

  describe('Result Savers', () => {
    let saver: W2ResultSaver;
    const runId = 'test-run-123';

    beforeEach(() => {
      saver = new W2ResultSaver(db, runId);
    });

    describe('savePmReviewResult', () => {
      it('writes file and registers artifact', () => {
        const result: PmReviewResult = {
          priority_sections: ['chapter-06', 'chapter-10'],
          focus_areas: ['tables need better formatting'],
          constraints: {
            page_budget: null,
            preserve_toc: true,
          },
        };

        const outputPath = join(testDir, 'pm-review.json');
        saver.savePmReviewResult(result, outputPath);

        // Check file was written
        expect(existsSync(outputPath)).toBe(true);
        const savedContent = JSON.parse(readFileSync(outputPath, 'utf-8'));
        expect(savedContent).toEqual(result);

        // Check artifact was registered
        const artifacts = db
          .prepare('SELECT * FROM workflow_artifacts WHERE workflow_run_id = ?')
          .all(runId) as any[];

        expect(artifacts).toHaveLength(1);
        expect(artifacts[0].artifact_type).toBe('qa_report');
        expect(artifacts[0].artifact_path).toBe(outputPath);

        const metadata = JSON.parse(artifacts[0].metadata);
        expect(metadata.w2_type).toBe('pm_review');
        expect(metadata.priority_sections_count).toBe(2);
      });
    });

    describe('saveLayoutPlan', () => {
      it('writes file and registers artifact', () => {
        const plan: LayoutPlan = {
          page_breaks: [
            { before: 'chapter-06', reason: 'new section' },
          ],
          margins: {
            inner: '1in',
            outer: '0.75in',
            top: '0.75in',
            bottom: '0.75in',
          },
          table_strategy: 'allow-page-break-within',
          column_layouts: [
            { section: 'appendix', columns: 2 },
          ],
        };

        const outputPath = join(testDir, 'layout-plan.json');
        saver.saveLayoutPlan(plan, outputPath);

        // Check file was written
        expect(existsSync(outputPath)).toBe(true);
        const savedContent = JSON.parse(readFileSync(outputPath, 'utf-8'));
        expect(savedContent).toEqual(plan);

        // Check artifact was registered
        const artifacts = db
          .prepare('SELECT * FROM workflow_artifacts WHERE workflow_run_id = ?')
          .all(runId) as any[];

        expect(artifacts).toHaveLength(1);
        expect(artifacts[0].artifact_type).toBe('layout_plan');

        const metadata = JSON.parse(artifacts[0].metadata);
        expect(metadata.page_breaks_count).toBe(1);
        expect(metadata.table_strategy).toBe('allow-page-break-within');
      });
    });

    describe('saveDesignPlan', () => {
      it('writes file and registers artifact', () => {
        const plan: DesignPlan = {
          typography: {
            body: '11pt',
            headings_scale: 1.25,
          },
          colors: {
            accent: '#8B4513',
            callout_bg: '#FFF8DC',
          },
          spacing: {
            paragraph: '0.5em',
            section: '2em',
          },
        };

        const outputPath = join(testDir, 'design-plan.json');
        saver.saveDesignPlan(plan, outputPath);

        // Check file was written
        expect(existsSync(outputPath)).toBe(true);
        const savedContent = JSON.parse(readFileSync(outputPath, 'utf-8'));
        expect(savedContent).toEqual(plan);

        // Check artifact was registered
        const artifacts = db
          .prepare('SELECT * FROM workflow_artifacts WHERE workflow_run_id = ?')
          .all(runId) as any[];

        expect(artifacts).toHaveLength(1);
        expect(artifacts[0].artifact_type).toBe('design_plan');

        const metadata = JSON.parse(artifacts[0].metadata);
        expect(metadata.typography_body).toBe('11pt');
        expect(metadata.accent_color).toBe('#8B4513');
      });
    });

    describe('saveImagePrompts', () => {
      it('writes file and registers artifact', () => {
        const prompts: ImagePromptsResult = {
          prompts: [
            {
              id: 'chapter-header-06',
              location: 'Chapter 6 header',
              aspect_ratio: '16:9',
              prompt: 'Fantasy tavern interior, warm candlelight',
            },
            {
              id: 'chapter-header-10',
              location: 'Chapter 10 header',
              aspect_ratio: '3:2',
              prompt: 'Epic battle scene, heroes fighting',
            },
          ],
        };

        const outputPath = join(testDir, 'image-prompts.json');
        saver.saveImagePrompts(prompts, outputPath);

        // Check file was written
        expect(existsSync(outputPath)).toBe(true);
        const savedContent = JSON.parse(readFileSync(outputPath, 'utf-8'));
        expect(savedContent).toEqual(prompts);

        // Check artifact was registered
        const artifacts = db
          .prepare('SELECT * FROM workflow_artifacts WHERE workflow_run_id = ?')
          .all(runId) as any[];

        expect(artifacts).toHaveLength(1);
        expect(artifacts[0].artifact_type).toBe('qa_report');

        const metadata = JSON.parse(artifacts[0].metadata);
        expect(metadata.w2_type).toBe('image_prompts');
        expect(metadata.prompts_count).toBe(2);
      });
    });

    describe('saveEditorReviewResult', () => {
      it('writes file and registers artifact with issues', () => {
        const result: EditorReviewResult = {
          approved: false,
          issues: [
            {
              type: 'layout',
              location: 'page 47',
              problem: 'table split awkwardly across pages',
              suggestion: 'add page break before table',
            },
          ],
        };

        const outputPath = join(testDir, 'editor-review.json');
        saver.saveEditorReviewResult(result, outputPath);

        // Check file was written
        expect(existsSync(outputPath)).toBe(true);
        const savedContent = JSON.parse(readFileSync(outputPath, 'utf-8'));
        expect(savedContent).toEqual(result);

        // Check artifact was registered
        const artifacts = db
          .prepare('SELECT * FROM workflow_artifacts WHERE workflow_run_id = ?')
          .all(runId) as any[];

        expect(artifacts).toHaveLength(1);
        expect(artifacts[0].artifact_type).toBe('qa_report');

        const metadata = JSON.parse(artifacts[0].metadata);
        expect(metadata.w2_type).toBe('editor_review');
        expect(metadata.approved).toBe(false);
        expect(metadata.issues_count).toBe(1);
      });

      it('handles approved review with no issues', () => {
        const result: EditorReviewResult = {
          approved: true,
          issues: [],
        };

        const outputPath = join(testDir, 'editor-review-approved.json');
        saver.saveEditorReviewResult(result, outputPath);

        const artifacts = db
          .prepare('SELECT * FROM workflow_artifacts WHERE workflow_run_id = ?')
          .all(runId) as any[];

        const metadata = JSON.parse(artifacts[0].metadata);
        expect(metadata.approved).toBe(true);
        expect(metadata.issues_count).toBe(0);
      });
    });

    describe('savePrintPdf', () => {
      it('registers artifact without writing file', () => {
        const pdfPath = '/path/to/print.pdf';
        saver.savePrintPdf(pdfPath);

        const artifacts = db
          .prepare('SELECT * FROM workflow_artifacts WHERE workflow_run_id = ?')
          .all(runId) as any[];

        expect(artifacts).toHaveLength(1);
        expect(artifacts[0].artifact_type).toBe('pdf_print');
        expect(artifacts[0].artifact_path).toBe(pdfPath);

        const metadata = JSON.parse(artifacts[0].metadata);
        expect(metadata.variant).toBe('print');
      });
    });

    describe('saveDigitalPdf', () => {
      it('registers artifact without writing file', () => {
        const pdfPath = '/path/to/digital.pdf';
        saver.saveDigitalPdf(pdfPath);

        const artifacts = db
          .prepare('SELECT * FROM workflow_artifacts WHERE workflow_run_id = ?')
          .all(runId) as any[];

        expect(artifacts).toHaveLength(1);
        expect(artifacts[0].artifact_type).toBe('pdf_digital');
        expect(artifacts[0].artifact_path).toBe(pdfPath);

        const metadata = JSON.parse(artifacts[0].metadata);
        expect(metadata.variant).toBe('digital');
      });
    });

    describe('saveDraftPdf', () => {
      it('registers artifact without writing file', () => {
        const pdfPath = '/path/to/draft.pdf';
        saver.saveDraftPdf(pdfPath);

        const artifacts = db
          .prepare('SELECT * FROM workflow_artifacts WHERE workflow_run_id = ?')
          .all(runId) as any[];

        expect(artifacts).toHaveLength(1);
        expect(artifacts[0].artifact_type).toBe('pdf_draft');
        expect(artifacts[0].artifact_path).toBe(pdfPath);

        const metadata = JSON.parse(artifacts[0].metadata);
        expect(metadata.variant).toBe('draft');
      });
    });
  });

  describe('Workflow Definition', () => {
    it('has correct workflow metadata', () => {
      expect(w2PdfWorkflow.type).toBe('w2_pdf');
      expect(w2PdfWorkflow.name).toBe('W2 PDF Publication Workflow');
      expect(w2PdfWorkflow.initialStep).toBe('pm-review');
    });

    it('has correct number of steps', () => {
      expect(w2PdfWorkflow.steps).toHaveLength(8);
    });

    it('has correct step order', () => {
      const stepNames = w2PdfWorkflow.steps.map((s) => s.name);
      expect(stepNames).toEqual([
        'pm-review',
        'layout',
        'design',
        'create-pdf',
        'editor-review',
        'human-gate',
        'derive-digital',
        'finalize',
      ]);
    });

    it('has correct step transitions', () => {
      const pmReview = w2PdfWorkflow.steps.find((s) => s.name === 'pm-review');
      expect(pmReview?.next).toBe('layout');

      const layout = w2PdfWorkflow.steps.find((s) => s.name === 'layout');
      expect(layout?.next).toBe('design');

      const design = w2PdfWorkflow.steps.find((s) => s.name === 'design');
      expect(design?.next).toBe('create-pdf');

      const createPdf = w2PdfWorkflow.steps.find((s) => s.name === 'create-pdf');
      expect(createPdf?.next).toBe('editor-review');

      const deriveDigital = w2PdfWorkflow.steps.find((s) => s.name === 'derive-digital');
      expect(deriveDigital?.next).toBe('finalize');

      const finalize = w2PdfWorkflow.steps.find((s) => s.name === 'finalize');
      expect(finalize?.next).toBeNull();
    });

    it('has conditional branching for editor-review', () => {
      const editorReview = w2PdfWorkflow.steps.find((s) => s.name === 'editor-review');
      expect(editorReview?.next).toEqual({
        condition: 'result.approved === true',
        onTrue: 'human-gate',
        onFalse: 'layout',
        maxIterations: 3,
      });
    });

    it('has human gate with correct options', () => {
      const humanGate = w2PdfWorkflow.steps.find((s) => s.name === 'human-gate');

      expect(humanGate?.humanGate).toBeDefined();
      expect(humanGate?.humanGate?.prompt).toContain('Review the print PDF draft');
      expect(humanGate?.humanGate?.context).toEqual(['draftPdfPath', 'imagePromptsPath', 'editorCycles']);
      expect(humanGate?.humanGate?.options).toHaveLength(3);

      const options = humanGate?.humanGate?.options || [];
      expect(options[0].label).toBe('Approve and finalize');
      expect(options[0].nextStep).toBe('derive-digital');
      expect(options[0].requiresInput).toBeUndefined();

      expect(options[1].label).toBe('Provide assets and continue');
      expect(options[1].nextStep).toBe('create-pdf');
      expect(options[1].requiresInput).toBe(true);

      expect(options[2].label).toBe('Reject with feedback');
      expect(options[2].nextStep).toBe('layout');
      expect(options[2].requiresInput).toBe(true);
    });

    it('has preconditions for each step', () => {
      w2PdfWorkflow.steps.forEach((step) => {
        expect(step.preconditions).toBeDefined();
        expect(Array.isArray(step.preconditions)).toBe(true);
        expect(step.preconditions.length).toBeGreaterThan(0);
      });
    });

    it('has postconditions for each step', () => {
      w2PdfWorkflow.steps.forEach((step) => {
        expect(step.postconditions).toBeDefined();
        expect(Array.isArray(step.postconditions)).toBe(true);
        expect(step.postconditions.length).toBeGreaterThan(0);
      });
    });

    it('has correct command for each step', () => {
      const pmReview = w2PdfWorkflow.steps.find((s) => s.name === 'pm-review');
      expect(pmReview?.command).toBe('pnpm w2:pm-review');

      const layout = w2PdfWorkflow.steps.find((s) => s.name === 'layout');
      expect(layout?.command).toBe('pnpm w2:layout');

      const design = w2PdfWorkflow.steps.find((s) => s.name === 'design');
      expect(design?.command).toBe('pnpm w2:design');

      const createPdf = w2PdfWorkflow.steps.find((s) => s.name === 'create-pdf');
      expect(createPdf?.command).toBe('pnpm w2:create-pdf');

      const editorReview = w2PdfWorkflow.steps.find((s) => s.name === 'editor-review');
      expect(editorReview?.command).toBe('pnpm w2:editor-review');

      const humanGate = w2PdfWorkflow.steps.find((s) => s.name === 'human-gate');
      expect(humanGate?.command).toBe('pnpm w2:human-gate');

      const deriveDigital = w2PdfWorkflow.steps.find((s) => s.name === 'derive-digital');
      expect(deriveDigital?.command).toBe('pnpm w2:derive-digital');

      const finalize = w2PdfWorkflow.steps.find((s) => s.name === 'finalize');
      expect(finalize?.command).toBe('pnpm w2:finalize');
    });
  });
});
