# VP Engineering Plan

**Session:** sess_c7c49ec7
**Generated:** 2025-11-23T13:41:32.106Z

---

## Engineering Tasks

### Create Database Schema for Books and Settings - Define SQLite schema with books and settings tables

**Files:**
- `src/tooling/database/schema/books.sql`
- `src/tooling/database/migrations/001_books_and_settings.sql`

### Implement Book Repository - Create TypeScript repository class with CRUD operations for books and settings

**Files:**
- `src/tooling/books/repository.ts`
- `src/tooling/books/types.ts`
- `src/tooling/books/repository.test.ts`

**Dependencies:** task_mibljlxi_323d

### Build Book CLI Commands - Implement book:register, book:list, book:info CLI commands

**Files:**
- `src/tooling/cli-commands/book-register.ts`
- `src/tooling/cli-commands/book-list.ts`
- `src/tooling/cli-commands/book-info.ts`
- `src/tooling/cli-commands/book.test.ts`

**Dependencies:** task_mibljlxi_rkt9

### Register Core Rulebook as First Entry - Create seed script that registers the Core Rulebook with correct paths

**Files:**
- `src/tooling/books/seed.ts`
- `data/books/core-rulebook.json`

**Dependencies:** task_mibljlxi_lzw9

### Create Workflow Schema - Define workflow_runs table with status enum constraint and foreign keys

**Files:**
- `src/tooling/database/schema/workflows.sql`
- `src/tooling/database/migrations/002_workflow_runs.sql`

**Dependencies:** task_mibljlxi_323d

### Implement State Machine Logic - Create WorkflowStateMachine class that enforces valid transitions

**Files:**
- `src/tooling/workflows/state-machine.ts`
- `src/tooling/workflows/types.ts`
- `src/tooling/workflows/state-machine.test.ts`

**Dependencies:** task_mibljlxi_z19q

### Implement Workflow Repository - Create WorkflowRepository with start, status, pause, resume, cancel, list operations

**Files:**
- `src/tooling/workflows/repository.ts`
- `src/tooling/workflows/repository.test.ts`

**Dependencies:** task_mibljlxi_dkbj

### Build Workflow CLI Commands - Implement all workflow lifecycle CLI commands with consistent output formatting

**Files:**
- `src/tooling/cli-commands/workflow-start.ts`
- `src/tooling/cli-commands/workflow-status.ts`
- `src/tooling/cli-commands/workflow-pause.ts`
- `src/tooling/cli-commands/workflow-resume.ts`
- `src/tooling/cli-commands/workflow-cancel.ts`
- `src/tooling/cli-commands/workflow-list.ts`
- `src/tooling/cli-commands/workflow.test.ts`

**Dependencies:** task_mibljlxi_4ggv

### Workflow Integration Test - End-to-end test that starts a workflow, transitions through states, and completes

**Files:**
- `src/tooling/workflows/integration.test.ts`

**Dependencies:** task_mibljlxi_v64p

### Create Event and Rejection Schema - Define workflow_events and rejections tables with proper indices

**Files:**
- `src/tooling/database/schema/workflow-events.sql`
- `src/tooling/database/migrations/003_workflow_events_rejections.sql`

**Dependencies:** task_mibljlxi_z19q

### Implement Event Emitter - Create WorkflowEventEmitter class for agents to emit events

**Files:**
- `src/tooling/workflows/event-emitter.ts`
- `src/tooling/workflows/event-emitter.test.ts`

**Dependencies:** task_mibljlxj_4aia

### Implement Rejection Tracker - Create RejectionTracker that logs rejections and increments retry counters

**Files:**
- `src/tooling/workflows/rejection-tracker.ts`
- `src/tooling/workflows/rejection-tracker.test.ts`

**Dependencies:** task_mibljlxj_4aia

### Implement Smart Router - Create SmartRouter that maps rejection types to handler agents

**Files:**
- `src/tooling/workflows/smart-router.ts`
- `src/tooling/workflows/routing-config.ts`
- `src/tooling/workflows/smart-router.test.ts`

**Dependencies:** task_mibljlxj_jkoq

### Implement Escalation Trigger - Integrate escalation into rejection flow with retry limit

**Files:**
- `src/tooling/workflows/escalation.ts`
- `src/tooling/workflows/escalation.test.ts`

**Dependencies:** task_mibljlxj_jkoq, task_mibljlxj_eju7

### Create Artifact Schema - Define workflow_artifacts table with run_id reference

**Files:**
- `src/tooling/database/schema/artifacts.sql`
- `src/tooling/database/migrations/004_workflow_artifacts.sql`

**Dependencies:** task_mibljlxi_z19q

### Implement Artifact Registry - Create ArtifactRegistry class for registering and querying artifacts

**Files:**
- `src/tooling/workflows/artifact-registry.ts`
- `src/tooling/workflows/artifact-registry.test.ts`

**Dependencies:** task_mibljlxj_41t2

### Implement Cross-Workflow Artifact Query - Add methods to query artifacts from other workflow runs

**Files:**
- `src/tooling/workflows/artifact-query.ts`
- `src/tooling/workflows/artifact-query.test.ts`

**Dependencies:** task_mibljlxj_aeei

### Define Artifact Type Enum - Define artifact types for each workflow

**Files:**
- `src/tooling/workflows/artifact-types.ts`

**Dependencies:** task_mibljlxj_41t2

### Create Workflow Triggers Schema - Define workflow_triggers table for cross-workflow automation

**Files:**
- `src/tooling/database/schema/triggers.sql`
- `src/tooling/database/migrations/005_workflow_triggers.sql`

**Dependencies:** task_mibljlxi_z19q

### Implement Trigger Engine - Create TriggerEngine that watches for workflow completions and fires triggers

**Files:**
- `src/tooling/workflows/trigger-engine.ts`
- `src/tooling/workflows/trigger-engine.test.ts`

**Dependencies:** task_mibljlxj_g7ug, task_mibljlxj_phcc

### Add Test Coverage - Review and add missing tests to reach 80% coverage

**Files:**
- `src/tooling/workflows/*.test.ts`
- `vitest.config.ts`

**Dependencies:** task_mibljlxj_n36q

### Write Documentation - Create workflow lifecycle docs and developer guide

**Files:**
- `docs/workflows/lifecycle.md`
- `docs/developers/prework.md`

**Dependencies:** task_mibljlxj_qhv0
