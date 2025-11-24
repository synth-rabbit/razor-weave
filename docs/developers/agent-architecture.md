# Agent Architecture: Prompt-Based Pattern

This document describes the prompt-based agent architecture used in Razorweave workflows.

## Overview

Agents in Razorweave are **not** autonomous processes that call LLM APIs directly. Instead, they follow a **prompt-based pattern** where:

1. CLI commands generate prompt files with full context
2. Claude Code (the human's AI assistant) reads and executes the prompts
3. Results are saved back via CLI commands

This design keeps humans in the loop and leverages Claude Code as the execution engine.

## Why Prompt-Based?

**Problems with direct API calls:**
- Requires API keys in environment
- No human oversight of agent behavior
- Harder to debug and iterate
- Expensive to run repeatedly during development

**Benefits of prompt-based:**
- Human reviews prompts before execution
- Claude Code handles complex reasoning
- Easy to iterate on prompts
- Transparent execution flow
- No API key management

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLI Command                               │
│  pnpm w1:planning --book=X --analysis=Y                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Prompt Generator                                │
│  generatePlanningPrompt(db, context) → prompt text          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Prompt Writer                                   │
│  Writes to data/w1-prompts/{runId}/pm-planning.txt          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              CLI Output                                      │
│  "Next: Read prompt and execute task"                       │
│  "Then: pnpm w1:planning --save --run=X --plan=Y"           │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌──────────┴──────────┐
          ▼                     ▼
┌─────────────────┐   ┌─────────────────────────────────────┐
│  Claude Code    │   │  Result Saver                        │
│  Reads prompt   │──▶│  pnpm w1:planning --save ...         │
│  Executes task  │   │  Saves to workflow, registers artifact│
│  Creates result │   └─────────────────────────────────────┘
└─────────────────┘
```

## Creating a New Agent

### Step 1: Define the Prompt Generator

Create a function that generates the full prompt text:

```typescript
// src/tooling/w1/prompt-generator.ts

export interface MyAgentContext {
  runId: string;
  // ... other context fields
}

export function generateMyAgentPrompt(context: MyAgentContext): string {
  return `# My Agent Task

You are performing [task] for workflow run \`${context.runId}\`.

## Context
[Include all context the agent needs]

## Task
[Clear instructions]

## Output Requirements
Save results using:
\`\`\`bash
pnpm my-command --save --run=${context.runId} --result=<path>
\`\`\`

The result JSON must include:
- field1: description
- field2: description
`;
}
```

### Step 2: Add to Prompt Writer

Add a method to write the prompt to a file:

```typescript
// src/tooling/w1/prompt-writer.ts

export class W1PromptWriter {
  writeMyAgentPrompt(content: string): string {
    const path = join(this.promptsDir, 'my-agent.txt');
    writeFileSync(path, content, 'utf-8');
    return path;
  }
}
```

### Step 3: Add Result Saver Method

Add a method to save the agent's output:

```typescript
// src/tooling/w1/result-saver.ts

export interface MyAgentResult {
  // Define the expected output structure
}

export class W1ResultSaver {
  saveMyAgentResult(result: MyAgentResult, outputPath: string): void {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

    this.artifactRegistry.register({
      workflow_run_id: this.runId,
      artifact_type: 'my_agent_output',
      file_path: outputPath,
      metadata: JSON.stringify({ /* relevant metadata */ }),
    });
  }
}
```

### Step 4: Create CLI Command

Create a CLI with generate and save modes:

```typescript
// src/tooling/cli-commands/my-command.ts

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.save) {
    // Save mode: Accept result from Claude Code
    const saver = new W1ResultSaver(db, args.run);
    const result = JSON.parse(readFileSync(args.result, 'utf-8'));
    saver.saveMyAgentResult(result, outputPath);
    console.log('Result saved. Next step: ...');
    return;
  }

  // Generate mode: Create prompt for Claude Code
  const prompt = generateMyAgentPrompt({ runId, /* ... */ });
  const promptWriter = new W1PromptWriter({ runId });
  const promptPath = promptWriter.writeMyAgentPrompt(prompt);

  console.log(`Prompt written: ${promptPath}`);
  console.log('');
  console.log('Next steps:');
  console.log(`1. Read the prompt: ${promptPath}`);
  console.log('2. Execute the task');
  console.log(`3. Save result: pnpm my-command --save --run=${runId} --result=<path>`);
}
```

## Prompt File Structure

Prompt files follow a consistent structure:

```
# [Agent Name] Task

