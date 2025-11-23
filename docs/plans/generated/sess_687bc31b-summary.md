# Boardroom Session Summary

**Session ID:** sess_687bc31b
**Status:** active
**Proposal:** /Users/pandorz/Documents/razorweave/docs/plans/proposals/prework.md
**Created:** 2025-11-23T10:45:41.615Z

---

## Phases

### Book Registry Foundation

Establish the book registry system that all workflows depend on. This is the critical first step - without knowing what books exist and where their content lives, no workflow can operate.

**Acceptance Criteria:**
- Database tables books and settings are created and functional
- CLI commands book:register, book:list, book:info work correctly
- Core Rulebook is registered as first entry with correct paths
- Book lookup by slug returns complete book info
- Settings can optionally group books by genre

**Milestones:**
- Schema Definition: Book and settings tables created in SQLite
- Book CRUD Operations: Core book operations work programmatically
- Book CLI Complete: All book CLI commands functional
- Core Book Registered: First book entry validates the system

### Workflow Lifecycle Engine

Build the core workflow execution tracking that enables all four workflows (W1-W4) to track their state consistently. This is the runtime foundation.

**Acceptance Criteria:**
- Database table workflow_runs tracks execution state
- State machine enforces valid transitions: pending to running to paused to completed to failed
- CLI commands workflow:start, workflow:status, workflow:pause, workflow:resume, workflow:cancel, workflow:list all function
- Each workflow run links to a book and optional boardroom session
- Current agent tracking shows which step is active

**Milestones:**
- Workflow Schema: workflow_runs table with state machine constraints
- State Machine Logic: Valid state transitions enforced
- Workflow CLI Complete: All workflow lifecycle commands functional
- Integration Test: Start-to-complete workflow runs successfully

### Event System & Smart Routing

Enable agents to emit events during workflow execution and implement smart routing for rejections.

**Acceptance Criteria:**
- Database tables workflow_events and rejections capture agent activity
- Agents can emit: started, completed, rejected (with type), escalated events
- Rejection types categorized: style, mechanics, clarity, scope
- Retry counter increments on rejection
- Auto-escalation to human triggers after 3 retries
- Smart routing directs rejected items to appropriate handler

**Milestones:**
- Event Schema: workflow_events and rejections tables ready
- Event Emission: Agents can emit events to the system
- Rejection Tracking: Rejection types logged with retry counting
- Smart Routing Logic: Routing rules based on rejection type work
- Escalation Trigger: Auto-escalation after retry limit

### Artifact Sharing Layer

Enable workflows to register and share outputs. W1 chapter edits feed W2 PDF generation, W2 artifacts feed W3 publication, W4 feedback feeds W1.

**Acceptance Criteria:**
- Database table workflow_artifacts stores artifact references
- Artifacts registered with type, path, and source run
- Query artifacts by workflow run ID works
- Cross-workflow artifact lookup functions
- Artifact types defined for each workflow outputs

**Milestones:**
- Artifact Schema: workflow_artifacts table created
- Artifact Registration: Workflows can register outputs
- Artifact Query: Lookup by run ID and cross-workflow
- Type Definitions: Artifact types for W1/W2/W3/W4 defined

### Integration & Documentation

Wire all components together, ensure they work cohesively, add workflow triggers for cross-workflow automation, and complete user-facing documentation.

**Acceptance Criteria:**
- Database table workflow_triggers enables cross-workflow automation
- Trigger conditions work: on_complete, on_approve, manual
- Test coverage reaches 80% on all new code
- docs/workflows/lifecycle.md explains workflow system
- docs/developers/prework.md provides developer guide
- All CLI commands have --help text

**Milestones:**
- Trigger Schema: workflow_triggers table created
- Trigger Logic: Cross-workflow automation works
- Test Coverage: 80% coverage achieved
- Documentation: All docs written and reviewed

## Engineering Tasks

Total tasks: 22

- **Create Database Schema for Books and Settings - Define SQLite schema with books and settings tables**
  - Files: src/tooling/database/schema/books.sql, src/tooling/database/migrations/001_books_and_settings.sql
- **Implement Book Repository - Create TypeScript repository class with CRUD operations for books and settings**
  - Files: src/tooling/books/repository.ts, src/tooling/books/types.ts, src/tooling/books/repository.test.ts
