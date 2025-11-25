/**
 * W1 Editing Workflow Definition
 *
 * This workflow orchestrates the W1 editing pipeline:
 * 1. Strategic planning - Create improvement plan from analysis
 * 2. Content modification - Writer/Editor/Domain Expert loop
 * 3. Validation - Chapter validation against metrics
 * 4. Human gate - Human review and approval
 * 5. Finalization - Generate HTML, PDF, web artifacts
 */

import { defineWorkflow, type Condition, type WorkflowDefinition } from './engine-types.js';

// =============================================================================
// Postcondition Definitions
// =============================================================================

/**
 * Strategic plan exists in database
 */
const strategicPlanCreated: Condition = {
  name: 'strategic_plan_created',
  check: (ctx) => ctx.db.strategicPlanExists(ctx.runId),
  error: 'Strategic plan was not created in database',
};

/**
 * Book version exists in database
 */
const versionCreated: Condition = {
  name: 'version_created',
  check: (ctx) => {
    const versionId = ctx.checkpoint.data['versionId'] as string | undefined;
    return versionId ? ctx.db.versionExists(versionId) : false;
  },
  error: 'Book version was not created in database',
};

/**
 * Writer artifacts exist on disk
 */
const writerArtifactsExist: Condition = {
  name: 'writer_artifacts_exist',
  check: (ctx) => ctx.db.artifactsExist(ctx.runId),
  error: 'Writer output artifacts were not saved',
};

/**
 * Editor review recorded
 */
const editorReviewRecorded: Condition = {
  name: 'editor_review_recorded',
  check: (ctx) => {
    const editorResult = ctx.checkpoint.data['editorResult'] as { decision?: string } | undefined;
    return editorResult?.decision !== undefined;
  },
  error: 'Editor review was not recorded',
};

/**
 * Domain expert review recorded
 */
const domainReviewRecorded: Condition = {
  name: 'domain_review_recorded',
  check: (ctx) => {
    const domainResult = ctx.checkpoint.data['domainResult'] as { decision?: string } | undefined;
    return domainResult?.decision !== undefined;
  },
  error: 'Domain expert review was not recorded',
};

/**
 * Validation passed with acceptable metrics
 */
const validationPassed: Condition = {
  name: 'validation_passed',
  check: (ctx) => {
    const validationResult = ctx.checkpoint.data['validationResult'] as
      | { passed?: boolean }
      | undefined;
    return validationResult?.passed === true;
  },
  error: 'Validation did not pass',
};

/**
 * Human gate decision recorded
 */
const humanDecisionRecorded: Condition = {
  name: 'human_decision_recorded',
  check: (ctx) => ctx.checkpoint.gateDecision !== undefined,
  error: 'Human gate decision was not recorded',
};

/**
 * Final artifacts generated (HTML, PDF)
 */
const finalArtifactsGenerated: Condition = {
  name: 'final_artifacts_generated',
  check: (ctx) => {
    const finalResult = ctx.checkpoint.data['finalizeResult'] as
      | { htmlGenerated?: boolean }
      | undefined;
    return finalResult?.htmlGenerated === true;
  },
  error: 'Final artifacts were not generated',
};

// =============================================================================
// Precondition Definitions
// =============================================================================

/**
 * Analysis exists (either fresh or from file)
 */
const analysisAvailable: Condition = {
  name: 'analysis_available',
  check: (ctx) => {
    const analysis = ctx.checkpoint.data['analysisPath'] as string | undefined;
    return analysis !== undefined;
  },
  error: 'No analysis available - run w1:strategic with --fresh or --analysis first',
};

/**
 * Strategic plan available for content modification
 */
const strategicPlanAvailable: Condition = {
  name: 'strategic_plan_available',
  check: (ctx) => ctx.db.strategicPlanExists(ctx.runId),
  error: 'Strategic plan not available - run strategic step first',
};

/**
 * Writer output available for editor review
 */
const writerOutputAvailable: Condition = {
  name: 'writer_output_available',
  check: (ctx) => ctx.db.artifactsExist(ctx.runId),
  error: 'Writer output not available - run writer step first',
};

/**
 * Editor approved changes (for domain review)
 */
