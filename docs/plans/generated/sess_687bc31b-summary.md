---
status: ACTIVE
created: 2024-11-23
session_id: sess_687bc31b
approved: 2024-11-23
---

# Boardroom Session Summary

**Session ID:** sess_687bc31b
**Status:** APPROVED
**Proposal:** /Users/pandorz/Documents/razorweave/docs/plans/proposals/prework.md
**Created:** 2025-11-23T10:45:41.615Z
**Approved:** 2025-11-23 (CEO approval after schema unification brainstorm)

---

## Phases

### Phase 0: Schema Unification & Foundation (NEW)

Establish unified database infrastructure before building workflow features. Consolidate existing databases, add proper book registry with version linking, and implement plan lifecycle automation.

**Acceptance Criteria:**
- Single `data/project.db` contains all tables
- `books` table exists with Core Rulebook registered
- `book_versions` has `book_id` FK to `books`
- `workflow_runs` table ready with input/output version references
- All existing data preserved and verified
- `docs/plans/` has clear status indicators via frontmatter
- Plan lifecycle hooks functional (auto-complete on boardroom:approve)

**Milestones:**
- M0.1 Schema Audit: Document all existing tables and data
- M0.2 Unified Schema Design: Final schema approved by CEO
- M0.3 Migration Scripts: Create and test migration scripts
- M0.4 Data Migration: Execute migration, verify data integrity
- M0.5 Tool Updates: Update any scripts referencing old paths/schemas
- M0.6 Plan Cleanup: Archive completed plans, add status headers
- M0.7 Plan Lifecycle Automation: Build hooks for automatic plan state management

**Human Gate:** CEO Review #0 after M0.2 (approve schema before migration)

---

### Phase 1: Book Registry Foundation

Establish the book registry system that all workflows depend on. This is the critical first step - without knowing what books exist and where their content lives, no workflow can operate.

**Acceptance Criteria:**
- CLI commands book:register, book:list, book:info work correctly
- Core Rulebook is registered as first entry with correct paths
- Book lookup by slug returns complete book info

**Milestones:**
- Book CRUD Operations: Core book operations work programmatically
- Book CLI Complete: All book CLI commands functional
- Core Book Registered: First book entry validates the system

*Note: Schema tasks moved to Phase 0*

---

### Phase 2: Workflow Lifecycle Engine

Build the core workflow execution tracking that enables all four workflows (W1-W4) to track their state consistently. This is the runtime foundation.

**Acceptance Criteria:**
- Database table workflow_runs tracks execution state
- State machine enforces valid transitions: pending → running → paused → completed → failed
- CLI commands workflow:start, workflow:status, workflow:pause, workflow:resume, workflow:cancel, workflow:list all function
- Each workflow run links to a book and has input/output version references
- Current agent tracking shows which step is active

**Milestones:**
- Workflow Schema: workflow_runs table with state machine constraints
- State Machine Logic: Valid state transitions enforced
- Workflow CLI Complete: All workflow lifecycle commands functional
- Integration Test: Start-to-complete workflow runs successfully

---

### Phase 3: Event System & Smart Routing

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

---

### Phase 4: Artifact Sharing Layer

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

**Human Gate:** CEO Review #1 - Demo book registry + workflow CLI

---

### Phase 5: Integration & Documentation

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

**Human Gate:** CEO Review #2 - Final prework acceptance, approve W1 start

---

## Human Gates Summary

| Gate | After | Criteria |
|------|-------|----------|
| CEO Review #0 | Phase 0, M0.2 | Approve unified schema before migration |
| CEO Review #1 | Phase 4 | Demo book registry + workflow CLI |
| CEO Review #2 | Phase 5 | Final acceptance, approve W1 start |

---

## Engineering Tasks

**Phase 0 Tasks (NEW):** 7 tasks
- Schema audit and documentation
- Migration script development
- Data migration execution
- Tool updates for new paths
- Plan cleanup and archival
- Plan lifecycle CLI commands
- Boardroom hook for plan status

