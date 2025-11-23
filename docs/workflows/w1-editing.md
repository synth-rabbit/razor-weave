# W1 Editing Workflow

The W1 Editing Workflow takes review feedback and produces improved book content through an iterative agent-assisted process.

## Quick Start

```bash
# Step 1: Run planning phase
pnpm w1:planning --book=book_core --analysis=./data/reviews/analysis/campaign-xxx.md

# Step 2: Read the generated prompt, execute planning task
# Step 3: Save the plan
pnpm w1:planning --save --run=<runId> --plan=./plan.json

# Step 4: Run content modification
pnpm w1:content-modify --run=<runId>

# Continue through validation and finalization...
```

## Workflow Phases

### Phase 1: Planning

**Command:** `pnpm w1:planning`

The PM agent analyzes review feedback and creates an improvement plan targeting the highest-impact issues.

```bash
# Generate prompt
pnpm w1:planning --book=<book-id> --analysis=<path-to-analysis.md>

# After executing the planning task, save result
pnpm w1:planning --save --run=<runId> --plan=<path-to-plan.json>
```

**Outputs:**
- `data/w1-artifacts/{runId}/plan.json` - Improvement plan

### Phase 2: Content Modification

**Command:** `pnpm w1:content-modify`

Three agents work in sequence:
1. **Writer** - Implements plan modifications
2. **Editor** - Reviews for grammar, clarity, style
3. **Domain Expert** - Reviews for game rules consistency

```bash
# Generate writer prompt
pnpm w1:content-modify --run=<runId>

# Save writer output
pnpm w1:content-modify --save-writer --run=<runId> --chapters=<dir>

# Generate editor prompt
pnpm w1:content-modify --generate-editor --run=<runId>

# Save editor result
pnpm w1:content-modify --save-editor --run=<runId> --result=<path>

# Generate domain expert prompt
pnpm w1:content-modify --generate-domain --run=<runId>

# Save domain expert result
pnpm w1:content-modify --save-domain --run=<runId> --result=<path>
```

### Parallel Chapter Writing

When modifying multiple chapters, the writer phase uses parallel subagents:

1. CLI generates `shared-context.md` with plan summary and style guides
2. CLI generates an orchestrator prompt listing chapter batches
3. Claude Code dispatches Task() subagents (up to 5 per batch)
4. Each subagent reads shared context, modifies one chapter
5. After batch completes, next batch starts
6. Save all results with `--save-writer`

This pattern matches the review system's parallel execution approach.

#### Generated Files

The CLI generates these files in `data/w1-prompts/{runId}/`:

| File | Purpose |
|------|---------|
| `shared-context.md` | Plan summary, style guides, consistency notes for subagents |
| `writer.txt` | Orchestrator prompt with batch assignments and Task() template |
| `writer-legacy.txt` | Single-file prompt for sequential execution (fallback) |

### Phase 3: Validation

**Command:** `pnpm w1:validate`

Re-reviews modified chapters and evaluates improvement metrics.

```bash
# Generate validation prompts
pnpm w1:validate --run=<runId>

# Save validation results
pnpm w1:validate --save --run=<runId> --result=<path>
```

### Phase 4: Human Approval

**Command:** `pnpm w1:human-approve`

Presents changes for human review and approval.

```bash
pnpm w1:human-approve --run=<runId>
```

### Phase 5: Finalization

**Command:** `pnpm w1:finalize`

Generates final outputs: Print HTML, Web HTML, Release Notes.

```bash
# Generate finalization prompts
pnpm w1:finalize --run=<runId>

# Save results
pnpm w1:finalize --save --run=<runId> --artifacts=<dir>
```

## Prompt-Based Architecture

W1 uses the **prompt-based agent pattern** (see `docs/developers/agent-architecture.md`):

1. CLI generates prompt files to `data/w1-prompts/{runId}/`
2. Claude Code reads prompts and executes tasks
3. Results saved via `--save` subcommands
4. Workflow state tracked in database

This keeps humans in the loop and leverages Claude Code as the execution engine.

## Prompt Files

```
data/w1-prompts/{runId}/
├── pm-planning.txt      # PM planning prompt
├── writer.txt           # Writer modification prompt
├── editor-review.txt    # Editor review prompt
├── domain-expert.txt    # Domain expert prompt
├── pm-metrics.txt       # Metrics evaluation prompt
└── release-notes.txt    # Release notes prompt
```

## Artifacts

| Artifact Type | Location | Description |
|--------------|----------|-------------|
| `improvement_plan` | `data/w1-artifacts/{runId}/plan.json` | PM improvement plan |
| `modified_chapter` | `data/w1-artifacts/{runId}/chapters/` | Modified chapter content |
| `editor_review` | `data/w1-artifacts/{runId}/editor-review.json` | Editor feedback |
| `domain_expert_review` | `data/w1-artifacts/{runId}/domain-review.json` | Domain expert feedback |
| `metrics_evaluation` | `data/w1-artifacts/{runId}/metrics.json` | Before/after metrics |
| `release_notes` | `data/w1-artifacts/{runId}/release-notes.md` | Generated release notes |

## Complete Workflow Example

```bash
# 1. Planning
pnpm w1:planning --book=book_core --analysis=./analysis.md
# → Generates prompt, creates workflow run
# [Execute planning task with Claude Code]
pnpm w1:planning --save --run=wfrun_abc123 --plan=./plan.json

# 2. Content Modification - Writer
pnpm w1:content-modify --run=wfrun_abc123
# [Execute writer task]
pnpm w1:content-modify --save-writer --run=wfrun_abc123 --chapters=./chapters/

# 3. Content Modification - Editor
pnpm w1:content-modify --generate-editor --run=wfrun_abc123
# [Execute editor task]
pnpm w1:content-modify --save-editor --run=wfrun_abc123 --result=./editor.json

# 4. Content Modification - Domain Expert
pnpm w1:content-modify --generate-domain --run=wfrun_abc123
# [Execute domain expert task]
pnpm w1:content-modify --save-domain --run=wfrun_abc123 --result=./domain.json

# 5. Validation
pnpm w1:validate --run=wfrun_abc123
# [Execute validation]
pnpm w1:validate --save --run=wfrun_abc123 --result=./metrics.json

# 6. Human Approval
pnpm w1:human-approve --run=wfrun_abc123
# [Review and approve]

# 7. Finalization
pnpm w1:finalize --run=wfrun_abc123
# [Execute finalization]
pnpm w1:finalize --save --run=wfrun_abc123 --artifacts=./final/
```

## Integration with Other Workflows

- **Input:** Review analysis from Review System (`data/reviews/analysis/`)
- **Output:** Artifacts for W2 PDF workflow and W3 Publication workflow

## CLI Reference

| Command | Description |
|---------|-------------|
| `pnpm w1:verify-foundation` | Verify infrastructure ready |
| `pnpm w1:planning` | Planning phase |
| `pnpm w1:content-modify` | Content modification phase |
| `pnpm w1:validate-chapters` | Chapter validation |
| `pnpm w1:validate` | Metrics validation |
| `pnpm w1:human-approve` | Human approval gate |
| `pnpm w1:finalize-print-html` | Generate print HTML |
| `pnpm w1:finalize-web-html` | Generate web HTML |
| `pnpm w1:finalize` | Full finalization orchestrator |