const editorApproved: Condition = {
  name: 'editor_approved',
  check: (ctx) => {
    const editorResult = ctx.checkpoint.data['editorResult'] as { decision?: string } | undefined;
    return editorResult?.decision === 'approve';
  },
  error: 'Editor has not approved changes',
};

/**
 * Domain expert approved changes (for validation)
 */
const domainApproved: Condition = {
  name: 'domain_approved',
  check: (ctx) => {
    const domainResult = ctx.checkpoint.data['domainResult'] as { decision?: string } | undefined;
    return domainResult?.decision === 'approve';
  },
  error: 'Domain expert has not approved changes',
};

// =============================================================================
// W1 Workflow Definition
// =============================================================================

export const w1EditingWorkflow: WorkflowDefinition = defineWorkflow({
  type: 'w1_editing',
  name: 'W1 Editing Workflow',
  initialStep: 'strategic',

  steps: [
    // -------------------------------------------------------------------------
    // Step 1: Strategic Planning
    // -------------------------------------------------------------------------
    {
      name: 'strategic',
      command: 'pnpm w1:strategic',
      preconditions: [analysisAvailable],
      postconditions: [strategicPlanCreated],
      next: 'writer',
    },

    // -------------------------------------------------------------------------
    // Step 2: Writer (Content Modification)
    // -------------------------------------------------------------------------
    {
      name: 'writer',
      command: 'pnpm w1:content-modify',
      preconditions: [strategicPlanAvailable],
      postconditions: [writerArtifactsExist],
      next: 'editor',
    },

    // -------------------------------------------------------------------------
    // Step 3: Editor Review
    // -------------------------------------------------------------------------
    {
      name: 'editor',
      command: 'pnpm w1:content-modify --generate-editor',
      preconditions: [writerOutputAvailable],
      postconditions: [editorReviewRecorded],
      next: {
        condition: 'result.decision === "approve"',
        onTrue: 'domain',
        onFalse: 'writer',
        maxIterations: 3,
      },
    },

    // -------------------------------------------------------------------------
    // Step 4: Domain Expert Review
    // -------------------------------------------------------------------------
    {
      name: 'domain',
      command: 'pnpm w1:content-modify --generate-domain',
      preconditions: [editorApproved],
      postconditions: [domainReviewRecorded],
      next: {
        condition: 'result.decision === "approve"',
        onTrue: 'validate',
        onFalse: 'writer',
        maxIterations: 3,
      },
    },

    // -------------------------------------------------------------------------
    // Step 5: Validation
    // -------------------------------------------------------------------------
    {
      name: 'validate',
      command: 'pnpm w1:validate-chapters',
      preconditions: [domainApproved],
      postconditions: [validationPassed],
      next: 'human_gate',
    },

    // -------------------------------------------------------------------------
    // Step 6: Human Gate
    // -------------------------------------------------------------------------
    {
      name: 'human_gate',
      command: 'pnpm w1:human-gate',
      preconditions: [validationPassed],
      postconditions: [humanDecisionRecorded],
      humanGate: {
        prompt: 'Review the changes and decide how to proceed:',
        context: ['validationResult', 'writerStats', 'editorNotes'],
        options: [
          { label: 'Approve', nextStep: 'finalize' },
          { label: 'Reject', nextStep: null },
          { label: 'Request Changes', nextStep: 'writer', requiresInput: true },
          { label: 'Full Review', nextStep: 'full_review', requiresInput: false },
        ],
      },
    },

    // -------------------------------------------------------------------------
    // Step 7: Full Review (Optional - triggered by human gate)
    // -------------------------------------------------------------------------
    {
      name: 'full_review',
      command: 'pnpm w1:human-gate --full-review',
      preconditions: [],
      postconditions: [],
      next: 'human_gate',
    },

    // -------------------------------------------------------------------------
    // Step 8: Finalization
    // -------------------------------------------------------------------------
    {
      name: 'finalize',
      command: 'pnpm w1:finalize',
      preconditions: [humanDecisionRecorded],
      postconditions: [finalArtifactsGenerated],
      next: null,
    },
  ],
});

// =============================================================================
// Export
// =============================================================================

export default w1EditingWorkflow;
