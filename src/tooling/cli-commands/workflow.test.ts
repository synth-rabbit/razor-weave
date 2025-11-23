import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DB_DIR = 'data/test-workflow-cli';
const TEST_DB_PATH = join(TEST_DB_DIR, 'test.db');

// Helper to run CLI command and capture output
function runCLI(command: string, expectSuccess = true): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
  } catch (error) {
    if (!expectSuccess) throw error;
    const err = error as { stderr?: string; stdout?: string };
    throw new Error(`CLI failed: ${err.stderr || err.stdout || String(error)}`);
  }
}

// Helper to register a test book
function registerTestBook(slug: string, title: string): void {
  runCLI(
    `npx tsx src/tooling/cli-commands/book-register.ts --slug ${slug} --title "${title}" --path books/${slug} --db ${TEST_DB_PATH}`
  );
}

// Helper to start a workflow and get the run ID
function startWorkflow(type: string, bookSlug: string): string {
  const output = runCLI(
    `npx tsx src/tooling/cli-commands/workflow-start.ts --type ${type} --book ${bookSlug} --db ${TEST_DB_PATH}`
  );
  // Extract run ID from output (format: "Run ID : wfrun_xxx_xxx" - note the space before colon from table formatting)
  const match = output.match(/Run ID\s*:\s*(wfrun_[a-z0-9_]+)/i);
  if (!match) throw new Error(`Could not extract run ID from: ${output}`);
  return match[1];
}

