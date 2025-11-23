# Boardroom Brainstorm

Use this command during Boardroom sessions after VP Product and VP Engineering have produced their plans. This is a collaborative design session where VP Operations provides operational perspective on each decision.

## Prerequisites

Before running this command:
1. A boardroom session must be active (session ID available)
2. VP Product plan must be complete and reviewed
3. VP Engineering plan must be complete and reviewed

## Process

### Phase 1: Load Context

1. Load the active boardroom session from DB
2. Load VP Product's plan (phases, milestones, risks)
3. Load VP Engineering's plan (tasks, dependencies, file paths)
4. Load any CEO feedback already provided

### Phase 2: Collaborative Design

For each design question:

1. **Formulate the question** with 2-4 options (A, B, C, D)
   - Prefer multiple choice when possible
   - Include trade-offs for each option

2. **Consult VP Operations** by running:
   ```bash
   pnpm vp:ops:consult --session <session-id> --question "<the question>" --options "<JSON array of options>"
   ```

   VP Ops will return:
   - Perspective on each option
   - Any **operational blockers** (flagged clearly)
   - Recommended option with reasoning

3. **Present to CEO** in this format:
   ```
   ═══════════════════════════════════════════════════════════
   DESIGN QUESTION
   ═══════════════════════════════════════════════════════════

   [Question text]

   OPTIONS:
   A) [Option A] - [brief description]
   B) [Option B] - [brief description]
   C) [Option C] - [brief description]
   D) [Option D] - [brief description]

   ───────────────────────────────────────────────────────────
   VP OPERATIONS PERSPECTIVE
   ───────────────────────────────────────────────────────────

   [VP Ops analysis of each option]

   **Recommendation:** [VP Ops recommended option]
   **Reasoning:** [Why they recommend it]

   **BLOCKERS:** [Any options flagged as operationally infeasible]

   ═══════════════════════════════════════════════════════════
   ```

4. **Record CEO decision**:
   - If CEO chooses a non-blocked option: record normally
   - If CEO overrides a blocker: prompt for reasoning, record both

5. **Persist to DB** via event log:
   ```jsonl
   {"ts":"...","table":"brainstorm_opinions","op":"INSERT","data":{
     "session_id": "...",
     "question": "...",
     "options": [...],
     "vp_ops_perspective": "...",
     "blockers": [...],
     "ceo_decision": "...",
     "override_reasoning": "..." // if applicable
   }}
   ```

### Phase 3: Design Document Generation

After all questions are resolved:

1. Generate the Design Plan document with:
   - Architecture decisions
   - Key components
   - Data flow
   - Error handling approach

2. Include **Key Tradeoffs** appendix:
   | Decision | VP Ops Input | CEO Decision | Reasoning |
   |----------|--------------|--------------|-----------|

3. Include **Overrides** appendix (if any):
   - Document any CEO overrides of VP Ops blockers
   - Include CEO's reasoning for each

4. Save to `docs/plans/designs/{date}-{topic}-design.md`

5. Record in DB via event log

## VP Ops Authority

VP Operations has **weighted advisory** authority:

- **Advisory**: Perspective on all options, recommendations
- **Blockers**: Can flag options as operationally infeasible
- **Override**: CEO can override blockers with documented reasoning

Blockers should be respected unless there's a compelling business reason to override.

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to evaluate options
- **YAGNI ruthlessly** - Remove unnecessary features from designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design in sections, validate each
- **Persist everything** - All decisions go to DB for audit trail

## Output

The brainstorm produces:
1. Design Plan document in `docs/plans/designs/`
2. DB records of all decisions and VP Ops input
3. Clear next steps for implementation
