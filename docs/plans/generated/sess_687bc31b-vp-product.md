# VP Product Plan

**Session:** sess_687bc31b
**Generated:** 2025-11-23T10:51:18.971Z

---

## Phases

### 1. Book Registry Foundation

Establish the book registry system that all workflows depend on. This is the critical first step - without knowing what books exist and where their content lives, no workflow can operate.

**Acceptance Criteria:**
- [ ] Database tables books and settings are created and functional
- [ ] CLI commands book:register, book:list, book:info work correctly
- [ ] Core Rulebook is registered as first entry with correct paths
- [ ] Book lookup by slug returns complete book info
- [ ] Settings can optionally group books by genre

**Milestones:**
1. Schema Definition
1. Book CRUD Operations
1. Book CLI Complete
1. Core Book Registered

### 2. Workflow Lifecycle Engine

Build the core workflow execution tracking that enables all four workflows (W1-W4) to track their state consistently. This is the runtime foundation.

**Acceptance Criteria:**
- [ ] Database table workflow_runs tracks execution state
- [ ] State machine enforces valid transitions: pending to running to paused to completed to failed
- [ ] CLI commands workflow:start, workflow:status, workflow:pause, workflow:resume, workflow:cancel, workflow:list all function
- [ ] Each workflow run links to a book and optional boardroom session
- [ ] Current agent tracking shows which step is active

**Milestones:**
1. Workflow Schema
1. State Machine Logic
1. Workflow CLI Complete
1. Integration Test

### 3. Event System & Smart Routing

Enable agents to emit events during workflow execution and implement smart routing for rejections.

**Acceptance Criteria:**
- [ ] Database tables workflow_events and rejections capture agent activity
- [ ] Agents can emit: started, completed, rejected (with type), escalated events
- [ ] Rejection types categorized: style, mechanics, clarity, scope
- [ ] Retry counter increments on rejection
- [ ] Auto-escalation to human triggers after 3 retries
- [ ] Smart routing directs rejected items to appropriate handler

**Milestones:**
1. Event Schema
1. Event Emission
1. Rejection Tracking
1. Smart Routing Logic
1. Escalation Trigger

### 4. Artifact Sharing Layer

Enable workflows to register and share outputs. W1 chapter edits feed W2 PDF generation, W2 artifacts feed W3 publication, W4 feedback feeds W1.

**Acceptance Criteria:**
- [ ] Database table workflow_artifacts stores artifact references
- [ ] Artifacts registered with type, path, and source run
- [ ] Query artifacts by workflow run ID works
- [ ] Cross-workflow artifact lookup functions
- [ ] Artifact types defined for each workflow outputs

**Milestones:**
1. Artifact Schema
1. Artifact Registration
1. Artifact Query
1. Type Definitions

### 5. Integration & Documentation

Wire all components together, ensure they work cohesively, add workflow triggers for cross-workflow automation, and complete user-facing documentation.

**Acceptance Criteria:**
- [ ] Database table workflow_triggers enables cross-workflow automation
- [ ] Trigger conditions work: on_complete, on_approve, manual
- [ ] Test coverage reaches 80% on all new code
- [ ] docs/workflows/lifecycle.md explains workflow system
- [ ] docs/developers/prework.md provides developer guide
- [ ] All CLI commands have --help text

**Milestones:**
1. Trigger Schema
1. Trigger Logic
1. Test Coverage
1. Documentation