describe('workflow CLI commands', () => {
  beforeEach(() => {
    // Clean up and create test directory
    if (existsSync(TEST_DB_DIR)) rmSync(TEST_DB_DIR, { recursive: true });
    mkdirSync(TEST_DB_DIR, { recursive: true });
    // Register a test book for workflow tests
    registerTestBook('test-book', 'Test Book');
  });

  afterEach(() => {
    // Clean up test database
    if (existsSync(TEST_DB_DIR)) rmSync(TEST_DB_DIR, { recursive: true });
  });

  describe('workflow:start', () => {
    it('should start a new workflow with short type name (w1)', () => {
      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-start.ts --type w1 --book test-book --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW STARTED');
      expect(output).toContain('w1_editing');
      expect(output).toContain('Test Book');
      expect(output).toContain('pending');
      expect(output).toContain('wfrun_');
    });

    it('should start a workflow with full type name', () => {
      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-start.ts --type w2_pdf --book test-book --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW STARTED');
      expect(output).toContain('w2_pdf');
    });

    it('should start workflows with all type variations', () => {
      const types = ['w1', 'w2', 'w3', 'w4'];
      for (const type of types) {
        const output = runCLI(
          `npx tsx src/tooling/cli-commands/workflow-start.ts --type ${type} --book test-book --db ${TEST_DB_PATH}`
        );
        expect(output).toContain('WORKFLOW STARTED');
      }
    });

    it('should fail without --type', () => {
      expect(() => {
        runCLI(
          `npx tsx src/tooling/cli-commands/workflow-start.ts --book test-book --db ${TEST_DB_PATH}`,
          false
        );
      }).toThrow();
    });

    it('should fail without --book', () => {
      expect(() => {
        runCLI(
          `npx tsx src/tooling/cli-commands/workflow-start.ts --type w1 --db ${TEST_DB_PATH}`,
          false
        );
      }).toThrow();
    });

    it('should fail with invalid workflow type', () => {
      expect(() => {
        runCLI(
          `npx tsx src/tooling/cli-commands/workflow-start.ts --type invalid --book test-book --db ${TEST_DB_PATH}`,
          false
        );
      }).toThrow();
    });

    it('should fail when book does not exist', () => {
      expect(() => {
        runCLI(
          `npx tsx src/tooling/cli-commands/workflow-start.ts --type w1 --book nonexistent-book --db ${TEST_DB_PATH}`,
          false
        );
      }).toThrow();
    });
  });

  describe('workflow:status', () => {
    it('should show workflow status with --run argument', () => {
      const runId = startWorkflow('w1', 'test-book');
      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-status.ts --run ${runId} --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW STATUS');
      expect(output).toContain(runId);
      expect(output).toContain('w1_editing');
      expect(output).toContain('pending');
      expect(output).toContain('Test Book');
    });

    it('should show workflow status with positional argument', () => {
      const runId = startWorkflow('w2', 'test-book');
      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-status.ts ${runId} --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW STATUS');
      expect(output).toContain(runId);
    });

    it('should show valid transitions for pending workflow', () => {
      const runId = startWorkflow('w1', 'test-book');
      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-status.ts --run ${runId} --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('running');
    });

    it('should fail without run ID', () => {
      expect(() => {
        runCLI(
          `npx tsx src/tooling/cli-commands/workflow-status.ts --db ${TEST_DB_PATH}`,
          false
        );
      }).toThrow();
    });

    it('should fail when workflow not found', () => {
      expect(() => {
        runCLI(
          `npx tsx src/tooling/cli-commands/workflow-status.ts --run wfrun_nonexistent --db ${TEST_DB_PATH}`,
          false
        );
      }).toThrow();
    });
  });

  describe('workflow:list', () => {
    beforeEach(() => {
      // Start a few workflows for list tests
      startWorkflow('w1', 'test-book');
      startWorkflow('w2', 'test-book');
    });

    it('should list all workflows', () => {
      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-list.ts --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW LIST');
      expect(output).toContain('w1_editing');
      expect(output).toContain('w2_pdf');
      expect(output).toContain('wfrun_');
    });

    it('should filter by book', () => {
      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-list.ts --book test-book --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW LIST');
      expect(output).toContain('Filtered by: book=test-book');
    });

    it('should filter by status', () => {
      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-list.ts --status pending --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW LIST');
      expect(output).toContain('Filtered by: status=pending');
    });

    it('should filter by type', () => {
      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-list.ts --type w1 --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW LIST');
      expect(output).toContain('Filtered by: type=w1_editing');
      expect(output).toContain('w1_editing');
      expect(output).not.toContain('w2_pdf');
    });

    it('should combine multiple filters', () => {
      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-list.ts --book test-book --status pending --type w1 --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('Filtered by: book=test-book, status=pending, type=w1_editing');
    });

    it('should show empty message when no workflows match', () => {
      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-list.ts --status completed --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('No workflows found');
    });

    it('should fail with invalid status', () => {
      expect(() => {
        runCLI(
          `npx tsx src/tooling/cli-commands/workflow-list.ts --status invalid --db ${TEST_DB_PATH}`,
          false
        );
      }).toThrow();
    });

    it('should fail with invalid type', () => {
      expect(() => {
        runCLI(
          `npx tsx src/tooling/cli-commands/workflow-list.ts --type invalid --db ${TEST_DB_PATH}`,
          false
        );
      }).toThrow();
    });

    it('should fail when book filter does not exist', () => {
      expect(() => {
        runCLI(
          `npx tsx src/tooling/cli-commands/workflow-list.ts --book nonexistent --db ${TEST_DB_PATH}`,
          false
        );
      }).toThrow();
    });
  });

  describe('workflow:pause', () => {
    it('should pause a running workflow', () => {
      const runId = startWorkflow('w1', 'test-book');
      // First transition to running (pending -> running)
      runCLI(
        `npx tsx src/tooling/cli-commands/workflow-resume.ts --run ${runId} --db ${TEST_DB_PATH}`
      );

      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-pause.ts --run ${runId} --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW PAUSED');
      expect(output).toContain('New Status: paused');
    });

    it('should accept positional run ID', () => {
      const runId = startWorkflow('w1', 'test-book');
      // Transition to running
      runCLI(
        `npx tsx src/tooling/cli-commands/workflow-resume.ts ${runId} --db ${TEST_DB_PATH}`
      );

      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-pause.ts ${runId} --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW PAUSED');
    });

    it('should show already paused message when already paused', () => {
      const runId = startWorkflow('w1', 'test-book');
      // Transition to running, then pause
      runCLI(`npx tsx src/tooling/cli-commands/workflow-resume.ts --run ${runId} --db ${TEST_DB_PATH}`);
      runCLI(`npx tsx src/tooling/cli-commands/workflow-pause.ts --run ${runId} --db ${TEST_DB_PATH}`);

      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-pause.ts --run ${runId} --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW ALREADY PAUSED');
    });

    it('should fail when trying to pause a pending workflow', () => {
      const runId = startWorkflow('w1', 'test-book');

      expect(() => {
        runCLI(
          `npx tsx src/tooling/cli-commands/workflow-pause.ts --run ${runId} --db ${TEST_DB_PATH}`,
          false
        );
      }).toThrow();
    });

    it('should fail without run ID', () => {
      expect(() => {
        runCLI(
          `npx tsx src/tooling/cli-commands/workflow-pause.ts --db ${TEST_DB_PATH}`,
          false
        );
      }).toThrow();
    });

    it('should fail when workflow not found', () => {
      expect(() => {
        runCLI(
          `npx tsx src/tooling/cli-commands/workflow-pause.ts --run wfrun_nonexistent --db ${TEST_DB_PATH}`,
          false
        );
      }).toThrow();
    });
  });

  describe('workflow:resume', () => {
    it('should resume a paused workflow', () => {
      const runId = startWorkflow('w1', 'test-book');
      // Transition: pending -> running -> paused
      runCLI(`npx tsx src/tooling/cli-commands/workflow-resume.ts --run ${runId} --db ${TEST_DB_PATH}`);
      runCLI(`npx tsx src/tooling/cli-commands/workflow-pause.ts --run ${runId} --db ${TEST_DB_PATH}`);

      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-resume.ts --run ${runId} --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW RESUMED');
      expect(output).toContain('Previous Status: paused');
      expect(output).toContain('New Status: running');
    });

    it('should start a pending workflow (pending -> running)', () => {
      const runId = startWorkflow('w1', 'test-book');

      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-resume.ts --run ${runId} --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW RESUMED');
      expect(output).toContain('Previous Status: pending');
      expect(output).toContain('New Status: running');
    });

    it('should accept positional run ID', () => {
      const runId = startWorkflow('w1', 'test-book');

      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-resume.ts ${runId} --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW RESUMED');
    });

    it('should show already running message when already running', () => {
      const runId = startWorkflow('w1', 'test-book');
      runCLI(`npx tsx src/tooling/cli-commands/workflow-resume.ts --run ${runId} --db ${TEST_DB_PATH}`);

      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-resume.ts --run ${runId} --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW ALREADY RUNNING');
    });

    it('should fail without run ID', () => {
      expect(() => {
        runCLI(
          `npx tsx src/tooling/cli-commands/workflow-resume.ts --db ${TEST_DB_PATH}`,
          false
        );
      }).toThrow();
    });

    it('should fail when workflow not found', () => {
      expect(() => {
        runCLI(
          `npx tsx src/tooling/cli-commands/workflow-resume.ts --run wfrun_nonexistent --db ${TEST_DB_PATH}`,
          false
        );
      }).toThrow();
    });
  });

  describe('workflow:cancel', () => {
    it('should cancel a running workflow', () => {
      const runId = startWorkflow('w1', 'test-book');
      runCLI(`npx tsx src/tooling/cli-commands/workflow-resume.ts --run ${runId} --db ${TEST_DB_PATH}`);

      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-cancel.ts --run ${runId} --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW CANCELLED');
      expect(output).toContain('New Status: failed');
      expect(output).toContain('Cancelled by user');
    });

    it('should cancel a paused workflow', () => {
      const runId = startWorkflow('w1', 'test-book');
      runCLI(`npx tsx src/tooling/cli-commands/workflow-resume.ts --run ${runId} --db ${TEST_DB_PATH}`);
      runCLI(`npx tsx src/tooling/cli-commands/workflow-pause.ts --run ${runId} --db ${TEST_DB_PATH}`);

      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-cancel.ts --run ${runId} --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW CANCELLED');
      expect(output).toContain('Previous Status: paused');
      expect(output).toContain('New Status: failed');
    });

    it('should cancel with custom reason', () => {
      const runId = startWorkflow('w1', 'test-book');
      runCLI(`npx tsx src/tooling/cli-commands/workflow-resume.ts --run ${runId} --db ${TEST_DB_PATH}`);

      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-cancel.ts --run ${runId} --reason "Test cancellation" --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW CANCELLED');
      expect(output).toContain('Test cancellation');
    });

    it('should accept positional run ID', () => {
      const runId = startWorkflow('w1', 'test-book');
      runCLI(`npx tsx src/tooling/cli-commands/workflow-resume.ts ${runId} --db ${TEST_DB_PATH}`);

      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-cancel.ts ${runId} --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW CANCELLED');
    });

    it('should show already terminated when workflow is completed', () => {
      // Note: We cannot easily test completed state since there's no CLI command for it
      // This test verifies the behavior for failed (cancelled) workflows
      const runId = startWorkflow('w1', 'test-book');
      runCLI(`npx tsx src/tooling/cli-commands/workflow-resume.ts --run ${runId} --db ${TEST_DB_PATH}`);
      runCLI(`npx tsx src/tooling/cli-commands/workflow-cancel.ts --run ${runId} --db ${TEST_DB_PATH}`);

      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-cancel.ts --run ${runId} --db ${TEST_DB_PATH}`
      );

      expect(output).toContain('WORKFLOW ALREADY TERMINATED');
    });

    it('should fail when trying to cancel a pending workflow', () => {
      const runId = startWorkflow('w1', 'test-book');

      // pending -> failed is not a valid transition
      expect(() => {
        runCLI(
          `npx tsx src/tooling/cli-commands/workflow-cancel.ts --run ${runId} --db ${TEST_DB_PATH}`,
          false
        );
      }).toThrow();
    });

    it('should fail without run ID', () => {
      expect(() => {
        runCLI(
          `npx tsx src/tooling/cli-commands/workflow-cancel.ts --db ${TEST_DB_PATH}`,
          false
        );
      }).toThrow();
    });

    it('should fail when workflow not found', () => {
      expect(() => {
        runCLI(
          `npx tsx src/tooling/cli-commands/workflow-cancel.ts --run wfrun_nonexistent --db ${TEST_DB_PATH}`,
          false
        );
      }).toThrow();
    });
  });

  describe('integration: full workflow lifecycle', () => {
    it('should complete full workflow lifecycle: start -> resume -> pause -> resume -> cancel', () => {
      // Start a workflow
      const runId = startWorkflow('w1', 'test-book');

      // Check initial status is pending
      let status = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-status.ts --run ${runId} --db ${TEST_DB_PATH}`
      );
      expect(status).toContain('pending');

      // Resume (pending -> running)
      runCLI(
        `npx tsx src/tooling/cli-commands/workflow-resume.ts --run ${runId} --db ${TEST_DB_PATH}`
      );
      status = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-status.ts --run ${runId} --db ${TEST_DB_PATH}`
      );
      expect(status).toContain('running');

      // Pause (running -> paused)
      runCLI(
        `npx tsx src/tooling/cli-commands/workflow-pause.ts --run ${runId} --db ${TEST_DB_PATH}`
      );
      status = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-status.ts --run ${runId} --db ${TEST_DB_PATH}`
      );
      expect(status).toContain('paused');

      // Resume (paused -> running)
      runCLI(
        `npx tsx src/tooling/cli-commands/workflow-resume.ts --run ${runId} --db ${TEST_DB_PATH}`
      );
      status = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-status.ts --run ${runId} --db ${TEST_DB_PATH}`
      );
      expect(status).toContain('running');

      // Cancel (running -> failed)
      runCLI(
        `npx tsx src/tooling/cli-commands/workflow-cancel.ts --run ${runId} --db ${TEST_DB_PATH}`
      );
      status = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-status.ts --run ${runId} --db ${TEST_DB_PATH}`
      );
      expect(status).toContain('failed');
    });

    it('should list workflows across lifecycle', () => {
      // Start multiple workflows with different states
      const run1 = startWorkflow('w1', 'test-book');
      const run2 = startWorkflow('w2', 'test-book');
      const run3 = startWorkflow('w3', 'test-book');

      // Leave run1 as pending
      // run2: pending -> running
      runCLI(`npx tsx src/tooling/cli-commands/workflow-resume.ts --run ${run2} --db ${TEST_DB_PATH}`);
      // run3: pending -> running -> paused
      runCLI(`npx tsx src/tooling/cli-commands/workflow-resume.ts --run ${run3} --db ${TEST_DB_PATH}`);
      runCLI(`npx tsx src/tooling/cli-commands/workflow-pause.ts --run ${run3} --db ${TEST_DB_PATH}`);

      // List all workflows
      const output = runCLI(
        `npx tsx src/tooling/cli-commands/workflow-list.ts --db ${TEST_DB_PATH}`
      );

      expect(output).toContain(run1);
      expect(output).toContain(run2);
      expect(output).toContain(run3);
      expect(output).toContain('3 workflow(s) found');
    });
  });
});