- **Build Book CLI Commands - Implement book:register, book:list, book:info CLI commands**
  - Files: src/tooling/cli-commands/book-register.ts, src/tooling/cli-commands/book-list.ts, src/tooling/cli-commands/book-info.ts, src/tooling/cli-commands/book.test.ts
- **Register Core Rulebook as First Entry - Create seed script that registers the Core Rulebook with correct paths**
  - Files: src/tooling/books/seed.ts, data/books/core-rulebook.json
- **Create Workflow Schema - Define workflow_runs table with status enum constraint and foreign keys**
  - Files: src/tooling/database/schema/workflows.sql, src/tooling/database/migrations/002_workflow_runs.sql
- **Implement State Machine Logic - Create WorkflowStateMachine class that enforces valid transitions**
  - Files: src/tooling/workflows/state-machine.ts, src/tooling/workflows/types.ts, src/tooling/workflows/state-machine.test.ts
- **Implement Workflow Repository - Create WorkflowRepository with start, status, pause, resume, cancel, list operations**
  - Files: src/tooling/workflows/repository.ts, src/tooling/workflows/repository.test.ts
- **Build Workflow CLI Commands - Implement all workflow lifecycle CLI commands with consistent output formatting**
  - Files: src/tooling/cli-commands/workflow-start.ts, src/tooling/cli-commands/workflow-status.ts, src/tooling/cli-commands/workflow-pause.ts, src/tooling/cli-commands/workflow-resume.ts, src/tooling/cli-commands/workflow-cancel.ts, src/tooling/cli-commands/workflow-list.ts, src/tooling/cli-commands/workflow.test.ts
- **Workflow Integration Test - End-to-end test that starts a workflow, transitions through states, and completes**
  - Files: src/tooling/workflows/integration.test.ts
- **Create Event and Rejection Schema - Define workflow_events and rejections tables with proper indices**
  - Files: src/tooling/database/schema/workflow-events.sql, src/tooling/database/migrations/003_workflow_events_rejections.sql
- **Implement Event Emitter - Create WorkflowEventEmitter class for agents to emit events**
  - Files: src/tooling/workflows/event-emitter.ts, src/tooling/workflows/event-emitter.test.ts
- **Implement Rejection Tracker - Create RejectionTracker that logs rejections and increments retry counters**
  - Files: src/tooling/workflows/rejection-tracker.ts, src/tooling/workflows/rejection-tracker.test.ts
- **Implement Smart Router - Create SmartRouter that maps rejection types to handler agents**
  - Files: src/tooling/workflows/smart-router.ts, src/tooling/workflows/routing-config.ts, src/tooling/workflows/smart-router.test.ts
- **Implement Escalation Trigger - Integrate escalation into rejection flow with retry limit**
  - Files: src/tooling/workflows/escalation.ts, src/tooling/workflows/escalation.test.ts
- **Create Artifact Schema - Define workflow_artifacts table with run_id reference**
  - Files: src/tooling/database/schema/artifacts.sql, src/tooling/database/migrations/004_workflow_artifacts.sql
- **Implement Artifact Registry - Create ArtifactRegistry class for registering and querying artifacts**
  - Files: src/tooling/workflows/artifact-registry.ts, src/tooling/workflows/artifact-registry.test.ts
- **Implement Cross-Workflow Artifact Query - Add methods to query artifacts from other workflow runs**
  - Files: src/tooling/workflows/artifact-query.ts, src/tooling/workflows/artifact-query.test.ts
- **Define Artifact Type Enum - Define artifact types for each workflow**
  - Files: src/tooling/workflows/artifact-types.ts
- **Create Workflow Triggers Schema - Define workflow_triggers table for cross-workflow automation**
  - Files: src/tooling/database/schema/triggers.sql, src/tooling/database/migrations/005_workflow_triggers.sql
- **Implement Trigger Engine - Create TriggerEngine that watches for workflow completions and fires triggers**
  - Files: src/tooling/workflows/trigger-engine.ts, src/tooling/workflows/trigger-engine.test.ts
- **Add Test Coverage - Review and add missing tests to reach 80% coverage**
  - Files: src/tooling/workflows/*.test.ts, vitest.config.ts
- **Write Documentation - Create workflow lifecycle docs and developer guide**
  - Files: docs/workflows/lifecycle.md, docs/developers/prework.md
