# CLI Reference

Complete reference for all Razorweave CLI commands.

## Workflow Engine (`wf:*`)

Commands for the workflow orchestration engine.

### wf:prompt

Generate a prompt for Claude Code to execute a workflow session.

```bash
# Basic (core personas only)
pnpm wf:prompt --type w1_editing --book <slug> --with-review

# With additional generated personas (40 total: 10 core + 30 generated)
pnpm wf:prompt --type w1_editing --book <slug> --with-review --plus=30

# With focus category for weighted sampling
pnpm wf:prompt --type w1_editing --book <slug> --with-review --plus=30 --focus=combat
```

**Options:**
- `--type, -t` - Workflow type (e.g., `w1_editing`)
- `--book, -b` - Book slug
- `--with-review` - Include fresh review + analysis step
- `--plus, -p` - Add N generated personas (weighted sampling)
- `--focus, -f` - Focus category: `general`, `gm-content`, `combat`, `narrative`, `character-creation`, `quickstart`

### wf:start

Start a new workflow run.

```bash
pnpm wf:start --type w1_editing --book core-rulebook
```

### wf:result

Report step completion to advance the workflow.

```bash
# Success with result data
pnpm wf:result --run <run-id> --success --result '{"planId": "plan_123"}'

# Failure with error message
pnpm wf:result --run <run-id> --failure --error "Step failed"

# With branch hint for conditional steps
pnpm wf:result --run <run-id> --success --hint "needs_revision"
```

### wf:gate

Handle human gate decisions.

```bash
pnpm wf:gate --run <run-id> --decision "Approve"
pnpm wf:gate --run <run-id> --decision "Request Changes" --input "Fix chapter 3"
```

### wf:status

Check workflow run status.

```bash
pnpm wf:status --run <run-id>
```

### wf:list

List workflow runs.

```bash
pnpm wf:list
pnpm wf:list --book core-rulebook
pnpm wf:list --status running
```

### wf:resume

Resume a paused workflow.

```bash
pnpm wf:resume --run <run-id>
```

---

## Review System (`review:*`)

Commands for persona-based content review campaigns.

### review:book

Create a review campaign for a book.

```bash
# Core personas only (10 reviewers)
pnpm review:book <slug-or-path>

# Fresh campaign (ignores existing)
pnpm review:book <slug> --fresh

# Core + 30 generated personas (40 total)
pnpm review:book <slug> --plus=30

# Generated personas only
pnpm review:book <slug> --generated=20

# With focus category
pnpm review:book <slug> --plus=30 --focus=combat
```

### review:chapter

Create a review campaign for a single chapter.

```bash
pnpm review:chapter <chapter-path>
```

### review:analyze

Analyze completed reviews to generate improvement analysis.

```bash
pnpm review:analyze <campaign-id>
```

### review:status

Check campaign completion status.

```bash
pnpm review:status <campaign-id>
```

### review:list

List all review campaigns.

```bash
pnpm review:list
pnpm review:list --status completed
```

### review:view

View campaign details.

```bash
pnpm review:view <campaign-id>
```

### review:add-reviewers

Add more reviewers to an existing campaign.

```bash
pnpm review:add-reviewers <campaign-id> --plus=10
pnpm review:add-reviewers <campaign-id> --core
```

### review:reanalyze

Re-run analysis on a campaign.

```bash
pnpm review:reanalyze <campaign-id>
```

### review:collect

Collect review JSON files written by agents and persist to database.

```bash
pnpm review:collect <campaign-id>
```

This reads JSON files from `data/reviews/raw/<campaign-id>/` and persists valid reviews to the database. Run this after reviewer agents have completed writing their JSON output files.

---

## W1 Editing (`w1:*`)

Commands for the W1 editing workflow steps.

### w1:strategic

Generate PM planning prompts and manage strategic plans.

```bash
# Step 1: Generate PM planning prompt from analysis
pnpm w1:strategic --book=core-rulebook --analysis=<path>
# → Outputs prompt for PM Agent to create plan.json

# Step 2: Save AI-generated plan to database
pnpm w1:strategic --save-plan=./plan.json --book=core-rulebook
# → Validates plan, saves to DB, outputs execution prompt

# Or: Full workflow with fresh reviews
pnpm w1:strategic --book=core-rulebook --fresh

# Resume interrupted session
pnpm w1:strategic --resume=<plan-id>

# List all plans
pnpm w1:strategic --list
```

