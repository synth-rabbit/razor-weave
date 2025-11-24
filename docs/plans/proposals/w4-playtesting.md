---
status: DRAFT
created: 2024-11-23
workflow: W4
---

# W4 Playtesting Workflow Proposal

**Date:** 2024-11-23
**Author:** CEO
**Purpose:** Define the playtesting workflow for gathering gameplay feedback through both human GPT sessions and agentic virtual sessions.

---

## Context

This workflow runs after the core book is fully published (W3 complete). It provides ongoing feedback to improve the game through actual play experience. Feedback feeds back into W1 for future editing cycles.

### Dependencies
- **Prework complete:** Book registry, workflow lifecycle, event system, artifact sharing
- **Core book published:** At least one complete W1→W2→W3 cycle
- **Custom GPT:** Playtesting GPT with access to core book and settings

---

## Goal

Gather gameplay feedback through dual-track playtesting:
1. **Human GPT Sessions** - CEO plays with custom GPT, captures session data
2. **Agentic Sessions** - Virtual GM + 3 Player agents run simulated sessions

Both tracks produce feedback that feeds into W1 for game improvements.

---

## Dual-Track Architecture

### Track A: Human GPT Playtesting

```mermaid
flowchart TD
  Start[Start] --> GPT[CEO plays with Playtesting GPT]
  GPT --> Save[Save session transcript]
  Save --> Import[Import session to system]
  Import --> Analysis[Run playtest analysis]
  Analysis --> Feedback[Generate W1 feedback]
  Feedback --> End[End]
```

**Process:**
1. CEO conducts playtesting session with custom GPT
2. GPT has access to core book and setting information
3. Session transcript saved externally
4. `w4:import-session` imports transcript into system
5. Analysis agent extracts actionable feedback
6. Feedback registered as W1 input artifact

### Track B: Agentic Playtesting

```mermaid
flowchart TD
  Start[Start] --> Setup[Configure session parameters]
  Setup --> GM[GM Agent prepares scenario]
  GM --> Session[Run virtual session]
  Session --> P1[Player 1 Agent]
  Session --> P2[Player 2 Agent]
  Session --> P3[Player 3 Agent]
  P1 --> Transcript[Combine session transcript]
  P2 --> Transcript
  P3 --> Transcript
  Transcript --> Analysis[Run playtest analysis]
  Analysis --> Feedback[Generate W1 feedback]
  Feedback --> End[End]
```

**Process:**
1. Configure session (setting, scenario type, character types)
2. GM Agent prepares scenario using core book + setting
3. Three Player Agents create characters and play
4. Session runs with structured turn-taking
5. Full transcript captured
6. Analysis agent extracts actionable feedback
7. Feedback registered as W1 input artifact

---

## Agents

All agents follow the **prompt-based pattern** (see `docs/developers/agent-architecture.md`):
1. CLI generates prompt files with full context
2. Claude Code reads prompts and executes tasks
3. Results saved via `--save` subcommands

### GM Agent (Track B)

**Prompt Generator:** `generateGmPrompt(context)`

**Inputs:**
- Core book content
- Setting information (if applicable)
- Session parameters (scenario type, difficulty)

**Outputs:**
- Prepared scenario JSON
- Session narrative
- GM observations

**CLI:**
```bash
pnpm w4:run-session --book=<slug> --setting=<slug>  # Generate GM prompt
pnpm w4:run-session --save-gm --session=<id> --scenario=<path>  # Save scenario
```

---

### Player Agents (Track B)

**Prompt Generator:** `generatePlayerPrompt(context, playerIndex)`

**Inputs:**
- Core book (character creation, rules)
- Setting information
- GM scenario and prompts

**Outputs:**
- Character sheet JSON
- Player actions
- In-character responses

**CLI:**
```bash
# Player prompts generated as part of session
pnpm w4:run-session --generate-players --session=<id>
pnpm w4:run-session --save-player --session=<id> --player=1 --actions=<path>
```

---

### Playtest Analysis Agent (Both Tracks)

**Prompt Generator:** `generateAnalysisPrompt(context)`

**Inputs:**
- Session transcript
- Core book reference
- Previous feedback history

**Outputs:**
- Playtest analysis report JSON
- Categorized feedback items
- Severity ratings

**CLI:**
```bash
pnpm w4:analyze --session=<id>         # Generate analysis prompt
pnpm w4:analyze --save --session=<id> --report=<path>  # Save result
```

---

### Feedback Generator Agent (Both Tracks)

**Prompt Generator:** `generateFeedbackPrompt(context)`

**Inputs:**
- Playtest analysis
- Existing W1 backlog

**Outputs:**
- W1 feedback artifact JSON
- Prioritized improvement suggestions

**CLI:**
```bash
pnpm w4:generate-feedback --session=<id>  # Generate prompt
pnpm w4:generate-feedback --save --session=<id> --feedback=<path>  # Save result
```

---

## Data I/O

### Inputs
- Core book content (current published version)
- Setting information
- Session parameters
- Human GPT transcripts (Track A)

### Outputs
- Session transcripts
- Playtest analysis reports
- W1 feedback artifacts

---

## Workflow Artifacts

| Artifact Type | Description |
|--------------|-------------|
| `playtest_session` | Full session transcript |
| `playtest_analysis` | Analysis report |
| `playtest_feedback` | W1-ready feedback items |

---

## Database Schema

