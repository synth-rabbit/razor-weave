// src/tooling/w2/types.ts

/**
 * W2 PDF Workflow Types
 *
 * Types for the PDF publication workflow. Content is frozen;
 * these types describe presentation-only changes.
 */

// PM Review output - identifies priority areas for layout attention
export interface PmReviewResult {
  priority_sections: string[];
  focus_areas: string[];
  constraints: {
    page_budget: number | null;
    preserve_toc: boolean;
  };
}

// Layout Agent output - structural presentation plan
export interface LayoutPlan {
  page_breaks: Array<{
    before: string;
    reason: string;
  }>;
  margins: {
    inner: string;
    outer: string;
    top?: string;
    bottom?: string;
  };
  table_strategy: 'keep-together' | 'allow-page-break-within';
  column_layouts: Array<{
    section: string;
    columns: 1 | 2;
  }>;
}

// Design Agent output - visual presentation plan
export interface DesignPlan {
  typography: {
    body: string;
    headings_scale: number;
  };
  colors: {
    accent: string;
    callout_bg: string;
  };
  spacing: {
    paragraph: string;
    section: string;
  };
}

// Image prompt for AI generation
export interface ImagePrompt {
  id: string;
  location: string;
  aspect_ratio: '16:9' | '3:2' | '4:3' | '1:1' | '2:3' | '9:16';
  prompt: string;
}

export interface ImagePromptsResult {
  prompts: ImagePrompt[];
}

// Editor review output
export interface EditorReviewResult {
  approved: boolean;
  issues: Array<{
    type: 'layout' | 'typography' | 'spacing' | 'print-readiness';
    location: string;
    problem: string;
    suggestion: string;
  }>;
}

// W2 strategic plan context
export interface W2StrategyContext {
  planId: string;
  workflowRunId: string;
  bookSlug: string;
  bookTitle: string;
  htmlPath: string;
  releaseNotesPath: string;
  artifactsDir: string;
}

// W2 state tracking
export interface W2State {
  current_step: 'pm-review' | 'layout' | 'design' | 'create-pdf' | 'editor-review' | 'human-gate' | 'derive-digital' | 'finalize' | 'completed';
  completed_steps: string[];
  iteration_count: number;
  editor_cycles: number;
  last_updated: string;
  human_feedback: string | null;
  assets_path: string | null;
}
