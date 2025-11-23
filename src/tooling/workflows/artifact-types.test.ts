import { describe, it, expect } from 'vitest';
import {
  ArtifactType,
  ALL_ARTIFACT_TYPES,
  W1_ARTIFACT_TYPES,
  W2_ARTIFACT_TYPES,
  W3_ARTIFACT_TYPES,
  W4_ARTIFACT_TYPES,
  isArtifactType,
  getWorkflowForArtifact,
  getArtifactTypesForWorkflow,
} from './artifact-types.js';
import { WORKFLOW_TYPES, WorkflowType } from './types.js';

describe('artifact-types', () => {
  describe('type constants', () => {
    it('should have 5 W1 editing artifact types', () => {
      expect(W1_ARTIFACT_TYPES).toHaveLength(5);
      expect(W1_ARTIFACT_TYPES).toContain('chapter');
      expect(W1_ARTIFACT_TYPES).toContain('release_notes');
      expect(W1_ARTIFACT_TYPES).toContain('print_html');
      expect(W1_ARTIFACT_TYPES).toContain('web_html');
      expect(W1_ARTIFACT_TYPES).toContain('pdf_draft');
    });

    it('should have 4 W2 PDF artifact types', () => {
      expect(W2_ARTIFACT_TYPES).toHaveLength(4);
      expect(W2_ARTIFACT_TYPES).toContain('pdf_digital');
      expect(W2_ARTIFACT_TYPES).toContain('pdf_print');
      expect(W2_ARTIFACT_TYPES).toContain('layout_plan');
      expect(W2_ARTIFACT_TYPES).toContain('design_plan');
    });

    it('should have 4 W3 publication artifact types', () => {
      expect(W3_ARTIFACT_TYPES).toHaveLength(4);
      expect(W3_ARTIFACT_TYPES).toContain('deployment');
      expect(W3_ARTIFACT_TYPES).toContain('qa_report');
      expect(W3_ARTIFACT_TYPES).toContain('marketing_copy');
      expect(W3_ARTIFACT_TYPES).toContain('announcement');
    });

    it('should have 3 W4 playtesting artifact types', () => {
      expect(W4_ARTIFACT_TYPES).toHaveLength(3);
      expect(W4_ARTIFACT_TYPES).toContain('playtest_session');
      expect(W4_ARTIFACT_TYPES).toContain('playtest_analysis');
      expect(W4_ARTIFACT_TYPES).toContain('playtest_feedback');
    });

    it('should have all types in ALL_ARTIFACT_TYPES', () => {
      const expectedCount =
        W1_ARTIFACT_TYPES.length +
        W2_ARTIFACT_TYPES.length +
        W3_ARTIFACT_TYPES.length +
        W4_ARTIFACT_TYPES.length;
      expect(ALL_ARTIFACT_TYPES).toHaveLength(expectedCount);
      expect(ALL_ARTIFACT_TYPES).toHaveLength(16);
    });

    it('should include all workflow-specific types in ALL_ARTIFACT_TYPES', () => {
      for (const type of W1_ARTIFACT_TYPES) {
        expect(ALL_ARTIFACT_TYPES).toContain(type);
      }
      for (const type of W2_ARTIFACT_TYPES) {
        expect(ALL_ARTIFACT_TYPES).toContain(type);
      }
      for (const type of W3_ARTIFACT_TYPES) {
        expect(ALL_ARTIFACT_TYPES).toContain(type);
      }
      for (const type of W4_ARTIFACT_TYPES) {
        expect(ALL_ARTIFACT_TYPES).toContain(type);
      }
    });
  });

  describe('isArtifactType', () => {
    it.each(ALL_ARTIFACT_TYPES)('should return true for valid type: %s', (type) => {
      expect(isArtifactType(type)).toBe(true);
    });

    it('should return false for invalid types', () => {
      expect(isArtifactType('invalid')).toBe(false);
      expect(isArtifactType('')).toBe(false);
      expect(isArtifactType('CHAPTER')).toBe(false);
      expect(isArtifactType('Chapter')).toBe(false);
      expect(isArtifactType('chapter ')).toBe(false);
      expect(isArtifactType(' chapter')).toBe(false);
    });

    it('should return false for workflow types', () => {
      expect(isArtifactType('w1_editing')).toBe(false);
      expect(isArtifactType('w2_pdf')).toBe(false);
      expect(isArtifactType('w3_publication')).toBe(false);
      expect(isArtifactType('w4_playtesting')).toBe(false);
    });
  });

  describe('getWorkflowForArtifact', () => {
    describe('W1 editing artifacts', () => {
      it.each(W1_ARTIFACT_TYPES)('should map %s to w1_editing', (type) => {
        expect(getWorkflowForArtifact(type)).toBe('w1_editing');
      });
    });

    describe('W2 PDF artifacts', () => {
      it.each(W2_ARTIFACT_TYPES)('should map %s to w2_pdf', (type) => {
        expect(getWorkflowForArtifact(type)).toBe('w2_pdf');
      });
    });

    describe('W3 publication artifacts', () => {
      it.each(W3_ARTIFACT_TYPES)('should map %s to w3_publication', (type) => {
        expect(getWorkflowForArtifact(type)).toBe('w3_publication');
      });
    });

    describe('W4 playtesting artifacts', () => {
      it.each(W4_ARTIFACT_TYPES)('should map %s to w4_playtesting', (type) => {
        expect(getWorkflowForArtifact(type)).toBe('w4_playtesting');
      });
    });
  });

  describe('getArtifactTypesForWorkflow', () => {
    it('should return W1 artifact types for w1_editing', () => {
      const types = getArtifactTypesForWorkflow('w1_editing');
      expect(types).toEqual(W1_ARTIFACT_TYPES);
      expect(types).toHaveLength(5);
    });

    it('should return W2 artifact types for w2_pdf', () => {
      const types = getArtifactTypesForWorkflow('w2_pdf');
      expect(types).toEqual(W2_ARTIFACT_TYPES);
      expect(types).toHaveLength(4);
    });

    it('should return W3 artifact types for w3_publication', () => {
      const types = getArtifactTypesForWorkflow('w3_publication');
      expect(types).toEqual(W3_ARTIFACT_TYPES);
      expect(types).toHaveLength(4);
    });

    it('should return W4 artifact types for w4_playtesting', () => {
      const types = getArtifactTypesForWorkflow('w4_playtesting');
      expect(types).toEqual(W4_ARTIFACT_TYPES);
      expect(types).toHaveLength(3);
    });

    it('should cover all workflow types', () => {
      for (const workflow of WORKFLOW_TYPES) {
        const types = getArtifactTypesForWorkflow(workflow);
        expect(types.length).toBeGreaterThan(0);
      }
    });
  });

  describe('bidirectional mapping consistency', () => {
    it('should have consistent mappings between artifact and workflow', () => {
      // For each artifact type, the workflow it maps to should include that artifact
      for (const artifactType of ALL_ARTIFACT_TYPES) {
        const workflow = getWorkflowForArtifact(artifactType);
        const workflowArtifacts = getArtifactTypesForWorkflow(workflow);
        expect(workflowArtifacts).toContain(artifactType);
      }
    });

    it('should have all workflow artifacts map back to the workflow', () => {
      // For each workflow, all its artifacts should map back to it
      for (const workflow of WORKFLOW_TYPES) {
        const artifacts = getArtifactTypesForWorkflow(workflow);
        for (const artifact of artifacts) {
          expect(getWorkflowForArtifact(artifact)).toBe(workflow);
        }
      }
    });

    it('should account for all artifact types exactly once', () => {
      const allFromWorkflows: ArtifactType[] = [];
      for (const workflow of WORKFLOW_TYPES) {
        allFromWorkflows.push(...getArtifactTypesForWorkflow(workflow));
      }

      // Should have same count
      expect(allFromWorkflows).toHaveLength(ALL_ARTIFACT_TYPES.length);

      // Should have no duplicates
      const uniqueTypes = new Set(allFromWorkflows);
      expect(uniqueTypes.size).toBe(ALL_ARTIFACT_TYPES.length);

      // Should contain all types
      for (const type of ALL_ARTIFACT_TYPES) {
        expect(allFromWorkflows).toContain(type);
      }
    });
  });

  describe('type safety', () => {
    it('should have correct type for ArtifactType union', () => {
      // This is a compile-time check - if types are wrong, this won't compile
      const validTypes: ArtifactType[] = [
        'chapter',
        'release_notes',
        'print_html',
        'web_html',
        'pdf_draft',
        'pdf_digital',
        'pdf_print',
        'layout_plan',
        'design_plan',
        'deployment',
        'qa_report',
        'marketing_copy',
        'announcement',
        'playtest_session',
        'playtest_analysis',
        'playtest_feedback',
      ];
      expect(validTypes).toHaveLength(16);
    });
  });
});