```sql
-- Playtest sessions
playtest_sessions (
  id TEXT PRIMARY KEY,
  workflow_run_id TEXT REFERENCES workflow_runs,
  track TEXT NOT NULL,  -- 'human_gpt' | 'agentic'
  book_id TEXT REFERENCES books,
  setting_id TEXT,
  session_date TIMESTAMP,
  transcript TEXT,
  status TEXT,  -- 'imported' | 'analyzed' | 'feedback_generated'
  created_at TIMESTAMP
)

-- Playtest analysis results
playtest_analysis (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES playtest_sessions,
  category TEXT,  -- 'clarity' | 'balance' | 'fun' | 'mechanics'
  severity TEXT,  -- 'low' | 'medium' | 'high'
  finding TEXT,
  recommendation TEXT,
  created_at TIMESTAMP
)

-- Feedback items for W1
playtest_feedback (
  id TEXT PRIMARY KEY,
  analysis_id TEXT REFERENCES playtest_analysis,
  target_workflow TEXT DEFAULT 'w1_editing',
  priority INTEGER,
  description TEXT,
  status TEXT,  -- 'pending' | 'accepted' | 'rejected' | 'implemented'
  created_at TIMESTAMP
)
```

---

## CLI Commands

```bash
# Track A: Import human GPT session
pnpm w4:import-session --file <transcript.txt> --book <slug>

# Track B: Run agentic session
pnpm w4:run-session --book <slug> [--setting <slug>] [--scenario <type>]

# Analysis (both tracks)
pnpm w4:analyze --session <id>

# Generate W1 feedback
pnpm w4:generate-feedback --session <id>

# List sessions and feedback
pnpm w4:list [--status <status>]
```

---

## Success Criteria

1. **Human import works** - Can import GPT session transcripts
2. **Agentic sessions run** - GM + 3 Players complete a session
3. **Analysis extracts insights** - Meaningful feedback identified
4. **Feedback flows to W1** - Artifacts registered for W1 consumption
5. **Both tracks produce value** - Human and agentic feedback complement each other

---

## Risks

1. **Agentic sessions feel artificial** - Agents may not play naturally
   - Mitigation: Diverse player personas, randomized scenarios

2. **Feedback overload** - Too many items for W1 to process
   - Mitigation: Prioritization, de-duplication, severity filtering

3. **GPT limitations** - Custom GPT may not capture all nuances
   - Mitigation: Supplement with agentic sessions, iterate on GPT prompt

4. **Analysis quality** - May miss subtle issues
   - Mitigation: Human review of high-priority feedback

---

## Build Order Note

W4 is built **after** the core book completes its first full W1→W2→W3 cycle. The workflow is designed to provide ongoing improvement feedback for subsequent iterations.

---

## Strategic Command

Once all individual W4 commands are implemented, create a single entry-point command that orchestrates the entire workflow with persistent state:

### Usage

```bash
# Start new W4 workflow - run agentic playtesting session
pnpm w4:strategic --book=core-rulebook --track=agentic [--setting=<slug>]

# Start new W4 workflow - import human GPT session
pnpm w4:strategic --book=core-rulebook --track=human --transcript=<path>

# Resume existing W4 workflow
pnpm w4:strategic --resume=<plan-id>

# List W4 strategic plans
pnpm w4:strategic --list
```

### Behavior

1. **Creates strategic plan** - Saves to database with unique ID (e.g., `strat_w4_abc123`)
2. **Saves state to artifacts** - `data/w4-strategic/{plan_id}/strategy.json` and `state.json`
3. **Outputs orchestration prompt** - Claude Code reads and executes the workflow
4. **Tracks progress** - State updated after each step for crash recovery
5. **Produces W1 feedback** - Final output is feedback artifacts ready for W1 consumption

### State Tracking

```json
{
  "current_phase": "setup|session|analysis|feedback|complete",
  "track": "agentic|human",
  "session_complete": false,
  "analysis_complete": false,
  "feedback_generated": false,
  "last_updated": "2024-01-15T10:30:00Z"
}
```

### Recovery

If a session crashes, `--resume` generates a new prompt that reads saved state and continues from where it left off. Particularly important for agentic sessions which may be long-running.

### W1 Integration

Generated feedback artifacts are automatically registered for W1 consumption:
```bash
# View generated feedback
pnpm w4:list-feedback --plan=<plan-id>

# Feedback appears in W1 planning input
pnpm w1:strategic --book=core-rulebook --include-playtest-feedback
```

---

## Implementation Notes

### Module Structure

```
src/tooling/w4/
├── prompt-generator.ts    # All W4 prompt generators
├── prompt-writer.ts       # W4PromptWriter class
├── result-saver.ts        # W4ResultSaver class
└── index.ts               # Exports

src/tooling/cli-commands/
├── w4-import-session.ts   # Import GPT session (Track A)
├── w4-run-session.ts      # Run agentic session (Track B)
├── w4-analyze.ts          # Analysis CLI
├── w4-generate-feedback.ts # Feedback generation CLI
└── w4-list.ts             # List sessions CLI
```

### Prompt Files Location

```
data/w4-prompts/{sessionId}/
├── gm-scenario.txt        # GM scenario prompt
├── player-1.txt           # Player 1 prompt
├── player-2.txt           # Player 2 prompt
├── player-3.txt           # Player 3 prompt
├── analysis.txt           # Analysis prompt
└── feedback.txt           # Feedback generation prompt
```

### Reference

See `docs/developers/agent-architecture.md` for the complete prompt-based agent pattern.

---

*This proposal is input for a W4 Boardroom session.*
