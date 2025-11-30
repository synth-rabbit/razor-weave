// src/tooling/workflows/w2-workflow.ts

/**
 * W2 PDF Workflow Definition
 *
 * Workflow for producing publication-quality print and digital PDFs.
 * Content is frozen from W1; only presentation changes.
 */

import { existsSync } from 'fs';
import { defineWorkflow, type Condition, type WorkflowDefinition } from './engine-types.js';

// Postconditions

const pmReviewSaved: Condition = {
  name: 'pm_review_saved',
  check: (ctx) => existsSync(`data/w2-artifacts/${ctx.runId}/pm-review.json`),
  error: 'PM review not saved',
};

const layoutPlanSaved: Condition = {
  name: 'layout_plan_saved',
  check: (ctx) => existsSync(`data/w2-artifacts/${ctx.runId}/layout-plan.json`),
  error: 'Layout plan not saved',
};

const designPlanSaved: Condition = {
  name: 'design_plan_saved',
  check: (ctx) => existsSync(`data/w2-artifacts/${ctx.runId}/design-plan.json`),
  error: 'Design plan not saved',
};

const imagePromptsSaved: Condition = {
  name: 'image_prompts_saved',
  check: (ctx) => existsSync(`data/w2-artifacts/${ctx.runId}/image-prompts.json`),
  error: 'Image prompts not saved',
};

const draftPdfCreated: Condition = {
  name: 'draft_pdf_created',
  check: (ctx) => {
    const draftPath = ctx.checkpoint.data['draftPdfPath'] as string | undefined;
    return draftPath ? existsSync(draftPath) : false;
  },
  error: 'Draft PDF not created',
};

const editorReviewSaved: Condition = {
  name: 'editor_review_saved',
  check: (ctx) => existsSync(`data/w2-artifacts/${ctx.runId}/editor-review.json`),
  error: 'Editor review not saved',
};

const humanDecisionRecorded: Condition = {
  name: 'human_decision_recorded',
  check: (ctx) => ctx.checkpoint.gateDecision !== undefined,
  error: 'Human gate decision not recorded',
};

const digitalPdfCreated: Condition = {
  name: 'digital_pdf_created',
  check: (ctx) => {
    const digitalPath = ctx.checkpoint.data['digitalPdfPath'] as string | undefined;
    return digitalPath ? existsSync(digitalPath) : false;
  },
  error: 'Digital PDF not created',
};

const finalArtifactsRegistered: Condition = {
  name: 'final_artifacts_registered',
  check: (ctx) => ctx.db.artifactsExist(ctx.runId),
  error: 'Final artifacts not registered',
};

// Preconditions

const htmlExists: Condition = {
  name: 'html_exists',
  check: (ctx) => {
    const htmlPath = ctx.checkpoint.data['htmlPath'] as string | undefined;
    return htmlPath ? existsSync(htmlPath) : false;
  },
  error: 'Print HTML not found',
};

export const w2PdfWorkflow: WorkflowDefinition = defineWorkflow({
  type: 'w2_pdf',
  name: 'W2 PDF Publication Workflow',
  initialStep: 'pm-review',

  steps: [
    {
      name: 'pm-review',
      command: 'pnpm w2:pm-review',
      preconditions: [htmlExists],
      postconditions: [pmReviewSaved],
      next: 'layout',
    },
    {
      name: 'layout',
      command: 'pnpm w2:layout',
      preconditions: [pmReviewSaved],
      postconditions: [layoutPlanSaved],
      next: 'design',
    },
    {
      name: 'design',
      command: 'pnpm w2:design',
      preconditions: [layoutPlanSaved],
      postconditions: [designPlanSaved, imagePromptsSaved],
      next: 'create-pdf',
    },
    {
      name: 'create-pdf',
      command: 'pnpm w2:create-pdf',
      preconditions: [designPlanSaved],
      postconditions: [draftPdfCreated],
      next: 'editor-review',
    },
    {
      name: 'editor-review',
      command: 'pnpm w2:editor-review',
      preconditions: [draftPdfCreated],
      postconditions: [editorReviewSaved],
      next: {
        condition: 'result.approved === true',
        onTrue: 'human-gate',
        onFalse: 'layout',
        maxIterations: 3,
      },
    },
    {
      name: 'human-gate',
      command: 'pnpm w2:human-gate',
      preconditions: [editorReviewSaved],
      postconditions: [humanDecisionRecorded],
      humanGate: {
        prompt: 'Review the print PDF draft. Approve, reject, or provide assets.',
        context: ['draftPdfPath', 'imagePromptsPath', 'editorCycles'],
        options: [
          { label: 'Approve and finalize', nextStep: 'derive-digital' },
          { label: 'Provide assets and continue', nextStep: 'create-pdf', requiresInput: true },
          { label: 'Reject with feedback', nextStep: 'layout', requiresInput: true },
        ],
      },
    },
    {
      name: 'derive-digital',
      command: 'pnpm w2:derive-digital',
      preconditions: [humanDecisionRecorded],
      postconditions: [digitalPdfCreated],
      next: 'finalize',
    },
    {
      name: 'finalize',
      command: 'pnpm w2:finalize',
      preconditions: [digitalPdfCreated],
      postconditions: [finalArtifactsRegistered],
      next: null,
    },
  ],
});

export default w2PdfWorkflow;