You are performing [task] for workflow run `{runId}`.

## Context
- Workflow run ID, book ID, relevant IDs
- Embedded content (analysis, chapters, plans)
- Style guides and constraints

## Task
Clear description of what the agent should do.

## Output Requirements
1. Create output file at specific path
2. Run save command with result

The output JSON must include:
- Required fields with descriptions
- Schema reference if applicable
```

## Module Organization

```
src/tooling/w1/
├── prompt-generator.ts    # All prompt generation functions
├── prompt-writer.ts       # W1PromptWriter class
├── result-saver.ts        # W1ResultSaver class
├── metrics-evaluator.ts   # Local evaluation utilities
└── index.ts               # Exports

src/tooling/cli-commands/
├── w1-planning.ts         # Planning CLI (generate + save)
├── w1-content-modify.ts   # Content modification CLI
├── w1-validate.ts         # Validation CLI
└── w1-finalize.ts         # Finalization CLI
```

## Testing Agents

### Unit Tests for Prompt Generation

```typescript
describe('generatePlanningPrompt', () => {
  it('includes run ID in prompt', () => {
    const prompt = generatePlanningPrompt(db, {
      runId: 'test-run-123',
      // ...
    });
    expect(prompt).toContain('test-run-123');
  });

  it('includes save command with correct run ID', () => {
    const prompt = generatePlanningPrompt(db, { runId: 'run-abc', /* ... */ });
    expect(prompt).toContain('--run=run-abc');
  });
});
```

### Manual Testing

1. Run the generate command
2. Read the prompt file
3. Manually execute the task (or have Claude Code do it)
4. Run the save command with your result
5. Verify workflow state updated correctly

## Strategic Workflow Pattern

For complex multi-phase workflows, the **strategic command** pattern provides a single entry point with state persistence:

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│  pnpm w1:strategic --book X --analysis Y                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Create strategic plan (DB + files)                      │
│  2. Generate orchestration prompt                           │
│  3. Output prompt for Claude Code                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Claude Code executes full workflow:                        │
│  - Planning → Content mod → Validation → Human gate         │
│  - Updates state.json after each step                       │
│  - Stops at human gate for approval                         │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Strategic Plan** - Stored in DB (`strategic_plans` table) and files:
   - `data/w1-strategic/{plan_id}/strategy.json` - Goal, areas, configuration
   - `data/w1-strategic/{plan_id}/state.json` - Current progress

2. **Orchestration Prompt** - Single prompt that guides Claude Code through all phases with:
   - Explicit phase instructions
   - State update requirements
   - Decision points (iterate vs proceed)
   - Human gate checkpoints

3. **Resume Capability** - If session crashes:
   ```bash
   pnpm w1:strategic --resume=strat_abc123
   ```
   Generates new prompt that reads saved state and continues.

### Implementation Pattern

```typescript
// src/tooling/w1/prompt-generator.ts

export function generateStrategyPrompt(context: StrategyPromptContext): string {
  return `# Strategic Workflow: ${context.planId}

## Files to Read First
1. Strategy: ${context.artifactsDir}/strategy.json
2. State: ${context.artifactsDir}/state.json

## Phase 1: Planning
[Instructions with CLI commands]

## Phase 2: Content Modification
[Instructions with CLI commands]

## Phase 3: Validation (MANDATORY)
[Instructions - critical checkpoints emphasized]

## Phase 4: Human Gate
[Stop and wait for approval]

## State Management
Update state.json after EVERY step.
`;
}
```

### Reference Implementation

- **W1 Strategic:** `src/tooling/cli-commands/w1-strategic.ts`, `src/tooling/w1/strategy-*.ts`

## Reference Implementations

- **Review System:** `src/tooling/reviews/prompt-generator.ts`, `prompt-writer.ts`
- **W1 Editing:** `src/tooling/w1/prompt-generator.ts`, `prompt-writer.ts`, `result-saver.ts`
- **W1 Strategic:** `src/tooling/w1/strategy-types.ts`, `strategy-repository.ts`

All follow the prompt-based pattern and can be used as templates for new workflows.
