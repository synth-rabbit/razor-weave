/**
 * Artifact type definitions for the Razorweave workflow system.
 * Each workflow produces specific artifact types that represent
 * deliverables or outputs from that workflow stage.
 */

import type { WorkflowType } from './types.js';

// ============================================================================
// W1: Editing Workflow Artifacts
// ============================================================================

/**
 * W1 Editing workflow artifact types:
 * - chapter: A single chapter of edited manuscript content
 * - release_notes: Documentation of changes made during editing
 * - print_html: HTML formatted for print output (page breaks, margins)
 * - web_html: HTML formatted for web display (responsive, interactive)
 * - pdf_draft: Draft PDF for review before final production
 */
export const W1_ARTIFACT_TYPES = [
  'chapter',
  'release_notes',
  'print_html',
  'web_html',
  'pdf_draft',
] as const;

// ============================================================================
// W2: PDF Production Workflow Artifacts
// ============================================================================

/**
 * W2 PDF production workflow artifact types:
 * - pdf_digital: Final PDF optimized for digital distribution (smaller file, hyperlinks)
 * - pdf_print: Final PDF optimized for print production (bleed, CMYK, high-res)
 * - layout_plan: Document specifying page layout, spacing, and typography decisions
 * - design_plan: Document specifying visual design elements and styling
 */
export const W2_ARTIFACT_TYPES = [
  'pdf_digital',
  'pdf_print',
  'layout_plan',
  'design_plan',
] as const;

// ============================================================================
// W3: Publication Workflow Artifacts
// ============================================================================

/**
 * W3 Publication workflow artifact types:
 * - deployment: Record of deployment to a distribution platform
 * - qa_report: Quality assurance report documenting test results
 * - marketing_copy: Promotional text for product listings and announcements
 * - announcement: Public announcement content for releases
 */
export const W3_ARTIFACT_TYPES = [
  'deployment',
  'qa_report',
  'marketing_copy',
  'announcement',
] as const;

// ============================================================================
// W4: Playtesting Workflow Artifacts
// ============================================================================

/**
 * W4 Playtesting workflow artifact types:
 * - playtest_session: Record of a single playtest session with participants
 * - playtest_analysis: Analysis and summary of playtest feedback patterns
 * - playtest_feedback: Individual feedback items from playtesters
 */
export const W4_ARTIFACT_TYPES = [
  'playtest_session',
  'playtest_analysis',
  'playtest_feedback',
] as const;

// ============================================================================
// Combined Type Definitions
// ============================================================================

/**
 * Union type of all valid artifact types across all workflows
 */
export type ArtifactType =
  | (typeof W1_ARTIFACT_TYPES)[number]
  | (typeof W2_ARTIFACT_TYPES)[number]
  | (typeof W3_ARTIFACT_TYPES)[number]
  | (typeof W4_ARTIFACT_TYPES)[number];

/**
 * All artifact types as a single array for runtime validation
 */
export const ALL_ARTIFACT_TYPES: readonly ArtifactType[] = [
  ...W1_ARTIFACT_TYPES,
  ...W2_ARTIFACT_TYPES,
  ...W3_ARTIFACT_TYPES,
  ...W4_ARTIFACT_TYPES,
] as const;

// ============================================================================
// Workflow to Artifact Mapping
// ============================================================================

/**
 * Map of workflow types to their associated artifact types
 */
const WORKFLOW_ARTIFACT_MAP: Record<WorkflowType, readonly ArtifactType[]> = {
  w1_editing: W1_ARTIFACT_TYPES,
  w2_pdf: W2_ARTIFACT_TYPES,
  w3_publication: W3_ARTIFACT_TYPES,
  w4_playtesting: W4_ARTIFACT_TYPES,
} as const;

/**
 * Reverse mapping from artifact type to workflow type
 */
const ARTIFACT_WORKFLOW_MAP: Record<ArtifactType, WorkflowType> = {
  // W1 Editing
  chapter: 'w1_editing',
  release_notes: 'w1_editing',
  print_html: 'w1_editing',
  web_html: 'w1_editing',
  pdf_draft: 'w1_editing',
  // W2 PDF
  pdf_digital: 'w2_pdf',
  pdf_print: 'w2_pdf',
  layout_plan: 'w2_pdf',
  design_plan: 'w2_pdf',
  // W3 Publication
  deployment: 'w3_publication',
  qa_report: 'w3_publication',
  marketing_copy: 'w3_publication',
  announcement: 'w3_publication',
  // W4 Playtesting
  playtest_session: 'w4_playtesting',
  playtest_analysis: 'w4_playtesting',
  playtest_feedback: 'w4_playtesting',
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Type guard to check if a string is a valid ArtifactType
 * @param value - The string value to check
 * @returns True if the value is a valid ArtifactType
 */
export function isArtifactType(value: string): value is ArtifactType {
  return ALL_ARTIFACT_TYPES.includes(value as ArtifactType);
}

/**
 * Get the workflow type that produces a given artifact type
 * @param type - The artifact type to look up
 * @returns The workflow type that produces this artifact
 */
export function getWorkflowForArtifact(type: ArtifactType): WorkflowType {
  return ARTIFACT_WORKFLOW_MAP[type];
}

/**
 * Get all artifact types produced by a given workflow
 * @param workflow - The workflow type to look up
 * @returns Array of artifact types for that workflow
 */
export function getArtifactTypesForWorkflow(workflow: WorkflowType): readonly ArtifactType[] {
  return WORKFLOW_ARTIFACT_MAP[workflow];
}
