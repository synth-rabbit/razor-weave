# Agent Documentation

This directory contains documentation for all automated agentic processes used in the Razorweave project.

## Overview

Razorweave uses automated agents to assist with content creation, review, editing, and publishing. These agents work alongside human creators to maintain quality and consistency.

## Available Documentation

### [Agentic Processes](AGENTIC_PROCESSES.md)

Complete description of all automated agent workflows:

- **Content Development** - Generating new game content
- **Review System** - Multi-dimensional persona-based reviews
- **Iterative Editing** - Content improvement workflows
- **Automated Play Sessions** - Simulated gameplay analysis
- **PDF Creation** - Document generation and design

## Agent Categories

### Content Agents

Located in `src/agents/content/`

**Purpose:** Create and develop game content for the TTRPG system

**Inputs:**
- System rules from `rules/`
- Existing content from `books/`
- Style guides from `docs/style_guides/`

**Outputs:**
- New or revised manuscript content in `books/*/v1/manuscript/`

**Status:** Planned - Implementation in progress

### Review Agents

Located in `src/agents/review/`

**Purpose:** Evaluate content from multiple perspectives using personas

**Inputs:**
- Content from `books/*/v1/manuscript/`
- Persona definitions from `data/personas/pools/`

**Outputs:**
- Raw reviews in `data/reviews/raw/`
- Summarized analysis in `data/reviews/summarized/`
- Review reports in `books/*/v1/reviews/analysis/`

**Status:** Designed - Implementation planned

### Playtest Agents

Located in `src/agents/playtest/`

**Purpose:** Simulate gameplay sessions to test mechanics

**Inputs:**
- Rules from `rules/`
- Setting content from `books/settings/*/v1/manuscript/`

**Outputs:**
- Raw session logs in `data/play_sessions/raw_sessions/`
- Parsed sessions in `data/play_sessions/parsed_sessions/`
- Analysis in `data/play_sessions/analysis/`

**Status:** Planned

### PDF Agents

Located in `src/agents/pdf/`

**Purpose:** Generate and design publication-ready PDFs

**Inputs:**
- HTML from `books/*/v1/exports/html/`
- Assets from `books/*/v1/assets/`
- PDF guidelines from `docs/style_guides/book/pdf-style-guide.md`

**Outputs:**
- Draft PDFs in `books/*/v1/exports/pdf/draft/`
- Digital PDFs in `books/*/v1/exports/pdf/digital/`
- Print PDFs in `books/*/v1/exports/pdf/print/`

**Status:** Planned

### Release Agents

Located in `src/agents/release/`

**Purpose:** Publish completed books and update website

**Inputs:**
- Completed PDFs
- Book metadata
- Website configuration

**Outputs:**
- Published books
- Updated static website

**Status:** Planned

## How Agents Work

### General Workflow

1. **Input Processing** - Agents read source material and configuration
2. **Task Execution** - Agents perform their specialized function
3. **Output Generation** - Agents create artifacts in designated locations
4. **Quality Checks** - Agents validate outputs against quality gates
5. **Reporting** - Agents generate reports on their work

### Integration Points

Agents integrate with:

- **Git Hooks** - Automated validation on commits
- **Claude Hooks** - Integration with Claude Code environment
- **Project Database** - State persistence and history tracking
- **Style Guides** - Adherence to project standards
- **Quality Gates** - Metric validation from `data/metrics/quality_gates/`

## Agent Development

### Creating a New Agent

1. Choose appropriate category (content, review, playtest, pdf, release)
2. Create package in `src/agents/{category}/`
3. Follow [TypeScript Style Guide](../style_guides/typescript/README.md)
4. Implement quality checks against style guides
5. Add tests
6. Document inputs, outputs, and workflow
7. Update this README

### Agent Standards

All agents should:

- Follow TypeScript coding standards
- Validate inputs and outputs
- Log operations for debugging
- Handle errors gracefully
- Respect quality gates
- Generate clear reports
- Be testable in isolation

## Persona System

The review agent uses a multi-dimensional persona system to evaluate content from different perspectives.

**Documentation:**
- Design: `docs/plans/persona-system-index.md`
- Personas: `data/personas/pools/`

**Persona Dimensions:**
- Player experience level
- Genre preferences
- Play style preferences
- Accessibility needs
- Cultural background
- Table dynamics

## Quality Gates

Agents respect quality gates defined in `data/metrics/quality_gates/`.

**Common Metrics:**
- Content completeness
- Style guide adherence
- Mechanical consistency
- Readability scores
- Accessibility compliance

## Troubleshooting

### Agent Not Running

1. Check if agent package is built: `pnpm build`
2. Verify configuration files exist
3. Check logs for error messages
4. Ensure input files are in expected locations

### Poor Quality Outputs

1. Review input content quality
2. Check style guide alignment
3. Verify persona definitions (for review agents)
4. Review quality gate thresholds
5. Check for recent changes to source material

### Integration Issues

1. Verify git hooks are installed: `pnpm setup`
2. Check Claude hooks configuration in `.claude/`
3. Verify database connectivity
4. Review recent workflow changes

## Related Documentation

- [Workflows](../workflows/README.md) - Process documentation
- [End-to-End Pipeline](../workflows/END_TO_END_PIPELINE.md) - Complete workflow
- [Project Database](../workflows/PROJECT_DATABASE.md) - State management
- [Style Guides](../style_guides/README.md) - Quality standards
- [Main Project README](../../README.md) - Project overview

## Future Development

Planned agent enhancements:

- **Learning Agents** - Agents that improve based on feedback
- **Collaborative Agents** - Multiple agents working together
- **Real-time Agents** - Agents that assist during live sessions
- **Optimization Agents** - Agents that tune other agents