**Options:**
- `--analysis, -a` - Path to review analysis (generates PM prompt)
- `--save-plan, -s` - Path to AI-generated plan JSON (saves to DB)
- `--fresh, -f` - Run full review + analyze + planning pipeline
- `--resume, -r` - Resume existing plan by ID
- `--list, -l` - List all strategic plans
- `--metric-threshold` - Target score (default: 8.0)
- `--max-cycles` - Max cycles per area (default: 3)
- `--max-areas` - Max improvement areas (default: 6)

### w1:content-modify

Apply content modifications to chapters.

```bash
pnpm w1:content-modify --book <slug> --plan <plan-id>
```

### w1:validate

Run validation pipeline on book.

```bash
pnpm w1:validate --book <slug>
```

### w1:validate-chapters

Validate individual chapters.

```bash
pnpm w1:validate-chapters --book <slug>
```

### w1:finalize

Finalize changes and create new book version.

```bash
pnpm w1:finalize --book <slug> --plan <plan-id>
```

### w1:finalize-web-html

Generate web HTML from finalized content.

```bash
pnpm w1:finalize-web-html --book <slug>
```

### w1:human-gate

Present human gate for approval.

```bash
pnpm w1:human-gate --book <slug> --plan <plan-id>
```

### w1:verify-foundation

Verify prerequisites for W1 workflow.

```bash
pnpm w1:verify-foundation --book <slug>
```

---

## Book Management (`book:*`)

Commands for managing books in the database.

### book:register

Register a new book.

```bash
pnpm book:register --slug <slug> --title "Book Title" --path books/my-book
```

### book:list

List all registered books.

```bash
pnpm book:list
```

### book:info

Show book details.

```bash
pnpm book:info <slug>
```

### build:book

Build a complete book (HTML, PDF).

```bash
pnpm build:book <slug>
```

---

## HTML Generation (`html:*`)

Commands for generating HTML output.

### html:print:build

Build print-optimized HTML.

```bash
pnpm html:print:build <slug>
```

### html:print:list

List print HTML versions.

```bash
pnpm html:print:list <slug>
```

### html:print:diff

Compare print HTML versions.

```bash
pnpm html:print:diff <slug> <version1> <version2>
```

### html:print:promote

Promote print HTML to production.

```bash
pnpm html:print:promote <slug> <version>
```

### html:web:build

Build web-optimized HTML.

```bash
pnpm html:web:build <slug>
```

### html:web:list / diff / promote

Same pattern as print commands.

---

## PDF Generation (`pdf:*`)

### pdf:build

Generate PDF from HTML.

```bash
pnpm pdf:build <slug>
```

---

## Database (`db:*`)

Commands for database management.

### db:migrate

Run database migrations.

```bash
pnpm db:migrate
pnpm db:migrate --dry-run
```

### db:seed

Seed database with initial data.

```bash
pnpm db:seed
```

### db:verify

Verify database integrity.

```bash
pnpm db:verify
```

### db:materialize

Materialize computed views.

```bash
pnpm db:materialize
```

---

## Personas (`personas:*`)

Commands for managing reviewer personas.

### personas:hydrate

Hydrate core personas from definitions.

```bash
pnpm personas:hydrate
```

### personas:generate

Generate additional personas.

```bash
pnpm personas:generate 50
pnpm personas:generate 50 --seed=42
```

### personas:stats

Show persona statistics.

```bash
pnpm personas:stats
```

---

## Development Commands

### Build & Test

```bash
pnpm build          # Build all packages
pnpm test           # Run tests
pnpm test:watch     # Run tests in watch mode
pnpm typecheck      # Type check all packages
pnpm lint           # Run linters
pnpm lint:fix       # Auto-fix lint issues
```

### Site

```bash
pnpm site:dev       # Start dev server
pnpm site:build     # Build static site
pnpm site:deploy    # Deploy to production
```

---

## Common Workflows

### Full Review + Edit Cycle

```bash
# 1. Generate prompt for Claude Code session
pnpm wf:prompt --type w1_editing --book core-rulebook --with-review --plus=30

# 2. Copy output to new Claude Code session
# 3. Claude Code executes the workflow
```

### Quick Review Only

```bash
# 1. Create campaign
pnpm review:book core-rulebook --fresh --plus=30

# 2. Execute reviews (Claude Code agents)
# 3. Analyze results
pnpm review:analyze <campaign-id>
```

### Manual W1 Steps

```bash
# 1. Create strategic plan
pnpm w1:strategic --book=core-rulebook --analysis=<path>

# 2. Apply modifications
pnpm w1:content-modify --book core-rulebook --plan <plan-id>

# 3. Validate
pnpm w1:validate --book core-rulebook

# 4. Finalize
pnpm w1:finalize --book core-rulebook --plan <plan-id>
```
