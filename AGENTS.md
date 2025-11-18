# Agent Roles

This document tracks the available agent implementations and agentic processes in the Razorweave project.

## Overview

Razorweave uses "agents" as a broad term for automated processes that assist with content creation, validation, review, and publication. Agents range from simple git hooks to complex AI-powered review systems.

## Agent Categories

### Content Agents (Planned)
Generate or revise manuscript content for books and settings. These agents will help draft, expand, and refine written content while maintaining style consistency.

**Status:** Not yet implemented
**Location:** `src/agents/content/`

### Review Agents (Planned)
Conduct persona-based reviews of content using the [persona system](data/personas/README.md). These agents simulate diverse player perspectives to identify potential issues with rules, narrative, and accessibility.

**Status:** Foundation implemented (persona system)
**Location:** `src/agents/review/`
**Dependencies:** [Persona System](data/personas/README.md), [Project Database](docs/plans/2025-11-18-project-database.md)

### Playtest Agents (Planned)
Simulate or analyze play sessions to validate game mechanics and balance.

**Status:** Not yet implemented
**Location:** `src/agents/playtest/`

### PDF Generation Agents (Planned)
Generate and design PDF outputs from manuscript content.

**Status:** Not yet implemented
**Location:** `src/agents/pdf/`

### Release Agents (Planned)
Handle publication workflows and website updates for new releases.

**Status:** Not yet implemented
**Location:** `src/agents/release/`

### Validation Agents (Implemented)
Simple agents that validate project structure, naming conventions, and documentation quality.

**Status:** ✅ Implemented
**Location:** `src/tooling/validators/`
**Implementation:** Git hooks, CLI scripts

## Current Implementations

### Git Hooks (Simple Agents)
Git hooks function as simple validation agents that enforce quality standards on every commit.

**Location:** `src/tooling/hooks/git/`
**Triggers:**
- `pre-commit`: Runs linters and formatters
- `post-commit`: Updates auto-generated documentation (AGENTS.md, PROMPT.md)
- `commit-msg`: Validates commit message format

**Documentation:** [Git Hooks Guide](docs/workflows/GIT_HOOKS.md)

### Claude Code Hooks (AI-Assisted Agents)
Claude Code hooks integrate AI assistance into the development workflow.

**Location:** `src/tooling/hooks/claude/`
**Triggers:**
- `before-tool-call`: Validates operations before execution
- `session-start`: Initializes context and loads documentation

**Documentation:** [Claude Code Hooks Guide](docs/workflows/CLAUDE_HOOKS.md)

### Auto-Updater Agents
Scripts that automatically update project documentation.

**Implementations:**
- **AGENTS.md Updater** (`src/tooling/updaters/agents-updater.ts`) - Updates this file with agent implementations
- **PROMPT.md Updater** (`src/tooling/updaters/prompt-updater.ts`) - Updates Claude Code prompts
- **Plan Validators** (`src/tooling/validators/plan-naming-validator.ts`) - Validates documentation naming

## Agent Roles

### Content Agents (`src/agents/content/`)
Generate or revise manuscript content for books and settings.

**Implementation files:**
- `index.ts`

### Dist Agents (`src/agents/dist/`)
Agent implementation.

**Implementation files:**
- `index.d.ts`

### Node_modules Agents (`src/agents/node_modules/`)
Agent implementation.

### Pdf Agents (`src/agents/pdf/`)
Generate and design PDF outputs.

**Implementation files:**
- `index.ts`

### Playtest Agents (`src/agents/playtest/`)
Simulate or analyze play sessions.

**Implementation files:**
- `index.ts`

### Release Agents (`src/agents/release/`)
Handle publication and website updates.

**Implementation files:**
- `index.ts`

### Review Agents (`src/agents/review/`)
Conduct persona-based reviews of content.

**Implementation files:**
- `index.ts`


## Database Integration

Agents interact with the [Project Database](docs/plans/2025-11-18-project-database.md) for:
- **Personas**: Review agents use persona data for simulated reviews
- **Review Results**: Storing and querying review feedback
- **Session Tracking**: Recording agent execution history
- **State Management**: Maintaining agent configuration and state

See [Database Schema](src/tooling/database/schema.ts) for details.

## Adding New Agents

To add a new agent implementation:

1. **Create agent directory**: `src/agents/<agent-type>/`
2. **Implement agent interface**: Follow patterns in `src/agents/`
3. **Add tests**: Create `<agent-type>.test.ts`
4. **Update documentation**: This file auto-updates on commit
5. **Register in database** (if needed): Add to agents table

See [Agentic Processes Guide](docs/agents/AGENTIC_PROCESSES.md) for detailed patterns.

## Agent Development Guidelines

- **Idempotency**: Agents should be safe to run multiple times
- **Determinism**: Same input should produce same output (when possible)
- **Logging**: Use structured logging for debugging
- **Error Handling**: Gracefully handle failures and report errors
- **Testing**: All agents must have automated tests
- **Documentation**: Document purpose, inputs, outputs, and dependencies

## Related Documentation

- [Agentic Processes](docs/agents/AGENTIC_PROCESSES.md) - Detailed agent patterns
- [Agent Documentation Index](docs/agents/README.md) - All agent documentation
- [Persona System](data/personas/README.md) - Foundation for review agents
- [Project Database](docs/plans/2025-11-18-project-database.md) - Data storage for agents