**Phases 1-5 Tasks:** 22 tasks (see detailed list below)

### Phase 1 Tasks
- **Implement Book Repository** - Create TypeScript repository class with CRUD operations
  - Files: src/tooling/books/repository.ts, src/tooling/books/types.ts, src/tooling/books/repository.test.ts
- **Build Book CLI Commands** - Implement book:register, book:list, book:info CLI commands
  - Files: src/tooling/cli-commands/book-register.ts, src/tooling/cli-commands/book-list.ts, src/tooling/cli-commands/book-info.ts
- **Register Core Rulebook** - Seed script for Core Rulebook with correct paths
  - Files: src/tooling/books/seed.ts

### Phase 2 Tasks
- **Implement State Machine Logic** - WorkflowStateMachine class enforcing valid transitions
  - Files: src/tooling/workflows/state-machine.ts, src/tooling/workflows/types.ts
- **Implement Workflow Repository** - CRUD operations for workflow runs
  - Files: src/tooling/workflows/repository.ts
- **Build Workflow CLI Commands** - All workflow lifecycle commands
  - Files: src/tooling/cli-commands/workflow-*.ts
- **Workflow Integration Test** - End-to-end lifecycle test
  - Files: src/tooling/workflows/integration.test.ts

### Phase 3 Tasks
- **Create Event and Rejection Schema** - Tables with proper indices
  - Files: src/tooling/database/migrations/003_workflow_events_rejections.sql
- **Implement Event Emitter** - WorkflowEventEmitter class
  - Files: src/tooling/workflows/event-emitter.ts
- **Implement Rejection Tracker** - Logging and retry counting
  - Files: src/tooling/workflows/rejection-tracker.ts
- **Implement Smart Router** - Rejection type to handler mapping
  - Files: src/tooling/workflows/smart-router.ts, src/tooling/workflows/routing-config.ts
- **Implement Escalation Trigger** - Auto-escalation after retry limit
  - Files: src/tooling/workflows/escalation.ts

### Phase 4 Tasks
- **Create Artifact Schema** - workflow_artifacts table
  - Files: src/tooling/database/migrations/004_workflow_artifacts.sql
- **Implement Artifact Registry** - Registration and querying
  - Files: src/tooling/workflows/artifact-registry.ts
- **Implement Cross-Workflow Artifact Query** - Cross-workflow lookups
  - Files: src/tooling/workflows/artifact-query.ts
- **Define Artifact Type Enum** - Types for W1/W2/W3/W4
  - Files: src/tooling/workflows/artifact-types.ts

### Phase 5 Tasks
- **Create Workflow Triggers Schema** - Cross-workflow automation table
  - Files: src/tooling/database/migrations/005_workflow_triggers.sql
- **Implement Trigger Engine** - Watch completions, fire triggers
  - Files: src/tooling/workflows/trigger-engine.ts
- **Add Test Coverage** - Reach 80% coverage
  - Files: src/tooling/workflows/*.test.ts
- **Write Documentation** - Lifecycle docs and developer guide
  - Files: docs/workflows/lifecycle.md, docs/developers/prework.md

---

## Key Design Decisions

| Decision | Choice |
|----------|--------|
| Book identity | Slug (stable) + path (updatable) |
| Version linking | workflow_runs has input_version_id, output_version_id |
| Database location | `data/project.db` (consolidate all) |
| Plan lifecycle | Frontmatter status + hooks + CLI commands |

---

## Related Documents

- [Unified Schema Design](../2024-11-23-prework-unified-schema-design.md) - Detailed schema and migration plan
- [Original Proposal](../proposals/prework.md) - Initial prework proposal
- [Boardroom Design](../2024-11-22-phase0-boardroom-design.md) - Phase 0 boardroom system design

---

*Session approved by CEO on 2024-11-23 after schema unification brainstorming session.*
