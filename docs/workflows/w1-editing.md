# W1 Editing Workflow

The W1 Editing Workflow takes review feedback and produces improved book content through an iterative agent-assisted process.

## Quick Start (Strategic Command)

The simplest way to run W1 is with the strategic command:

```bash
# Full workflow with fresh reviews
pnpm w1:strategic --book=core-rulebook --fresh

# Or use existing analysis
pnpm w1:strategic --book=core-rulebook --analysis=data/reviews/analysis/campaign-xxx.md

# Resume a failed/interrupted session
pnpm w1:strategic --resume=strat_abc123

# List all strategic plans
pnpm w1:strategic --list
```

This generates a single prompt that guides Claude Code through the entire workflow:
1. Reviews (if `--fresh`)
2. Analysis
3. Strategic planning
4. Content modification iterations
5. Validation with metrics check
6. Human gate approval
7. Finalization (creates new book version)

### Configuration Options

```bash
pnpm w1:strategic --book=core-rulebook --analysis=<path> \
  --metric-threshold=8.0 \    # Target overall score (default: 8.0)
  --max-cycles=3 \            # Max iteration cycles per area (default: 3)
  --delta-threshold=1.0 \     # Cumulative delta before validation (default: 1.0)
  --max-runs=5 \              # Max parallel runs (default: 5)
  --max-areas=6 \             # Max improvement areas (default: 6)
  --use-dynamic-deltas        # Enable dynamic threshold scaling
```

### Parallel Execution Model

The W1 workflow now supports parallel execution of multiple improvement areas:

1. **Areas** - Independent improvement tracks (e.g., "Clarity Issues", "Combat Chapters")
2. **Cycles** - Iterations within each area (edit → review → measure)
3. **Runs** - Batches where all areas execute in parallel

With `--max-areas=6` and `--max-runs=5`, up to 6 areas can iterate up to 5 times each.

### Dynamic Threshold Scaling

When `--use-dynamic-deltas` is enabled, the delta threshold scales based on current score:

| Current Score | Delta Threshold |
|---------------|-----------------|
| < 7.0         | 1.0 (full improvement expected) |
| 7.0 - 7.9     | 0.7 |
| 8.0 - 8.9     | 0.3 |
| 9.0+          | 0.1 (diminishing returns) |

This prevents the workflow from getting stuck when scores plateau at high levels.

### State Persistence

Strategic plans are saved to the database and `data/w1-strategic/{plan_id}/`:
- `strategy.json` - Goal, improvement areas, configuration
- `state.json` - Current phase, cycle count, progress

If a session crashes, `--resume` picks up from the last saved state.

---

## Manual Workflow (Individual Commands)

For fine-grained control, you can run individual commands:

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

### Phase 4: Human Gate

**Command:** `pnpm w1:human-gate`

Presents changes for human review and approval. This is a mandatory checkpoint before finalization.

```bash
# Review current state
pnpm w1:human-gate --run=<runId>

# Approve and allow finalization
pnpm w1:human-gate --approve --run=<runId>

# Reject with reason
pnpm w1:human-gate --reject --run=<runId> --reason="Need more iteration on chapter 6"

# Full review mode (builds HTML, runs fresh persona reviews)
pnpm w1:human-gate --full-review --run=<runId>
```

#### Full Review Mode

The `--full-review` option provides a comprehensive review process:

1. **Build HTML** - Builds the book with pending changes for visual review
2. **Run Core Persona Reviews** - Executes fresh reviews with 10 core personas
3. **Analyze Reviews** - Compare new analysis against baseline
4. **Make Decision** - Approve or reject based on analysis

This is recommended for significant changes or when scores are borderline.

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

# 6. Human Gate
pnpm w1:human-gate --run=wfrun_abc123
# [Review changes]
pnpm w1:human-gate --approve --run=wfrun_abc123

# 7. Finalization
pnpm w1:finalize --run=wfrun_abc123
# [Execute finalization]
pnpm w1:finalize --save --run=wfrun_abc123 --artifacts=./final/
```

## Integration with Other Workflows

- **Input:** Review analysis from Review System (`data/reviews/analysis/`)
- **Output:** Artifacts for W2 PDF workflow and W3 Publication workflow

## CLI Reference

### Strategic Command (Recommended)

| Command | Description |
|---------|-------------|
| `pnpm w1:strategic --book=<slug> --fresh` | Full workflow with fresh reviews |
| `pnpm w1:strategic --book=<slug> --analysis=<path>` | Workflow with existing analysis |
| `pnpm w1:strategic --resume=<plan-id>` | Resume interrupted session |
| `pnpm w1:strategic --list` | List all strategic plans |
| `pnpm w1:strategic --book=<slug> --max-areas=6 --use-dynamic-deltas` | Parallel areas with dynamic thresholds |

### Individual Commands

| Command | Description |
|---------|-------------|
| `pnpm w1:verify-foundation` | Verify infrastructure ready |
| `pnpm w1:planning` | Planning phase |
| `pnpm w1:content-modify` | Content modification phase |
| `pnpm w1:validate-chapters` | Chapter validation |
| `pnpm w1:validate` | Metrics validation |
| `pnpm w1:human-gate` | Human approval gate |
| `pnpm w1:human-gate --full-review` | Full review with HTML build and fresh reviews |
| `pnpm w1:finalize-print-html` | Generate print HTML |
| `pnpm w1:finalize-web-html` | Generate web HTML |
| `pnpm w1:finalize` | Full finalization (creates new book version) |

### Build Commands

| Command | Description |
|---------|-------------|
| `pnpm build:book --run=<runId>` | Build HTML for workflow review (outputs to `data/html/review/<runId>/`) |
| `pnpm build:book --book=<slug>` | Build HTML for specific book |
| `pnpm build:book --book=<slug> --output=<path>` | Build to custom output path |

The `build:book` command always force-rebuilds to include any pending (uncommitted) changes. This is useful during the human gate full-review phase to visualize changes before approval.
